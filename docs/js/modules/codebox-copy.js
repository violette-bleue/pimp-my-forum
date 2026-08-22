/* Bouton "Copier" sur les balises [code] (.codebox) */

export function init() {
  document.querySelectorAll(".codebox").forEach((box) => {
    const code = box.querySelector("code");
    if (!code) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pmf-codebox-copy";
    btn.textContent = "Copier";

    btn.addEventListener("click", () => {
      const text = code.innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => feedback(btn)).catch(() => fallback(text, btn));
      } else {
        fallback(text, btn);
      }
    });

    code.appendChild(btn);
  });
}

function fallback(text, btn) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch (e) {
    void 0;
  }
  document.body.removeChild(ta);
  feedback(btn);
}

function feedback(btn) {
  const original = btn.textContent;
  btn.textContent = "Copié !";
  btn.classList.add("pmf-codebox-copy--done");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("pmf-codebox-copy--done");
  }, 1500);
}
