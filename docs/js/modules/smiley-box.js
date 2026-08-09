/* modules/smiley-box.js — reprend la main sur le picker de smileys (#smiley-box) sans le
   recreer : le frame /smilies?mode=smilies_frame est same-origin, donc son contentDocument
   est accessible depuis la page. Limites natives corrigees ici :
     - tout CSS injecte dans le <head> du frame disparait des qu'on change de categorie de
       smileys, car le <select> natif declenche une vraie navigation qui recharge le document ;
     - impossible de cibler ce contenu depuis la feuille de style principale (le frame reste
       un document distinct malgre le same-origin) ;
     - la hauteur du frame est figee en dur par FA (attribut height="350"), sans rapport avec
       le nombre reel de smileys d'une categorie.
   Le <select>/<form> natifs sont remplaces par une barre d'onglets construite a partir de
   leurs <option> (memes categories, navigation maison), plus un onglet "Recents" (localStorage,
   aucun fetch). Seule la grille .smiley-element est fetchee et remplacee au clic ; les onglets
   et le <head> (donc notre <link> injecte) restent des noeuds stables jamais reconstruits.
   Chaque categorie deja chargee est mise en cache (state.cache) : plus de refetch au 2e clic.
   Un jeton (state.token) invalide les reponses perimees si l'utilisateur change d'onglet avant
   qu'un fetch precedent ait repondu.
   La delegation de clic sur les smileys, posee une seule fois sur le body, cible #pmf-smiley-grid
   (id qu'on pose nous-memes sur le conteneur persistant) plutot que les id="smiley_N" internes
   a FA : ca fonctionne aussi bien sur le contenu FA que sur les <img> reconstruits pour l'onglet
   Recents. L'insertion reutilise le point d'entree natif : le frame appelle normalement
   parent.insertIntoEditor(code) -> ici directement window.insertIntoEditor, puisqu'on est deja
   au niveau de la page top. */

const SMILEY_CSS = "https://violette-bleue.github.io/pimp-my-forum/css/components/smiley-box.css";
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
      return; // cross-origin inattendu : on abandonne proprement
    }
    if (doc && doc.body) setup(doc, iframe);
  };

  iframe.addEventListener("load", trySetup);
  trySetup(); // deja charge au moment ou le module demarre ?
}

function setup(doc, iframe) {
  injectCss(doc, SMILEY_CSS);
  buildTabs(doc, iframe);
}

// Construit la barre d'onglets (Recents + categories FA) a partir des <option> du <select>
// natif, puis le remplace. Ne s'execute qu'une fois par document de frame (garde _pmfBound) :
// les changements d'onglet suivants passent par selectTab()/showRecent(), qui ne touchent
// que la grille.
function buildTabs(doc, iframe) {
  if (doc.body._pmfBound) return;

  const header = doc.getElementById("smilies_header");
  const select = doc.querySelector('select[name="categ"]');
  const grid = doc.querySelector(".smiley-element");
  if (!header || !select || !grid) return;

  doc.body._pmfBound = true;
  grid.id = "pmf-smiley-grid";
  // Le lot initial d'<img> porte encore le click jQuery natif du script FA (bind() au chargement
  // de la frame, avant notre passage) : sans ca, il se declenche EN PLUS de notre delegation sur
  // doc.body -> double insertion au premier clic. Reassigner innerHTML recree des noeuds neufs,
  // donc sans ces listeners (les lots suivants viennent de fetch(), jamais de ce script -> non
  // concernes).
  grid.innerHTML = grid.innerHTML;

  // Etat par document de frame (un vrai rechargement de l'iframe -> nouveau doc -> etat neuf).
  const state = { cache: new Map(), token: 0 };
  state.cache.set("", grid.innerHTML); // le contenu deja affiche = categorie par defaut

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
      /* editeur pas pret : on ignore, comme le fait le script natif FA */
    }
  });

  watchHeight(doc, iframe);
}

function activateTab(btn) {
  [...btn.parentNode.children].forEach((b) => b.classList.toggle("is-active", b === btn));
}

// Categorie FA : cache-first, sinon fetch (avec jeton anti-course) qui ne remplace que la
// grille — les onglets et le <head> du frame ne sont jamais reconstruits.
function selectTab(doc, iframe, btn, categ, grid, state) {
  activateTab(btn);

  const cached = state.cache.get(categ);
  if (cached != null) {
    state.token++; // invalide un eventuel fetch encore en vol pour un autre onglet
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

// Onglet "Recents" : rendu synchrone depuis localStorage, aucun fetch -> le jeton est quand
// meme incremente pour qu'une reponse de categorie encore en vol n'ecrase pas cette vue.
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

// Enregistre le smiley clique en tete de liste (dedoublonne par alt = code BBCode), plafonne.
function recordRecent(img) {
  try {
    const items = loadRecent().filter((it) => it.alt !== img.alt);
    items.unshift({ src: img.src, alt: img.alt, title: img.title || "" });
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_MAX)));
  } catch (e) {
    /* localStorage indisponible (navigation privee stricte...) : on ignore */
  }
}

// Cale la hauteur de l'iframe sur son contenu reel plutot que le height="350" fige par FA.
// ResizeObserver capte tout changement de taille du document du frame, quelle qu'en soit la
// cause (changement d'onglet, chargement du CSS injecte, images...) : pas besoin de recalculer
// a la main a chaque endroit qui touche la grille.
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
