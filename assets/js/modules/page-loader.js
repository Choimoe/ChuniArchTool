export async function loadPage(pageId) {
  const pageContent = document.getElementById("page-content");

  try {
    const template = await fetchTemplate(pageId);
    pageContent.innerHTML = `<div id="page-${pageId}" class="page-content space-y-${
      pageId === "home" ? "10" : "8"
    }">${template}</div>`;
    return true;
  } catch (error) {
    console.error(`Failed to load page ${pageId}:`, error);
    if (pageId !== "home") {
      return await loadPage("home");
    }
    return false;
  }
}

export function clearPageContent() {
  const pageContent = document.getElementById("page-content");
  pageContent.innerHTML = "";
}

async function fetchTemplate(pageId) {
  const response = await fetch(`./assets/templates/${pageId}.html`);
  if (!response.ok) {
    throw new Error(`Template not found: ${pageId}`);
  }
  return response.text();
}
