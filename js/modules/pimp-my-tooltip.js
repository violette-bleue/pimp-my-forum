/* pimp-my-tooltip.js — infobulle custom */

const DEFAULTS = {
  selector: "[title]",
  delay: 0,
  offsetX: 14,
  offsetY: 14,
  maxWidth: 260
};

let cfg = DEFAULTS;
let tip = null;
let showTimer = null;

function getStaffConfig() {
  try {
    return (window.PimpMyTooltip && window.PimpMyTooltip.Config) || {};
  } catch (e) {
    return {};
  }
}

export function init() {
  cfg = Object.assign({}, DEFAULTS, getStaffConfig());
  document.documentElement.style.setProperty("--pmf-tooltip-max-width", cfg.maxWidth + "px");
  attach(document);
}

export function rescan(root) {
  attach(root || document);
}

function attach(root) {
  root.querySelectorAll(cfg.selector).forEach((el) => {
    if (el.dataset.pmfTipDone) return;
    const content = el.getAttribute("title");
    if (!content) return;

    el.dataset.pmfTipContent = content;
    el.dataset.pmfTipDone = "1";
    el.removeAttribute("title");

    el.addEventListener("mouseenter", (e) => {
      clearTimeout(showTimer);
      showTimer = setTimeout(() => show(el, e.clientX, e.clientY), cfg.delay);
    });
    el.addEventListener("mousemove", (e) => {
      if (tip && tip.classList.contains("pmf-tooltip--visible")) move(e.clientX, e.clientY);
    });
    el.addEventListener("mouseleave", hide);
  });
}

function ensureTip() {
  if (tip) return;
  tip = document.createElement("div");
  tip.className = "pmf-tooltip";
  document.body.appendChild(tip);
}

function show(el, x, y) {
  ensureTip();
  tip.textContent = el.dataset.pmfTipContent;
  tip.classList.add("pmf-tooltip--visible");
  move(x, y);
}

function move(x, y) {
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let px = x + cfg.offsetX;
  let py = y + cfg.offsetY;
  if (px + tw > window.innerWidth - 10) px = x - tw - 8;
  if (py + th > window.innerHeight - 10) py = y - th - 8;
  tip.style.left = px + "px";
  tip.style.top = py + "px";
}

function hide() {
  clearTimeout(showTimer);
  if (tip) tip.classList.remove("pmf-tooltip--visible");
}
