export function init(config) {
  const aliases = (config && config.aliases) || {};

  document.querySelectorAll(".pmf-forum-row").forEach((row) => {
    const link = row.querySelector(".pmf-forum-row__title a[href]");
    const match = link && link.getAttribute("href").match(/\/f(\d+)-/);
    if (!match) return;
    const id = match[1];
    row.classList.add("pmf-forum-" + id);
    if (aliases["f" + id]) row.classList.add("pmf-forum-" + aliases["f" + id]);
  });

  document.querySelectorAll(".pmf-category").forEach((cat, i) => {
    const position = i + 1;
    cat.classList.add("pmf-categorie-" + position);
    if (aliases["c" + position]) cat.classList.add("pmf-categorie-" + aliases["c" + position]);
  });
}
