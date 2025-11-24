// 完整音击成绩修改与定数/白金/技术分计算
export function initOngekiScoreEditor(jsonData) {
  const form = document.getElementById('ongeki-form')
  const recordSelectWrap = document.getElementById('ongeki-record-select')
  const editDetails = document.getElementById('ongeki-edit-details')
  const songIdInput = document.getElementById('ongeki-song-id')
  const recordList = document.getElementById('ongeki-record-list')
  const originalScoreBox = document.getElementById('ongeki-original-score')
  const downloadBtn = document.getElementById('ongeki-download-modified-btn')

  // Editable inputs
  const inpPlatinumCritical = document.getElementById('ongeki-edit-platinum-critical')
  const inpCriticalBreak = document.getElementById('ongeki-edit-critical-break')
  const inpBreak = document.getElementById('ongeki-edit-break')
  const inpHit = document.getElementById('ongeki-edit-hit')
  const inpMiss = document.getElementById('ongeki-edit-miss')
  const inpBell = document.getElementById('ongeki-edit-bell')
  const inpDamage = document.getElementById('ongeki-edit-damage')
  const inpTotalBell = document.getElementById('ongeki-edit-total-bell')
  const btnAdvanced = document.getElementById('ongeki-toggle-advanced-btn')
  // 状态改为自动判定，不再使用手动控件

  // Display spans
  const spTechScore = document.getElementById('ongeki-tech-score')
  const spTechMax = document.getElementById('ongeki-tech-max')
  const spTechRank = document.getElementById('ongeki-tech-rank')
  const spTechConst = document.getElementById('ongeki-tech-const')
  const spPlatScore = document.getElementById('ongeki-platinum-score')
  const spPlatMax = document.getElementById('ongeki-platinum-max')
  const spPlatStar = document.getElementById('ongeki-platinum-star')
  const spInferredPlat = document.getElementById('ongeki-inferred-platinum')
  const spIdConst = document.getElementById('ongeki-id-const')
  const spTotalConst = document.getElementById('ongeki-total-const')
  const spStatusDisplay = document.getElementById('ongeki-status-display')

  let selectedRecord = null
  let fixedTotalNotes = null // 推断的总音符数（不含 Bell）
  let lastChangedInput = null // 最近一次用户修改的输入，用于溢出回退
  let advancedMode = false // 高级编辑模式：允许修改 Critical Break 与 Bell 总数并重新定义总音符
  const TECH_THEORY = 1010000

  songIdInput.addEventListener('wheel', e => e.preventDefault())

  songIdInput.addEventListener('change', () => {
    const songId = parseInt(songIdInput.value)
    if (isNaN(songId)) return
    const records = (jsonData.userPlaylogList || []).filter(r => r.musicId === songId)
    if (!records.length) {
      recordSelectWrap.classList.add('hidden')
      editDetails.classList.add('hidden')
      downloadBtn.disabled = true
      return
    }
    recordList.innerHTML = ''
    const levelNames = ['Basic','Advanced','Expert','Master','Ultima']
    records.forEach(r => {
      const opt = document.createElement('option')
      opt.value = r.userPlayDate
      const date = r.userPlayDate.replace('T',' ')
      const levelName = levelNames[r.level] || `Lv${r.level}`
      opt.textContent = `${date} - ${levelName} - Tech:${r.techScore || r.score || 0}`
      recordList.appendChild(opt)
    })
    recordSelectWrap.classList.remove('hidden')
    recordList.value = records[0].userPlayDate
    selectedRecord = records[0]
    showRecord(selectedRecord)
  })

  recordList.addEventListener('change', () => {
    const date = recordList.value
    selectedRecord = (jsonData.userPlaylogList || []).find(r => r.userPlayDate === date) || null
    if (selectedRecord) showRecord(selectedRecord)
  })

  // 固定 Critical Break 为原值只读
  inpCriticalBreak.readOnly = true
  inpTotalBell.readOnly = true

  ;[inpPlatinumCritical, /* criticalBreak 不监听修改 */ inpBreak, inpHit, inpMiss, inpBell, inpDamage].forEach(inp => {
    inp.addEventListener('input', e => {
      lastChangedInput = inp
      updateAll()
    })
  })

  btnAdvanced.addEventListener('click', () => {
    advancedMode = !advancedMode
    if (advancedMode) {
      btnAdvanced.textContent = '关闭高级编辑'
      btnAdvanced.classList.add('bg-red-600')
      inpCriticalBreak.readOnly = false
      inpTotalBell.readOnly = false
      // 高级模式保持原固定总音符，不重置 fixedTotalNotes
    } else {
      btnAdvanced.textContent = '开启高级编辑'
      btnAdvanced.classList.remove('bg-red-600')
      inpCriticalBreak.readOnly = true
      inpTotalBell.readOnly = true
      // 关闭高级模式重新根据当前记录推断固定总音符，保留当前判定但重新约束 MISS
      if (selectedRecord) {
        reInferFixedTotalFromCurrentInputs()
      }
    }
    updateAll()
  })

  function reInferFixedTotalFromCurrentInputs() {
    // 使用当前锁定的 Critical Break, Break, Hit, Miss 重新推断固定总音符数为其和
    const C = num(inpCriticalBreak)
    const br = num(inpBreak)
    const hit = num(inpHit)
    const miss = num(inpMiss)
    fixedTotalNotes = C + br + hit + miss
  }

  function inferPlatinumCritical(rec) {
    const C = rec.judgeCriticalBreak || 0
    const bellCount = rec.bellCount || 0
    const totalBell = rec.totalBellCount || 0
    const damage = rec.damageCount || 0
    const platScore = rec.platinumScore
    const nonBellNotes = (rec.judgeCriticalBreak||0) + (rec.judgeBreak||0) + (rec.judgeHit||0) + (rec.judgeMiss||0)
    const theoryPlat = nonBellNotes * 2
    if (typeof platScore !== 'number' || platScore < 0) {
      // fallback: assume all critical are platinum if not stored
      return Math.min(C, theoryPlat/2)
    }
    // P = platinumScore + 2*totalBell - 2*bellCount + 2*damageCount - C
    let P = platScore + 2*totalBell - 2*bellCount + 2*damage - C
    if (P < 0) P = 0
    if (P > C) P = C
    return P
  }

  function computeTechScore(cb, br, hit, miss, bell, totalBell, damage) {
    const noteCount = cb + br + hit + miss
    if (noteCount === 0) return 0
    // 使用整数方式：质量分子=1000*cb + 900*br + 600*hit；分母=1000*noteCount
    const qualityNumerator = 1000*cb + 900*br + 600*hit
    const qualityDenominator = 1000*noteCount
    // base = floor(950000 * qualityNumerator / qualityDenominator)
    const base = Math.floor(950000 * qualityNumerator / qualityDenominator)
    const bellScore = totalBell > 0 ? Math.floor(60000 * bell / totalBell) : 0
    let tech = base + bellScore - damage * 10
    if (tech < 0) tech = 0
    if (tech > TECH_THEORY) tech = TECH_THEORY
    return tech
  }

  function mapTechRank(score) {
    if (score >= 1007500) return 'SSS+'
    if (score >= 1000000) return 'SSS'
    if (score >= 990000) return 'SS'
    if (score >= 970000) return 'S'
    if (score >= 940000) return 'AAA'
    if (score >= 900000) return 'AA'
    if (score >= 850000) return 'A'
    if (score >= 800000) return 'BBB'
    if (score >= 750000) return 'BB'
    if (score >= 700000) return 'B'
    if (score >= 500000) return 'C'
    return 'D'
  }

  function computeTechnicalConstant(score) {
    if (score < 750000) return null // 不计算
    // 800k~900k BBB 区间
    if (score >= 800000 && score < 900000) {
      const delta = score - 800000
      return (-6.000 + (delta/50)*0.001).toFixed(3)
    }
    // 900k~970k AA/AAA 共享斜率 17.5 每+0.001
    if (score >= 900000 && score < 970000) {
      const delta = score - 900000
      return (-4.000 + (delta/17.5)*0.001).toFixed(3)
    }
    // 970k~990k S 区间 26.666.. 每+0.001
    if (score >= 970000 && score < 990000) {
      const delta = score - 970000
      return (0 + (delta/26.6666667)*0.001).toFixed(3)
    }
    // 990k~1,000,000 SS 区间 20 每+0.001
    if (score >= 990000 && score < 1000000) {
      const delta = score - 990000
      return (0.750 + (delta/20)*0.001).toFixed(3)
    }
    // 1,000,000~1,007,500 SSS 区间 15 每+0.001
    if (score >= 1000000 && score < 1007500) {
      const delta = score - 1000000
      return (1.250 + (delta/15)*0.001).toFixed(3)
    }
    // 1,007,500~1,010,000 SSS+ 区间 10 每+0.001
    if (score >= 1007500) {
      const delta = score - 1007500
      return (1.750 + (delta/10)*0.001).toFixed(3)
    }
    // 750k~800k BB/B 区未给明确, 设为 null
    return null
  }

  function computeIdentificationConstant(score, isFullBell, isFullCombo, isAllBreak) {
    let idConst = 0
    // Rank 加成
    if (score >= 1007500) idConst += 0.3
    else if (score >= 1000000) idConst += 0.2
    else if (score >= 990000) idConst += 0.1
    // FB
    if (isFullBell) idConst += 0.05
    // FC / AB / AB+
    if (score === 1010000 && isAllBreak) {
      idConst += 0.35 // AB+
    } else if (isAllBreak) {
      idConst += 0.3 // AB
    } else if (isFullCombo) {
      idConst += 0.1 // FC
    }
    return idConst
  }

  function computePlatinumScore(P, C, bellCount, totalBell, damage, nonBellNotes) {
    const theory = nonBellNotes * 2
    // platinumScore = (P + C) - 2*(totalBell - bellCount) - 2*damage
    const score = (P + C) - 2*(totalBell - bellCount) - 2*damage
    return { score, theory }
  }

  function computePlatinumStar(score, theory) {
    if (theory <= 0) return 0
    const rate = score / theory
    if (rate >= 0.98) return 5
    if (rate >= 0.97) return 4
    if (rate >= 0.96) return 3
    if (rate >= 0.95) return 2
    if (rate >= 0.94) return 1
    return 0
  }

  // 不再有状态转换函数，状态自动推断

  function num(el) { return parseInt(el.value) || 0 }

  function showRecord(rec) {
    editDetails.classList.remove('hidden')
    downloadBtn.disabled = false

    const inferredP = inferPlatinumCritical(rec)
    const cb = rec.judgeCriticalBreak || 0
    const br = rec.judgeBreak || 0
    const hit = rec.judgeHit || 0
    const miss = rec.judgeMiss || 0
    const bell = rec.bellCount || 0
    const totalBell = rec.totalBellCount || 0
    const damage = rec.damageCount || 0
    const nonBellNotesCurrent = cb + br + hit + miss
    const techBase = rec.techScore || rec.score || 0
    const bellRate = totalBell > 0 ? bell / totalBell : 0
    const bellTerm = bellRate * 60000
    const w = 1000*cb + 900*br + 600*hit
    let inferred = nonBellNotesCurrent
    const S = techBase + (rec.damageCount||0)*10 - Math.floor(bellTerm)
    if (w > 0 && S > 0) {
      // 反推：techBase ≈ floor(950000 * w / (1000*inferred)) + bellTerm - damage*10
      // 粗略反解：inferred ≈ floor( w * 950000 / ( (techBase + damage*10 - bellTerm) * 1000 ) )
      inferred = Math.floor( w * 950000 / ( (S) * 1000 ) )
      if (inferred < nonBellNotesCurrent) inferred = nonBellNotesCurrent
    }
    fixedTotalNotes = inferred
    const extraMissing = inferred - nonBellNotesCurrent

    originalScoreBox.innerHTML = `
      <p>TechScore: ${rec.techScore || 0}</p>
      <p>PlatinumScore: ${rec.platinumScore || 0}</p>
      <p>CRITICAL BREAK: ${cb}</p>
      <p>BREAK: ${br}</p>
      <p>HIT: ${hit}</p>
      <p>MISS: ${miss}</p>
      <p>推断总音符数(不含 Bell): ${fixedTotalNotes}，补齐缺失 MISS: ${extraMissing}</p>
      <p>Bell: ${bell} / ${totalBell}</p>
      <p>Damage: ${damage}</p>
    `

    inpCriticalBreak.value = cb
    inpBreak.value = br
    inpHit.value = hit
    inpMiss.value = miss + extraMissing
    inpBell.value = bell
    inpTotalBell.value = totalBell
    inpDamage.value = damage
    inpPlatinumCritical.value = inferredP
    updateAll()
  }

  function updateAll() {
    if (!selectedRecord) return
    // 约束：Platinum Critical <= Critical Break
    if (num(inpPlatinumCritical) > num(inpCriticalBreak)) {
      inpPlatinumCritical.value = inpCriticalBreak.value
    }
    let P = num(inpPlatinumCritical)
    let C = num(inpCriticalBreak)
    let br = num(inpBreak)
    let hit = num(inpHit)
    let miss = num(inpMiss)
    const bell = num(inpBell)
    const totalBell = num(inpTotalBell)
    const damage = num(inpDamage)
    // 维持总音符数：如果当前总和 < fixedTotalNotes，用 MISS 补齐
    let currentSum = C + br + hit + miss
    let nonBellNotes
    if (!advancedMode) {
      // 保持固定总音符，自动以 Critical Break 补齐/抵消
      if (fixedTotalNotes !== null) {
        const nonCriticalSum = br + hit + miss
        if (nonCriticalSum > fixedTotalNotes) {
          const overflow = nonCriticalSum - fixedTotalNotes
          if (lastChangedInput && lastChangedInput !== inpCriticalBreak) {
            const currVal = parseInt(lastChangedInput.value)||0
            const newVal = Math.max(0, currVal - overflow)
            lastChangedInput.value = newVal
            br = num(inpBreak)
            hit = num(inpHit)
            miss = num(inpMiss)
          } else {
            const missVal = parseInt(inpMiss.value)||0
            const newMiss = Math.max(0, missVal - overflow)
            inpMiss.value = newMiss
            miss = newMiss
          }
        }
        // 重新计算 C
        const adjustedNonCritical = br + hit + miss
        C = fixedTotalNotes - adjustedNonCritical
        if (C < 0) {
          // 不能为负，进一步回退最后修改项
            const needReduce = -C
            if (lastChangedInput && lastChangedInput !== inpCriticalBreak) {
              const currVal = parseInt(lastChangedInput.value)||0
              const newVal = Math.max(0, currVal - needReduce)
              lastChangedInput.value = newVal
              br = num(inpBreak); hit = num(inpHit); miss = num(inpMiss)
              C = fixedTotalNotes - (br + hit + miss)
            } else {
              // 回退 miss
              const missVal2 = parseInt(inpMiss.value)||0
              const newMiss2 = Math.max(0, missVal2 - needReduce)
              inpMiss.value = newMiss2
              miss = newMiss2
              C = fixedTotalNotes - (br + hit + miss)
            }
        }
        inpCriticalBreak.value = C
        // Platinum Critical 重新约束
        if (num(inpPlatinumCritical) > C) inpPlatinumCritical.value = C
        nonBellNotes = fixedTotalNotes
      } else {
        // 尚未设置 fixedTotalNotes，使用当前和并锁定
        fixedTotalNotes = currentSum
        nonBellNotes = fixedTotalNotes
      }
    } else {
      // 高级模式：允许自由调整，固定总音符随变化更新
      fixedTotalNotes = currentSum
      nonBellNotes = fixedTotalNotes
    }

    const techScore = computeTechScore(C, br, hit, miss, bell, totalBell, damage)
    const techRank = mapTechRank(techScore)
    const techConstRaw = computeTechnicalConstant(techScore)
    const { score: platinumScore, theory: platinumTheory } = computePlatinumScore(P, C, bell, totalBell, damage, nonBellNotes)
    const star = computePlatinumStar(platinumScore, platinumTheory)
    const isFullBell = bell === totalBell && totalBell > 0
    const isFullCombo = miss === 0
    const isAllBreak = (hit === 0 && miss === 0)
    const idConst = computeIdentificationConstant(techScore, isFullBell, isFullCombo, isAllBreak)
    const techConst = techConstRaw === null ? '-' : techConstRaw
    const totalConst = techConstRaw === null ? idConst.toFixed(3) : (parseFloat(techConstRaw) + idConst).toFixed(3)

    // 更新显示
    spTechScore.textContent = techScore
    spTechMax.textContent = TECH_THEORY
    spTechRank.textContent = techRank
    spTechConst.textContent = techConst
    spPlatScore.textContent = platinumScore
    spPlatMax.textContent = platinumTheory
    spPlatStar.textContent = star
    spInferredPlat.textContent = P
    spIdConst.textContent = idConst.toFixed(3)
    spTotalConst.textContent = totalConst
    const statusStr = isAllBreak ? (techScore === TECH_THEORY ? 'AB+' : 'AB') : (isFullCombo ? 'FC' : 'None')
    if (isFullBell) {
      spStatusDisplay.textContent = statusStr + ' / FB'
    } else {
      spStatusDisplay.textContent = statusStr
    }
  }

  downloadBtn.addEventListener('click', () => {
    if (!selectedRecord) return
    // 重新计算 & 更新记录
    let P = num(inpPlatinumCritical)
    const C = num(inpCriticalBreak)
    let br = num(inpBreak)
    let hit = num(inpHit)
    let miss = num(inpMiss)
    const bell = num(inpBell)
    const totalBell = num(inpTotalBell)
    const damage = num(inpDamage)
    const nonBellNotes = fixedTotalNotes !== null ? fixedTotalNotes : (C + br + hit + miss)
    const techScore = computeTechScore(C, br, hit, miss, bell, totalBell, damage)
    const techRankName = mapTechRank(techScore)
    const techConstRaw = computeTechnicalConstant(techScore)
    const { score: platinumScore, theory: platinumTheory } = computePlatinumScore(P, C, bell, totalBell, damage, nonBellNotes)
    const platinumStar = computePlatinumStar(platinumScore, platinumTheory)
    const isFullBell = bell === totalBell && totalBell > 0
    const isFullCombo = miss === 0
    const isAllBreak = (br === 0 && hit === 0 && miss === 0)
    const rankCodeMap = {
      'D':1,'C':2,'B':3,'BB':4,'BBB':5,'A':6,'AA':7,'AAA':8,'S':9,'SS':10,'SSS':11,'SSS+':12
    }
    const modified = { ...selectedRecord }
    modified.judgeCriticalBreak = C
    modified.judgeBreak = br
    modified.judgeHit = hit
    modified.judgeMiss = miss
    modified.bellCount = bell
    modified.totalBellCount = totalBell
    modified.damageCount = damage
    modified.techScore = techScore
    modified.techScoreRank = rankCodeMap[techRankName] || modified.techScoreRank
    modified.platinumScore = platinumScore
    modified.platinumScoreStar = platinumStar
    modified.isFullBell = isFullBell
    modified.isFullCombo = isFullCombo
    modified.isAllBreak = isAllBreak
    modified.isTechNewRecord = false
    modified._calcTechnicalConstant = techConstRaw
    modified._calcIdentificationConstant = computeIdentificationConstant(techScore, isFullBell, isFullCombo, isAllBreak)
    modified._calcTotalConstant = modified._calcTechnicalConstant === null ? modified._calcIdentificationConstant : parseFloat(modified._calcTechnicalConstant) + modified._calcIdentificationConstant

    const idx = (jsonData.userPlaylogList||[]).findIndex(l => l.userPlayDate === selectedRecord.userPlayDate)
    if (idx !== -1) jsonData.userPlaylogList[idx] = modified

    if (Array.isArray(jsonData.userMusicDetailList)) {
      const detail = jsonData.userMusicDetailList.find(d => d.musicId === modified.musicId && d.level === modified.level)
      if (detail) {
        if (typeof detail.techScoreMax !== 'number' || techScore > detail.techScoreMax) {
          detail.techScoreMax = techScore
          detail.techScoreRank = modified.techScoreRank
          modified.isTechNewRecord = true
        }
        if (typeof detail.platinumScoreMax !== 'number' || platinumScore > detail.platinumScoreMax) {
          detail.platinumScoreMax = platinumScore
          detail.platinumScoreStar = platinumStar
        }
        if (isFullBell && !detail.isFullBell) detail.isFullBell = true
        if (isFullCombo && !detail.isFullCombo) detail.isFullCombo = true
        if (isAllBreak) {
          if ('isAllBreak' in detail && !detail.isAllBreak) detail.isAllBreak = true
          if ('isAllBreake' in detail && !detail.isAllBreake) detail.isAllBreake = true
        }
      }
    }

    const jsonString = JSON.stringify(jsonData)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `modified_ongeki_${date}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  })

  form.classList.remove('hidden')
}