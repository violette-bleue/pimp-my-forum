/* modules/viewtopic-post-menu.js — toggle du menu +/- sur chaque post, highlight.js, fix hauteur profil sans avatar */

export function init() {
  if (window.jQuery && window.hljs) {
    document.querySelectorAll("pre, code").forEach((block) => window.hljs.highlightBlock(block));
  }

  document.querySelectorAll(".pmf-post").forEach((post) => {
    const avatarBox = post.querySelector(".pmf-post__avatar");
    if (avatarBox && !avatarBox.innerHTML.trim().length) {
      const rank = post.querySelector(".pmf-post__rank");
      const dt = post.querySelector(".pmf-post__profile > dl > dt");
      const head = post.querySelector(".pmf-post__head");
      if (rank) rank.style.borderBottom = "none";
      if (dt && head) dt.style.minHeight = head.offsetHeight + "px";
    }
  });

  const menus = document.querySelectorAll(".pmf-post__menu-btn");
  menus.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("pmf-is-expanded")) {
        btn.innerHTML = "+";
        btn.classList.remove("pmf-is-expanded");
      } else {
        document.querySelectorAll(".pmf-post__menu-btn.pmf-is-expanded").forEach((m) => {
          m.innerHTML = "+";
          m.classList.remove("pmf-is-expanded");
        });
        btn.innerHTML = "-";
        btn.classList.add("pmf-is-expanded");
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".pmf-post__menu-wrap")) {
      document.querySelectorAll(".pmf-post__menu-btn.pmf-is-expanded").forEach((m) => {
        m.innerHTML = "+";
        m.classList.remove("pmf-is-expanded");
      });
    }
  });
}
