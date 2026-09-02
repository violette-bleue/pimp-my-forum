/* bouton copier */

export function init() {
  document.querySelectorAll(".codebox").forEach((box) => {
    const anchor = box.querySelector("*:last-child");
    if (!anchor) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pmf-codebox-copy";
    btn.textContent = "Copier le code";

    btn.addEventListener("click", () => {
      const text = extractCode(box);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => feedback(btn)).catch(() => fallback(text, btn));
      } else {
        fallback(text, btn);
      }
    });

    anchor.appendChild(btn);
  });
}

function extractCode(box) {
  const source = box.querySelector("code, pre") || box;
  const clone = source.cloneNode(true);
  clone.querySelectorAll(".pmf-codebox-copy").forEach((b) => b.remove());
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return clone.textContent.trim();
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
