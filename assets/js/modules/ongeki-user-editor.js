import { setupFileDropZone, downloadFile, readFileAsText } from "./file-utils.js";
import { showAlert, clearAlert } from "./ui-utils.js";

const CHARACTER_META = [
  { id: 1000, name: "星咲明里", group: "ASTERISM" },
  { id: 1001, name: "藤泽柚子", group: "ASTERISM" },
  { id: 1002, name: "三角葵", group: "ASTERISM" },
  { id: 1003, name: "高濑梨绪", group: "⊿TRiEDGE" },
  { id: 1004, name: "蓝原椿", group: "⊿TRiEDGE" },
  { id: 1005, name: "结城莉玖", group: "⊿TRiEDGE" },
  { id: 1006, name: "早乙女彩华", group: "bitter flavor" },
  { id: 1007, name: "樱井春菜", group: "bitter flavor" },
  { id: 1008, name: "井之原小星", group: "7EVENDAYS⇔HOLIDAYS" },
  { id: 1009, name: "柏木咲姬", group: "7EVENDAYS⇔HOLIDAYS" },
  { id: 1010, name: "逢坂茜", group: "R.B.P." },
  { id: 1011, name: "珠洲岛有栖", group: "R.B.P." },
  { id: 1012, name: "九条枫", group: "R.B.P." },
  { id: 1013, name: "日向千夏", group: "マーチング ポケッツ" },
  { id: 1014, name: "柏木美亚", group: "マーチング ポケッツ" },
  { id: 1015, name: "东云纺", group: "マーチング ポケッツ" },
  { id: 1016, name: "皇城刹那", group: "刹那" },
];

