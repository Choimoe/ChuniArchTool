export function updatePage() {
  const pageContent = document.getElementById("page-content");
  const pages = pageContent.querySelectorAll(".page-content");
  const navLinks = document.querySelectorAll(".nav-link");
  const hash = window.location.hash || "#home";
  let targetPageId = "page-" + hash.substring(1);

  pages.forEach((page) => {
    page.style.display = "none";
  });

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === hash) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  const targetPage = document.getElementById(targetPageId);
  if (targetPage) {
    targetPage.style.display = "block";
  } else {
    document.getElementById("page-home").style.display = "block";
    navLinks.forEach((link) => link.classList.remove("active"));
    document.querySelector('.nav-link[href="#home"]').classList.add("active");
  }
}

export function initRouter() {
  window.addEventListener("hashchange", updatePage);
  updatePage();
}
