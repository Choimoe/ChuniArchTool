export function initScoreEditor(jsonData) {
  const form = document.getElementById("edit-form");
  const recordSelect = document.getElementById("record-select");
  const editDetails = document.getElementById("edit-details");
  const songIdInput = document.getElementById("song-id");
  const recordList = document.getElementById("record-list");
  const originalScore = document.getElementById("original-score");
  const downloadBtn = document.getElementById("download-modified-btn");

  let selectedRecord = null;
  let selectedOriginalTotal = 0;
  const autoMaintainCheckbox = document.getElementById("edit-auto-maintain");

  songIdInput.addEventListener("change", () => {
    const songId = parseInt(songIdInput.value);
    const records = jsonData.userPlaylogList.filter(
      (log) => log.musicId === songId && log.isClear === true
    );

    if (records.length === 0) {
      recordSelect.classList.add("hidden");
      editDetails.classList.add("hidden");
      downloadBtn.disabled = true;
      return;
    }

    recordList.innerHTML = "";
    records.forEach((record, index) => {
      const option = document.createElement("option");
      option.value = record.userPlayDate;
      const date = record.userPlayDate.replace("T", " ");
      option.textContent = `${date} - 分数: ${record.score} (${
        record.isAllJustice ? "AJ" : record.isFullCombo ? "FC" : "Clear"
      })`;
      recordList.appendChild(option);
    });

    recordSelect.classList.remove("hidden");
    selectedRecord = records[0];
    recordList.value = records[0].userPlayDate;
    showRecordDetails(records[0]);
  });

  recordList.addEventListener("change", () => {
    const userPlayDate = recordList.value;
    selectedRecord = jsonData.userPlaylogList.find(
      (log) => log.userPlayDate === userPlayDate
    );
    if (selectedRecord) showRecordDetails(selectedRecord);
  });

  ["justice", "attack", "guilty"].forEach((type) => {
    document
      .getElementById(`edit-${type}`)
      .addEventListener("input", (e) => updateCalculatedScore(e));
  });
  if (autoMaintainCheckbox) {
    autoMaintainCheckbox.addEventListener("change", () =>
      updateCalculatedScore()
    );
  }

  function updateCalculatedScore(e) {
    if (!selectedRecord) return;

    let justice = Math.max(
      0,
      parseInt(document.getElementById("edit-justice").value) || 0
    );
    let attack = Math.max(
      0,
      parseInt(document.getElementById("edit-attack").value) || 0
    );
    let guilty = Math.max(
      0,
      parseInt(document.getElementById("edit-guilty").value) || 0
    );

    document.getElementById("edit-justice").value = justice;
    document.getElementById("edit-attack").value = attack;
    document.getElementById("edit-guilty").value = guilty;

    const originalTotal = selectedOriginalTotal;

    const autoMaintain = autoMaintainCheckbox
      ? autoMaintainCheckbox.checked
      : true;

    if (autoMaintain) {
      const sumOther = justice + attack + guilty;
      if (sumOther > originalTotal && e && e.target) {
        const field = e.target.id.replace("edit-", "");
        const changedValue = parseInt(e.target.value) || 0;
        const allowed = Math.max(0, originalTotal - (sumOther - changedValue));
        e.target.value = allowed;
        if (field === "justice") justice = allowed;
        if (field === "attack") attack = allowed;
        if (field === "guilty") guilty = allowed;
      } else if (sumOther > originalTotal) {
        let overflow = sumOther - originalTotal;
        if (guilty >= overflow) {
          guilty -= overflow;
          document.getElementById("edit-guilty").value = guilty;
          overflow = 0;
        } else {
          overflow -= guilty;
          guilty = 0;
          document.getElementById("edit-guilty").value = 0;
        }
        if (overflow > 0) {
          if (attack >= overflow) {
            attack -= overflow;
            document.getElementById("edit-attack").value = attack;
            overflow = 0;
          } else {
            overflow -= attack;
            attack = 0;
            document.getElementById("edit-attack").value = 0;
          }
        }
        if (overflow > 0) {
          justice = Math.max(0, justice - overflow);
          document.getElementById("edit-justice").value = justice;
        }
      }

      const criticalVal = Math.max(
        0,
        originalTotal - (justice + attack + guilty)
      );
      document.getElementById("edit-critical").value = criticalVal;
    }

    const criticalCount =
      parseInt(document.getElementById("edit-critical").value) || 0;
    const totalNotes = originalTotal;
    if (!totalNotes || totalNotes <= 0) {
      document.getElementById("calculated-score").textContent = "音符数不正确";
      document.getElementById("calculated-rank").textContent = "-";
      return;
    }

    const criticalScore = 1010000 / totalNotes;
    const justiceScore = criticalScore * (100 / 101);
    const attackScore = criticalScore * (50 / 101);

    const score =
      criticalCount * criticalScore +
      justice * justiceScore +
      attack * attackScore;

    const displayScore = Math.floor(score);
    document.getElementById("calculated-score").textContent = displayScore;

    let rank = "D";
    if (displayScore >= 1009000) rank = "SSSP";
    else if (displayScore >= 1009000) rank = "SSS";
    else if (displayScore >= 1007500) rank = "SSP";
    else if (displayScore >= 1005000) rank = "SS";
    else if (displayScore >= 990000) rank = "SP";
    else if (displayScore >= 975000) rank = "S";
    else if (displayScore >= 950000) rank = "AAA";
    else if (displayScore >= 925000) rank = "AA";
    else if (displayScore >= 900000) rank = "A";
    else if (displayScore >= 800000) rank = "BBB";
    else if (displayScore >= 700000) rank = "BB";
    else if (displayScore >= 600000) rank = "B";
    else if (displayScore >= 500000) rank = "C";

    document.getElementById("calculated-rank").textContent = rank;

    let status = "Clear";
    if (guilty === 0 && attack === 0) {
      status = "All Justice";
    } else if (guilty === 0) {
      status = "Full Combo";
    }
    document.getElementById("calculated-status").textContent = status;
  }

  function showRecordDetails(record) {
    editDetails.classList.remove("hidden");
    downloadBtn.disabled = false;

    const totalNotes =
      record.judgeCritical +
      record.judgeHeaven +
      record.judgeJustice +
      record.judgeAttack +
      record.judgeGuilty;

    selectedOriginalTotal = totalNotes;
    originalScore.innerHTML = `
            <p>分数: ${record.score}</p>
            <p>CRITICAL: ${record.judgeCritical + record.judgeHeaven}</p>
            <p>JUSTICE: ${record.judgeJustice}</p>
            <p>ATTACK: ${record.judgeAttack}</p>
            <p>MISS: ${record.judgeGuilty}</p>
            <p>总音符数: ${totalNotes}</p>
        `;

    document.getElementById("edit-critical").value =
      record.judgeCritical + record.judgeHeaven;
    document.getElementById("edit-justice").value = record.judgeJustice;
    document.getElementById("edit-attack").value = record.judgeAttack;
    document.getElementById("edit-guilty").value = record.judgeGuilty;

    const clearStatus = record.isAllJustice
      ? "alljustice"
      : record.isFullCombo
      ? "fullcombo"
      : "clear";
    document.getElementById("edit-fullChainKind").value = record.fullChainKind;

    updateCalculatedScore();
  }

  downloadBtn.addEventListener("click", () => {
    if (!selectedRecord) return;

    const modifiedRecord = { ...selectedRecord };
    modifiedRecord.judgeCritical =
      parseInt(document.getElementById("edit-critical").value) || 0;
    modifiedRecord.judgeJustice =
      parseInt(document.getElementById("edit-justice").value) || 0;
    modifiedRecord.judgeAttack =
      parseInt(document.getElementById("edit-attack").value) || 0;
    modifiedRecord.judgeGuilty =
      parseInt(document.getElementById("edit-guilty").value) || 0;
    modifiedRecord.judgeHeaven = 0;

    const hasNoMiss = modifiedRecord.judgeGuilty === 0;
    const hasNoAttack = modifiedRecord.judgeAttack === 0;
    
    modifiedRecord.isClear = true;
    modifiedRecord.isFullCombo = hasNoMiss;
    modifiedRecord.isAllJustice = hasNoMiss && hasNoAttack;
    modifiedRecord.fullChainKind = parseInt(
      document.getElementById("edit-fullChainKind").value
    );

    const totalNotes =
      modifiedRecord.judgeCritical +
      modifiedRecord.judgeHeaven +
      modifiedRecord.judgeJustice +
      modifiedRecord.judgeAttack +
      modifiedRecord.judgeGuilty;
    const criticalScore = Math.floor(1010000 / totalNotes);
    const justiceScore = Math.floor(criticalScore * (100 / 101));
    const attackScore = Math.floor(criticalScore * (50 / 101));

    modifiedRecord.score =
      modifiedRecord.judgeCritical * criticalScore +
      modifiedRecord.judgeJustice * justiceScore +
      modifiedRecord.judgeAttack * attackScore;

    const recordIndex = jsonData.userPlaylogList.findIndex(
      (log) => log.userPlayDate === selectedRecord.userPlayDate
    );
    if (recordIndex !== -1) {
      jsonData.userPlaylogList[recordIndex] = modifiedRecord;
    }

    if (jsonData.userMusicDetailList) {
      const musicDetailIndex = jsonData.userMusicDetailList.findIndex(
        (detail) => detail.musicId === modifiedRecord.musicId && detail.level === modifiedRecord.level
      );
      
      if (musicDetailIndex !== -1) {
        const currentDetail = jsonData.userMusicDetailList[musicDetailIndex];
        
        if (modifiedRecord.score > currentDetail.scoreMax) {
          currentDetail.scoreMax = modifiedRecord.score;
          
          if (modifiedRecord.isAllJustice) {
            currentDetail.isAllJustice = true;
            currentDetail.isFullCombo = true;
            currentDetail.missCount = 0;
            currentDetail.maxComboCount = totalNotes;
          } else if (modifiedRecord.isFullCombo) {
            currentDetail.isFullCombo = true;
            currentDetail.maxComboCount = totalNotes;
            if (!currentDetail.isAllJustice) {
              currentDetail.missCount = modifiedRecord.judgeGuilty;
            }
          } else {
            if (modifiedRecord.judgeGuilty < currentDetail.missCount) {
              currentDetail.missCount = modifiedRecord.judgeGuilty;
            }
          }
          
          if (modifiedRecord.score >= 1009000) currentDetail.scoreRank = 13; // SSSP
          else if (modifiedRecord.score >= 1007500) currentDetail.scoreRank = 12; // SSS
          else if (modifiedRecord.score >= 1005000) currentDetail.scoreRank = 11; // SSP
          else if (modifiedRecord.score >= 1000000) currentDetail.scoreRank = 10; // SS
          else if (modifiedRecord.score >= 990000) currentDetail.scoreRank = 9; // SP
          else if (modifiedRecord.score >= 975000) currentDetail.scoreRank = 8; // S
          else if (modifiedRecord.score >= 950000) currentDetail.scoreRank = 7; // AAA
          else if (modifiedRecord.score >= 925000) currentDetail.scoreRank = 6; // AA
          else if (modifiedRecord.score >= 900000) currentDetail.scoreRank = 5; // A
          else if (modifiedRecord.score >= 800000) currentDetail.scoreRank = 4; // BBB
          else if (modifiedRecord.score >= 700000) currentDetail.scoreRank = 3; // BB
          else if (modifiedRecord.score >= 600000) currentDetail.scoreRank = 2; // B
          else if (modifiedRecord.score >= 500000) currentDetail.scoreRank = 1; // C
          else currentDetail.scoreRank = 0; // D
        }
      }
    }

    const jsonString = JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `modified_archive_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  form.classList.remove("hidden");
}