export function initOngekiUserEditor() {
  console.log('[OngekiUserEditor] 初始化');
  const alertContainer = document.getElementById("ongeki-user-alert");
  const form = document.getElementById("ongeki-user-form");
  let userData = null;
  let characterList = null;
  let originalJson = null;
  let currentGroup = CHARACTER_META[0].group;

  const GROUPS = [
    "ASTERISM",
    "⊿TRiEDGE",
    "bitter flavor",
    "7EVENDAYS⇔HOLIDAYS",
    "R.B.P.",
    "マーチング ポケッツ",
    "刹那"
  ];

  setupFileDropZone(
    "ongeki-user-drop-zone",
    "ongeki-user-json-file",
    "ongeki-user-file-name",
    async (file) => {
      console.log('[OngekiUserEditor] 文件选择', file);
      clearAlert(alertContainer);
      form.classList.add("hidden");
      try {
        const text = await readFileAsText(file);
        console.log('[OngekiUserEditor] 文件内容', text);
        const json = JSON.parse(text);
        console.log('[OngekiUserEditor] 解析 JSON', json);
        if (!json.userData || !Array.isArray(json.userCharacterList)) {
          throw new Error("无效的 JSON 格式：缺少 userData 或 userCharacterList 数组。");
        }
        userData = json.userData;
        characterList = json.userCharacterList;
        originalJson = json;
        fillUserForm(userData);
        renderGroupTabs();
        renderGroupPanel(currentGroup);
        form.classList.remove("hidden");
        showAlert(alertContainer, "档案加载成功，可以开始修改。", "success");
      } catch (err) {
        console.error('[OngekiUserEditor] 加载失败', err);
        showAlert(alertContainer, `加载失败：${err.message}`, "error");
      }
    }
  );

  function fillUserForm(data) {
    document.getElementById("ongeki-user-level").value = data.level || 1;
    document.getElementById("ongeki-user-reincarnation").value = data.reincarnationNum || 0;
    document.getElementById("ongeki-user-exp").value = data.exp || 0;
    document.getElementById("ongeki-user-point").value = data.point || 0;
    document.getElementById("ongeki-user-playcount").value = data.playCount || 0;
    document.getElementById("ongeki-user-jewel").value = data.jewelCount || 0;
  }

  function renderGroupTabs() {
    const tabs = document.getElementById('ongeki-group-tabs');
    tabs.innerHTML = '';
    GROUPS.forEach(group => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = group;
      btn.className = `px-4 py-2 rounded-t-lg font-bold text-sm ${currentGroup === group ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-indigo-400 hover:text-white'}`;
      btn.onclick = () => {
        currentGroup = group;
        renderGroupTabs();
        renderGroupPanel(group);
      };
      tabs.appendChild(btn);
    });
  }

  function renderGroupPanel(group) {
    const panel = document.getElementById('ongeki-group-panel');
    panel.innerHTML = '';
    const chars = CHARACTER_META.filter(meta => meta.group === group);
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    chars.forEach(meta => {
      const char = characterList ? characterList.find(c => c.characterId === meta.id) : {};
      const card = document.createElement('div');
      card.className = 'bg-gray-900 rounded-lg p-4 flex flex-col gap-2';
      card.innerHTML = `
        <div class="font-bold text-lg text-indigo-300 mb-2">${meta.name}</div>
        <div class="flex items-center gap-2 mb-1">
          <label class="text-gray-300 w-24">等级</label>
          <input type="number" id="char-level-${meta.id}" class="w-24 bg-gray-800 text-white rounded px-2 py-1" min="0" value="${char?.intimateLevel ?? 0}" />
        </div>
        <div class="flex items-center gap-2 mb-1">
          <label class="text-gray-300 w-24">亲密度值</label>
          <input type="number" id="char-count-${meta.id}" class="w-24 bg-gray-800 text-white rounded px-2 py-1" min="0" value="${char?.intimateCount ?? 0}" />
        </div>
        <div class="flex items-center gap-2 mb-1">
          <label class="text-gray-300 w-24">奖励值</label>
          <input type="number" id="char-rewarded-${meta.id}" class="w-24 bg-gray-800 text-white rounded px-2 py-1" min="0" value="${char?.intimateCountRewarded ?? 0}" />
        </div>
      `;
      grid.appendChild(card);
    });
    panel.appendChild(grid);
  }

  function collectUserForm() {
    return {
      level: parseInt(document.getElementById("ongeki-user-level").value) || 1,
      reincarnationNum: parseInt(document.getElementById("ongeki-user-reincarnation").value) || 0,
      exp: parseInt(document.getElementById("ongeki-user-exp").value) || 0,
      point: parseInt(document.getElementById("ongeki-user-point").value) || 0,
      playCount: parseInt(document.getElementById("ongeki-user-playcount").value) || 0,
      jewelCount: parseInt(document.getElementById("ongeki-user-jewel").value) || 0,
    };
  }

  function collectCharacterForm() {
    // 只收集所有角色，不分组
    return CHARACTER_META.map(meta => {
      return {
        characterId: meta.id,
        intimateLevel: parseInt(document.getElementById(`char-level-${meta.id}`)?.value) || 0,
        intimateCount: parseInt(document.getElementById(`char-count-${meta.id}`)?.value) || 0,
        intimateCountRewarded: parseInt(document.getElementById(`char-rewarded-${meta.id}`)?.value) || 0,
      };
    });
  }

  document.getElementById("ongeki-user-download-btn").addEventListener("click", () => {
    if (!userData || !characterList) return;
    // 合并 userData 字段，只覆盖你提供的内容，保留其它字段
    const mergedUserData = { ...userData, ...collectUserForm() };
    // 合并 userCharacterList，每个角色只覆盖你提供的内容，保留其它字段
    const newCharList = characterList.map((char, idx) => ({
      ...char,
      ...collectCharacterForm()[idx]
    }));
    const newJson = {
      ...originalJson,
      userData: mergedUserData,
      userCharacterList: newCharList,
    };
    const date = new Date().toISOString().split("T")[0];
    const jsonStr = JSON.stringify(newJson);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ongeki_user_modified_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert(alertContainer, "已下载修改后的存档。", "success");
  });
}
