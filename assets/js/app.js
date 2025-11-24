import {
  readFileAsText,
  downloadFile,
  setupFileDropZone,
} from "./modules/file-utils.js";
import { showAlert, clearAlert } from "./modules/ui-utils.js";
import {
  convertRinToLx,
  serializeCSV,
  CSV_HEADER,
} from "./modules/rin-converter.js";
import { parseCSV } from "./modules/csv-parser.js";
import { initRouter } from "./modules/router.js";
import { initScoreEditor } from "./modules/score-editor.js";
import { initOngekiScoreEditor } from "./modules/ongeki-score-editor.js";
import { initOngekiUserEditor } from "./modules/ongeki-user-editor.js";
import { buildNavigation, buildFooter } from "./modules/nav-builder.js";

function loadPageTemplate(pageId) {
  const pageContent = document.getElementById("page-content");
  let template = "home";
  if (pageId === "chuni") template = "chuni";
  else if (pageId === "ongeki") template = "ongeki";
  else if (pageId === "home") template = "home";
  fetch(`./assets/templates/${template}.html`)
    .then((res) => res.text())
    .then((html) => {
      pageContent.innerHTML = html;
      initPageFeatures(pageId);
    });
}

let selectedRinFile = null;
let selectedCsvFile1 = null;
let selectedCsvFile2 = null;

