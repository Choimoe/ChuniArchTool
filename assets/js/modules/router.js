import { loadPage } from "./page-loader.js";
import { updateActiveNav } from "./nav-builder.js";

async function handlePageLoad(pageId) {
  const success = await loadPage(pageId);

  if (success) {
    updateActiveNav(pageId);
    window.dispatchEvent(
      new CustomEvent("pageChanged", { detail: { pageId } })
    );
  } else {
    await loadPage("home");
    updateActiveNav("home");
    window.dispatchEvent(
      new CustomEvent("pageChanged", { detail: { pageId: "home" } })
    );
  }
}

export function initRouter() {
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash || "#home";
    const pageId = hash.substring(1);
    handlePageLoad(pageId);
  });

  const initialHash = window.location.hash || "#home";
  const initialPageId = initialHash.substring(1);
  handlePageLoad(initialPageId);
}
