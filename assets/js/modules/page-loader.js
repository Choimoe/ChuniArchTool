import { templates } from "../templates/index.js";

export function loadPage(pageId) {
  const pageContent = document.getElementById("page-content");
  const template = templates[pageId];

  if (template) {
    pageContent.innerHTML = `<div id="page-${pageId}" class="page-content space-y-${
      pageId === "home" ? "10" : "8"
    }">${template()}</div>`;
    return true;
  }

  return false;
}

export function clearPageContent() {
  const pageContent = document.getElementById("page-content");
  pageContent.innerHTML = "";
}
