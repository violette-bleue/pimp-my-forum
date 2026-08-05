/* modules/sceditor-highlight.js — coloration syntaxique BBCode dans l'editeur source SCEditor.
   Planque le textarea source natif derriere une instance CodeMirror, synchronise en continu
   vers le vrai champ (celui qui part dans le POST) et suit les bascules source <-> WYSIWYG.
   CodeMirror n'est pas charge sur FA : le module le charge lui-meme (une seule fois). */

const CM_VERSION = "5.65.16";
const CM_BASE = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/" + CM_VERSION;
const PNP_CSS = "https://violette-bleue.github.io/puzzle-n-pixel/dist/css/components/sceditor-highlight.css";

export function init() {
  const $ = window.jQuery;
  if (!$ || !$.fn.sceditor) return;

  // SCEditor s'initialise apres le chargement de page : on attend que le container apparaisse.
  let tries = 0;
  const timer = setInterval(() => {
    const orig = document.getElementById("text_editor_textarea");
    const container = orig && orig.nextElementSibling;
    if (container && container.classList.contains("sceditor-container")) {
      clearInterval(timer);
      loadCodeMirror(() => setupEditor(container));
    } else if (++tries > 40) {
      clearInterval(timer); // ~12s max, on abandonne proprement
    }
  }, 300);
}

function setupEditor(container) {
  const sourceTextarea = container.querySelector("textarea");
  if (!sourceTextarea || sourceTextarea._pnpCM) return; // deja instrumente

  const cm = window.CodeMirror.fromTextArea(sourceTextarea, {
    mode: "pnp-bbcode",
    lineWrapping: true,
    viewportMargin: Infinity,
    theme: "pnp"
  });
  sourceTextarea._pnpCM = cm;

  // A chaque frappe cote CodeMirror -> on reecrit dans le vrai textarea source.
  cm.on("change", () => cm.save());

  // Affichage aligne sur le mode courant de SCEditor (source visible ou non).
  const wrapper = cm.getWrapperElement();
  const syncVisibility = () => {
    if (container.classList.contains("sourceMode")) {
      cm.setValue(sourceTextarea.value); // SCEditor a pu reecrire le champ en basculant
      wrapper.style.display = "";
      cm.refresh();
    } else {
      cm.save();
      wrapper.style.display = "none";
    }
  };
  syncVisibility();

  // SCEditor change juste la classe du container quand on bascule source/WYSIWYG.
  new MutationObserver(syncVisibility).observe(container, {
    attributes: true,
    attributeFilter: ["class"]
  });
}

function loadCodeMirror(cb) {
  if (window.CodeMirror) {
    defineBBCodeMode();
    return cb();
  }
  injectCss(CM_BASE + "/codemirror.min.css");
  injectCss(PNP_CSS);
  injectScript(CM_BASE + "/codemirror.min.js", () => {
    injectScript(CM_BASE + "/addon/mode/simple.min.js", () => {
      defineBBCodeMode();
      cb();
    });
  });
}

function defineBBCodeMode() {
  const CM = window.CodeMirror;
  if (CM._pnpBBCodeDefined) return;
  CM.defineSimpleMode("pnp-bbcode", {
    start: [
      { regex: /\[\/[a-zA-Z0-9*]+\]/, token: "tag" },
      { regex: /\[[a-zA-Z0-9*]+/, token: "tag", next: "inTag" }
    ],
    inTag: [
      { regex: /=/, token: "operator" },
      { regex: /"[^"]*"|'[^']*'/, token: "string" },
      { regex: /\]/, token: "tag", next: "start" },
      { regex: /[^\]=]+/, token: "attribute" }
    ]
  });
  CM._pnpBBCodeDefined = true;
}

function injectScript(src, onload) {
  const s = document.createElement("script");
  s.src = src;
  s.onload = onload;
  document.head.appendChild(s);
}

function injectCss(href) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}
