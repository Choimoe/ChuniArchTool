import { pages, siteConfig } from "../config/pages.js";

export function buildNavigation() {
  const nav = document.querySelector("nav");

  const navHTML = `
    <a href="#" class="text-2xl font-bold text-white">
      <span class="text-indigo-400">${siteConfig.logo.prefix}</span>${
    siteConfig.logo.suffix
  }
    </a>
    <ul class="flex space-x-6 text-gray-300">
      ${pages
        .filter((p) => p.showInNav)
        .map(
          (page) => `
        <li>
          <a
            href="#${page.id}"
            class="nav-link hover:text-indigo-400 transition-colors"
            data-page="${page.id}"
          >${page.title}</a>
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  nav.innerHTML = navHTML;
}

export function buildFooter() {
  const footer = document.querySelector("footer");
  const { footer: footerConfig } = siteConfig;

  const footerHTML = `
    <p>${footerConfig.notice}</p>
    <p>
      &copy; ${footerConfig.copyright}
      <a
        href="${footerConfig.authorLink}"
        target="_blank"
        rel="noopener noreferrer"
        class="text-indigo-400 underline"
        >${footerConfig.author}</a
      >. All rights reserved.
    </p>
    <p>${footerConfig.icp}</p>
  `;

  footer.innerHTML = footerHTML;
}

export function updateActiveNav(pageId) {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    const linkPageId = link.getAttribute("data-page");
    if (linkPageId === pageId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
