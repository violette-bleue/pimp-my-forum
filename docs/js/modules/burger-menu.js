export function init() {
  document.onclick = function (e) {
    if (!e.target.classList.contains("navicon")) {
      const closestBar = e.target.closest ? e.target.closest(".responsive-headerbar") : null;
      if (!closestBar && e.target.id !== "menu-btn") {
        const menuBtn = document.getElementById("menu-btn");
        if (menuBtn) menuBtn.checked = false;
      }
    }
  };
}
