/* modules/sceditor-highlight.js — coloration syntaxique BBCode dans l'editeur source SCEditor.
   Approche shadow-sync decouplee : CodeMirror tourne sur SON PROPRE textarea (libre cote clavier),
   le textarea source natif de SCEditor est masque mais nourri via l'API de l'instance.
   Sync bidirectionnel : frappe CM -> setSourceEditorValue ; toolbar FA (insert) -> relit vers CM.
   CodeMirror n'est pas charge sur FA : le module le charge lui-meme (une seule fois). */

const CM_VERSION = "5.65.16";
const CM_BASE = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/" + CM_VERSION;
const PNP_CSS = "https://violette-bleue.github.io/puzzle-n-pixel/dist/css/components/sceditor-highlight.css";

export function init() {
  const $ = window.jQuery;
  if (!$ || !$.fn.sceditor) return;

  let tries = 0;
  const timer = setInterval(() => {
    const orig = document.getElementById("text_editor_textarea");
    const container = orig && orig.nextElementSibling;
    const inst = orig && $(orig).sceditor("instance");
    if (container && container.classList.contains("sceditor-container") && inst) {
      clearInterval(timer);
      loadCodeMirror(() => setupEditor(container, inst));
    } else if (++tries > 40) {
      clearInterval(timer);
    }
  }, 300);
}

function setupEditor(container, inst) {
  const sourceTextarea = container.querySelector("textarea");
  if (!sourceTextarea || sourceTextarea._pnpCM) return;

  // 1. Notre propre textarea, insere juste apres le natif. CM montera dessus.
  const shadow = document.createElement("textarea");
  shadow.className = "pnp-cm-shadow";
  shadow.value = inst.getSourceEditorValue();
  sourceTextarea.parentNode.insertBefore(shadow, sourceTextarea.nextSibling);

  // 2. On masque le textarea source natif (garde vivant, jamais retire).
  sourceTextarea.style.display = "none";

  const cm = window.CodeMirror.fromTextArea(shadow, {
    mode: "pnp-bbcode",
    lineWrapping: true,
    viewportMargin: Infinity,
    theme: "pnp"
  });
  sourceTextarea._pnpCM = cm;

  let syncing = false; // garde anti-boucle entre les deux sens

  // 3. Sens CM -> SCEditor : chaque edition clavier pousse vers le champ POST.
  cm.on("change", () => {
    if (syncing) return;
    syncing = true;
    inst.setSourceEditorValue(cm.getValue());
    if (inst.updateOriginal) inst.updateOriginal();
    syncing = false;
  });

  // 4. Sens SCEditor -> CM : la toolbar FA insere via ces methodes. On relit apres coup.
  const pullIntoCM = () => {
    if (syncing) return;
    syncing = true;
    const v = inst.getSourceEditorValue();
    if (v !== cm.getValue()) {
      const pos = cm.getCursor();
      cm.setValue(v);
      cm.setCursor(pos);
    }
    syncing = false;
  };
  wrapInsert(inst, "sourceEditorInsertText", pullIntoCM);
  wrapInsert(inst, "insert", pullIntoCM);

  // 5. Bascule source <-> WYSIWYG : suit la classe du container.
  const wrapper = cm.getWrapperElement();
  const syncVisibility = () => {
    if (container.classList.contains("sourceMode")) {
      syncing = true;
      cm.setValue(inst.getSourceEditorValue());
      syncing = false;
      wrapper.style.display = "";
      cm.refresh();
    } else {
      wrapper.style.display = "none";
    }
  };
  syncVisibility();
  new MutationObserver(syncVisibility).observe(container, {
    attributes: true,
    attributeFilter: ["class"]
  });
}

// Enrobe une methode de l'instance : execute l'originale puis notre callback.
function wrapInsert(inst, fnName, after) {
  const original = inst[fnName];
  if (typeof original !== "function" || original._pnpWrapped) return;
  const wrapped = function () {
    const r = original.apply(this, arguments);
    after();
    return r;
  };
  wrapped._pnpWrapped = true;
  inst[fnName] = wrapped;
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
