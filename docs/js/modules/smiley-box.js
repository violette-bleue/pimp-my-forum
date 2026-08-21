

const SMILEY_CSS = "https://violette-bleue.github.io/pimp-my-forum/css/components/smiley-box.css";
const TOKENS_CSS = "https://violette-bleue.github.io/pimp-my-forum/css/tokens.css";
const RECENT_KEY = "pmf-smiley-recent";
const RECENT_MAX = 24;

export function init() {
  const iframe = document.querySelector("#smiley-box #smileyContainer iframe");
  if (!iframe) return;

  injectCss(document, SMILEY_CSS);

  const trySetup = () => {
    let doc;
    try {
      doc = iframe.contentDocument;
    } catch (e) {
      return; // cross-origin inattendu fallback
    }
    if (doc && doc.body) setup(doc, iframe);
  };

  iframe.addEventListener("load", trySetup);
  trySetup(); 
}

function setup(doc, iframe) {
  injectCss(doc, TOKENS_CSS);
  injectCss(doc, SMILEY_CSS);
  buildTabs(doc, iframe);
}

// Construit la barre d'onglets
function buildTabs(doc, iframe) {
  if (doc.body._pmfBound) return;

  const header = doc.getElementById("smilies_header");
  const select = doc.querySelector('select[name="categ"]');
  const grid = doc.querySelector(".smiley-element");
  if (!header || !select || !grid) return;

  doc.body._pmfBound = true;
  grid.id = "pmf-smiley-grid";

  grid.innerHTML = grid.innerHTML;

  const state = { cache: new Map(), token: 0 };
  state.cache.set("", grid.innerHTML); 

  const tabs = doc.createElement("div");
  tabs.id = "pmf-smiley-tabs";

  const recentBtn = doc.createElement("button");
  recentBtn.type = "button";
  recentBtn.className = "pmf-smiley-tab pmf-smiley-tab--recent";
  recentBtn.textContent = "Récents";
  recentBtn.addEventListener("click", () => showRecent(doc, recentBtn, grid, state));
  tabs.appendChild(recentBtn);

  [...select.options].forEach((opt, i) => {
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "pmf-smiley-tab" + (opt.value === "" ? " pmf-smiley-tab--default" : "");
    if (i === 0) btn.classList.add("is-active");
    btn.textContent = opt.textContent;
    btn.addEventListener("click", () => selectTab(doc, iframe, btn, opt.value, grid, state));
    tabs.appendChild(btn);
  });

  header.replaceWith(tabs);

  doc.body.addEventListener("click", (e) => {
    const img = e.target.closest("#pmf-smiley-grid img[alt]");
    if (!img) return;
    recordRecent(img);
    try {
      window.insertIntoEditor(img.alt);
    } catch (err) {
      /* editeur pas pret fallback */
    }
  });

  watchHeight(doc, iframe);
}

function activateTab(btn) {
  [...btn.parentNode.children].forEach((b) => b.classList.toggle("is-active", b === btn));
}

// Categorie FA : cache-first, sinon fetch
function selectTab(doc, iframe, btn, categ, grid, state) {
  activateTab(btn);

  const cached = state.cache.get(categ);
  if (cached != null) {
    state.token++; 
    grid.classList.remove("is-loading");
    grid.innerHTML = cached;
    return;
  }

  const token = ++state.token;
  grid.classList.add("is-loading");

  const url = "/smilies?mode=smilies_frame" + (categ ? "&categ=" + encodeURIComponent(categ) : "");
  fetch(url, { credentials: "same-origin" })
    .then((r) => r.text())
    .then((html) => {
      if (token !== state.token) return; // reponse perimee : l'utilisateur a change d'onglet
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const newGrid = parsed.querySelector(".smiley-element");
      const inner = newGrid ? newGrid.innerHTML : "";
      state.cache.set(categ, inner);
      grid.classList.remove("is-loading");
      grid.innerHTML = inner;
    })
    .catch(() => {
      if (token !== state.token) return;
      iframe.contentWindow.location.href = url; // repli : perd les onglets le temps du reload
    });
}

// Onglet "Recents"
function showRecent(doc, btn, grid, state) {
  activateTab(btn);
  state.token++;
  grid.classList.remove("is-loading");
  grid.innerHTML = "";

  const items = loadRecent();
  if (!items.length) {
    const empty = doc.createElement("p");
    empty.className = "pmf-smiley-empty";
    empty.textContent = "Clique sur un smiley pour le retrouver ici.";
    grid.appendChild(empty);
    return;
  }

  items.forEach(({ src, alt, title }) => {
    const img = doc.createElement("img");
    img.src = src;
    img.alt = alt;
    if (title) img.title = title;
    grid.appendChild(img);
  });
}

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function recordRecent(img) {
  try {
    const items = loadRecent().filter((it) => it.alt !== img.alt);
    items.unshift({ src: img.src, alt: img.alt, title: img.title || "" });
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_MAX)));
  } catch (e) {
    /* localStorage indisponible fallback */
  }
}

// Cale la hauteur de l'iframe sur son contenu reel plutot que le height="350" fige par FA
function watchHeight(doc, iframe) {
  if (!window.ResizeObserver) return;
  const ro = new ResizeObserver(() => {
    iframe.style.height = doc.documentElement.scrollHeight + "px";
  });
  ro.observe(doc.documentElement);
}

function injectCss(doc, href) {
  if (doc.querySelector('link[href="' + href + '"]')) return;
  const l = doc.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  doc.head.appendChild(l);
}
