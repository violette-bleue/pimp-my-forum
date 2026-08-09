/* modules/smiley-box.js — reprend la main sur le picker de smileys (#smiley-box) sans le
   recreer : le frame /smilies?mode=smilies_frame est same-origin, donc son contentDocument
   est accessible depuis la page. Deux limites natives corrigees ici :
     - tout CSS injecte dans le <head> du frame disparait des qu'on change de categorie de
       smileys, car le <select> natif declenche une vraie navigation qui recharge le document ;
     - impossible de cibler ce contenu depuis la feuille de style principale (le frame reste
       un document distinct malgre le same-origin).
   Fix : le <select>/<form> natifs sont remplaces par une barre d'onglets construite a partir
   de leurs <option> (memes categories, mais navigation maison) ; seule la grille .smiley-element
   est fetchee et remplacee au clic, les onglets et le <head> (donc notre <link> injecte) restent
   des noeuds stables jamais reconstruits. La delegation de clic sur les smileys, posee une
   seule fois sur le body, survit donc naturellement au remplacement de la grille.
   L'insertion reutilise le point d'entree natif : le frame appelle parent.insertIntoEditor(code)
   -> ici directement window.insertIntoEditor, puisqu'on est deja au niveau de la page top. */

const SMILEY_CSS = "https://violette-bleue.github.io/pimp-my-forum/css/components/smiley-box.css";

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

// Construit la barre d'onglets a partir des <option> du <select> natif, puis le remplace.
// Ne s'execute qu'une fois par document de frame (garde _pmfBound) : les rechargements
// suivants passent par selectTab(), qui ne touche que la grille.
function buildTabs(doc, iframe) {
  if (doc.body._pmfBound) return;

  const header = doc.getElementById("smilies_header");
  const select = doc.querySelector('select[name="categ"]');
  const grid = doc.querySelector(".smiley-element");
  if (!header || !select || !grid) return;

  doc.body._pmfBound = true;

  const tabs = doc.createElement("div");
  tabs.id = "pmf-smiley-tabs";

  [...select.options].forEach((opt, i) => {
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "pmf-smiley-tab" + (i === 0 ? " is-active" : "");
    btn.textContent = opt.textContent;
    btn.addEventListener("click", () => selectTab(doc, iframe, btn, opt.value, grid));
    tabs.appendChild(btn);
  });

  header.replaceWith(tabs);

  doc.body.addEventListener("click", (e) => {
    const img = e.target.closest('img[id^="smiley_"]');
    if (!img || !img.alt) return;
    try {
      window.insertIntoEditor(img.alt);
    } catch (err) {
      /* editeur pas pret : on ignore, comme le fait le script natif FA */
    }
  });
}

// Fetch la categorie demandee et ne remplace que le contenu de la grille : les onglets et
// le <head> du frame ne sont jamais reconstruits. Repli sur une navigation native si le
// fetch echoue (perd les onglets le temps du reload, mais reste fonctionnel).
function selectTab(doc, iframe, btn, categ, grid) {
  [...btn.parentNode.children].forEach((b) => b.classList.toggle("is-active", b === btn));

  const url = "/smilies?mode=smilies_frame" + (categ ? "&categ=" + encodeURIComponent(categ) : "");
  fetch(url, { credentials: "same-origin" })
    .then((r) => r.text())
    .then((html) => {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const newGrid = parsed.querySelector(".smiley-element");
      if (newGrid) grid.innerHTML = newGrid.innerHTML;
    })
    .catch(() => {
      iframe.contentWindow.location.href = url;
    });
}

function injectCss(doc, href) {
  if (doc.querySelector('link[href="' + href + '"]')) return;
  const l = doc.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  doc.head.appendChild(l);
}
