/* modules/smiley-box.js — reprend la main sur le picker de smileys (#smiley-box) sans le
   recreer : le frame /smilies?mode=smilies_frame est same-origin, donc son contentDocument
   est accessible depuis la page. Deux limites natives corrigees ici :
     - tout CSS injecte dans le <head> du frame disparait des qu'on change de categorie de
       smileys, car le <select> declenche une vraie navigation qui recharge tout le document ;
     - impossible de cibler ce contenu depuis la feuille de style principale (le frame reste
       un document distinct malgre le same-origin).
   Fix : on neutralise la navigation du <select> pour ne remplacer que le <body> du frame (le
   <head>, et donc notre <link> injecte, n'est jamais touche), et on pose une delegation de
   clic une seule fois sur ce body (stable a travers les remplacements de son contenu) plutot
   que de rejouer le smileList/script natif FA (qui, lui, ne survit pas au remplacement).
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
  neutralizeInlineSubmit(doc);
  bindOnce(doc, iframe);
}

// Le <select categ> declenche forms['smilies_categ'].submit() en inline onchange : un submit()
// programmatique ne leve pas d'evenement 'submit' interceptable, donc on neutralise le handler
// inline lui-meme (reassigner .onchange ecrase l'attribut inline).
function neutralizeInlineSubmit(doc) {
  const select = doc.querySelector('select[name="categ"]');
  if (select) select.onchange = null;
}

function bindOnce(doc, iframe) {
  if (doc.body._pmfBound) return;
  doc.body._pmfBound = true;

  doc.body.addEventListener("click", (e) => {
    const img = e.target.closest('img[id^="smiley_"]');
    if (!img || !img.alt) return;
    try {
      window.insertIntoEditor(img.alt);
    } catch (err) {
      /* editeur pas pret : on ignore, comme le fait le script natif FA */
    }
  });

  doc.body.addEventListener("change", (e) => {
    const select = e.target.closest('select[name="categ"]');
    if (select) loadCategory(doc, iframe, select.value);
  });
}

// Remplace uniquement le <body> du frame par la categorie demandee (fetch + swap), pour ne
// jamais toucher au <head> (et donc a notre <link> injecte). Repli sur une navigation native
// si le fetch echoue : perd le style le temps du reload, mais reste fonctionnel.
function loadCategory(doc, iframe, categ) {
  const url = "/smilies?mode=smilies_frame" + (categ ? "&categ=" + encodeURIComponent(categ) : "");
  fetch(url, { credentials: "same-origin" })
    .then((r) => r.text())
    .then((html) => {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      doc.body.innerHTML = parsed.body.innerHTML;
      neutralizeInlineSubmit(doc); // le nouveau <select> reimporte le meme onchange inline
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
