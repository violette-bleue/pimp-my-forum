/* modules/select-mirror.js — remplace le rendu du <select> natif par un
   trigger/panel stylables. Opt-out par select : data-pmf-skip. */

let uid = 0;

function mirrorSelect(select) {
  const wrap = document.createElement("div");
  wrap.className = "pmf-select";
  if (select.disabled) wrap.classList.add("is-disabled");

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "pmf-select__trigger";
  trigger.disabled = select.disabled;

  const panel = document.createElement("ul");
  panel.className = "pmf-select__panel";
  panel.id = "pmf-select-panel-" + (++uid);
  panel.hidden = true;

  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-controls", panel.id);
  trigger.setAttribute("aria-expanded", "false");

  function syncLabel() {
    const current = select.options[select.selectedIndex];
    trigger.textContent = current ? current.textContent : "";
    [...panel.children].forEach((li, i) => {
      const selected = !!select.options[i] && select.options[i].selected;
      li.setAttribute("aria-selected", String(selected));
    });
  }

  function renderOptions() {
    panel.innerHTML = "";
    [...select.options].forEach((opt) => {
      const li = document.createElement("li");
      li.className = "pmf-select__option";
      li.textContent = opt.textContent;
      li.setAttribute("role", "option");
      if (opt.disabled) li.setAttribute("aria-disabled", "true");
      li.addEventListener("click", () => {
        if (opt.disabled) return;
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        close();
        trigger.focus();
      });
      panel.appendChild(li);
    });
  }

  function open() {
    panel.hidden = false;
    wrap.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function close() {
    panel.hidden = true;
    wrap.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  trigger.addEventListener("click", () => {
    if (panel.hidden) open();
    else close();
  });

  select.addEventListener("change", syncLabel);

  renderOptions();
  syncLabel();

  select.hidden = true;
  select.parentNode.insertBefore(wrap, select);
  wrap.append(select, trigger, panel);

  return { wrap, close };
}

export function init() {
  const selects = document.querySelectorAll("select:not([multiple]):not([data-pmf-skip])");
  if (!selects.length) return;

  const mirrors = [...selects].map(mirrorSelect);

  document.addEventListener("click", (e) => {
    mirrors.forEach(({ wrap, close }) => {
      if (!wrap.contains(e.target)) close();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") mirrors.forEach(({ close }) => close());
  });
}