function initRinConverter() {
  const rinBtn = document.getElementById("convert-json-btn");
  const rinAlertContainer = document.getElementById("rin-alert-container");

  if (!rinBtn || !rinAlertContainer) return;

  setupFileDropZone(
    "rin-drop-zone",
    "rin-json-file",
    "rin-file-name",
    (file) => {
      selectedRinFile = file;
      rinBtn.disabled = false;
      clearAlert(rinAlertContainer);
    }
  );

  rinBtn.addEventListener("click", async () => {
    if (!selectedRinFile) {
      showAlert(rinAlertContainer, "请先选择一个 JSON 文件。", "error");
      return;
    }

    rinBtn.disabled = true;
    rinBtn.innerHTML = "正在处理...";
    clearAlert(rinAlertContainer);

    try {
      const fileText = await readFileAsText(selectedRinFile);
      const jsonData = JSON.parse(fileText);
      const csvData = convertRinToLx(jsonData);
      const csvString = serializeCSV(CSV_HEADER, csvData);

      const date = new Date().toISOString().split("T")[0];
      downloadFile(
        `lxnet_export_${date}.csv`,
        csvString,
        "text/csv;charset=utf-8"
      );

      showAlert(
        rinAlertContainer,
        `转换成功！已生成 ${csvData.length} 条记录。`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showAlert(rinAlertContainer, `转换失败：${err.message}`, "error");
    } finally {
      rinBtn.disabled = false;
      rinBtn.innerHTML = "转换并下载 CSV";
    }
  });
}

function initCsvMerger() {
  const mergeBtn = document.getElementById("merge-csv-btn");
  const mergeAlertContainer = document.getElementById("merge-alert-container");

  if (!mergeBtn || !mergeAlertContainer) return;

  function checkMergeButton() {
    mergeBtn.disabled = !(selectedCsvFile1 && selectedCsvFile2);
  }

  setupFileDropZone(
    "csv1-drop-zone",
    "csv-file-1",
    "csv1-file-name",
    (file) => {
      selectedCsvFile1 = file;
      checkMergeButton();
      clearAlert(mergeAlertContainer);
    }
  );

  setupFileDropZone(
    "csv2-drop-zone",
    "csv-file-2",
    "csv2-file-name",
    (file) => {
      selectedCsvFile2 = file;
      checkMergeButton();
      clearAlert(mergeAlertContainer);
    }
  );

  mergeBtn.addEventListener("click", async () => {
    if (!selectedCsvFile1 || !selectedCsvFile2) {
      showAlert(mergeAlertContainer, "请选择两个 CSV 文件。", "error");
      return;
    }

    mergeBtn.disabled = true;
    mergeBtn.innerHTML = "正在合并...";
    clearAlert(mergeAlertContainer);

    try {
      const text1 = await readFileAsText(selectedCsvFile1);
      const text2 = await readFileAsText(selectedCsvFile2);

      const csv1 = parseCSV(text1);
      const csv2 = parseCSV(text2);

      const header1 = csv1.header.join(",");
      const header2 = csv2.header.join(",");

      if (header1 !== header2) {
        throw new Error(
          `文件表头不匹配！<br>文件1: ${header1}<br>文件2: ${header2}`
        );
      }

      const mergedData = [...csv1.data, ...csv2.data];
      const csvString = serializeCSV(csv1.header, mergedData);

      const date = new Date().toISOString().split("T")[0];
      downloadFile(
        `merged_data_${date}.csv`,
        csvString,
        "text/csv;charset=utf-8"
      );

      showAlert(
        mergeAlertContainer,
        `合并成功！<br>文件1: ${csv1.data.length} 条记录<br>文件2: ${csv2.data.length} 条记录<br>总计: ${mergedData.length} 条记录`,
        "success"
      );
    } catch (err) {
      console.error(err);
      showAlert(mergeAlertContainer, `合并失败：${err.message}`, "error");
    } finally {
      mergeBtn.disabled = false;
      mergeBtn.innerHTML = "合并并下载";
    }
  });
}

function initScoreEditorPage() {
  const editAlertContainer = document.getElementById("edit-alert-container");
  const form = document.getElementById("edit-form");

  if (!editAlertContainer || !form) return;

  setupFileDropZone(
    "edit-drop-zone",
    "edit-json-file",
    "edit-file-name",
    async (file) => {
      clearAlert(editAlertContainer);
      form.classList.add("hidden");

      try {
        const fileText = await readFileAsText(file);
        const jsonData = JSON.parse(fileText);

        if (!jsonData || !Array.isArray(jsonData.userPlaylogList)) {
          throw new Error("无效的 JSON 格式：未找到 'userPlaylogList' 数组。");
        }

        initScoreEditor(jsonData);
        showAlert(
          editAlertContainer,
          "档案加载成功，可以开始编辑。",
          "success"
        );
      } catch (err) {
        console.error(err);
        showAlert(editAlertContainer, `加载失败：${err.message}`, "error");
      }
    }
  );
}

function initPageFeatures(pageId) {
  if (pageId === "rin-to-lx") {
    initRinConverter();
  } else if (pageId === "merge-csv") {
    initCsvMerger();
  } else if (pageId === "edit-score") {
    initScoreEditorPage();
  } else if (pageId === "edit-ongeki") {
    initOngekiScoreEditorPage();
  } else if (pageId === "edit-ongeki-user") {
    initOngekiUserEditor();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  buildNavigation();
  buildFooter();
  initRouter();
  window.addEventListener("pageChanged", (e) => {
    const pageId = e.detail?.pageId;
    if (pageId) {
      initPageFeatures(pageId);
    }
  });
});

function initOngekiScoreEditorPage() {
  const alertContainer = document.getElementById('ongeki-alert-container')
  const form = document.getElementById('ongeki-form')
  if (!alertContainer || !form) return
  setupFileDropZone('ongeki-drop-zone','ongeki-json-file','ongeki-file-name', async file => {
    clearAlert(alertContainer)
    form.classList.add('hidden')
    try {
      const text = await readFileAsText(file)
      const jsonData = JSON.parse(text)
      if (!jsonData || !Array.isArray(jsonData.userPlaylogList)) {
        throw new Error('无效的 JSON：未找到 userPlaylogList')
      }
      initOngekiScoreEditor(jsonData)
      showAlert(alertContainer,'档案加载成功','success')
    } catch (err) {
      showAlert(alertContainer,`加载失败：${err.message}`,'error')
    }
  })
}
