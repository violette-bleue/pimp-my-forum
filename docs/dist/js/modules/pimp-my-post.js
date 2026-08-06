/* modules/pimp-my-post.js — "Pimp My Post" : glow-up des posts dans l'editeur SCEditor.
   Deux volets sous un meme toit, partageant la meme instance CodeMirror :
     1. COLORATION syntaxique BBCode + HTML (balises, attributs, valeurs, commentaires)
     2. INPUTS assistes : bascule code <-> formulaire genere a partir des data-input

   CM est monte HORS du container SCEditor (frere, apres lui) pour echapper a l'interception
   clavier que SCEditor applique dans son propre sous-arbre. Le textarea source natif est
   masque mais nourri via inst.val() (BBCode canonique propre, ciblee par ID).
   Sync bidirectionnel : frappe CM -> val(x) ; toolbar FA (insert) -> relit val() vers CM.
   CodeMirror n'est pas charge sur FA : le module le charge lui-meme (une seule fois).

   Convention inputs (declaree par l'auteur du template) :
     data-input="href target text"  -> cibles editables ; "text" = textContent
     fillable                       -> sucre pour data-input="text"
     data-label="..."               -> en-tete humain du groupe
     data-label-text="..."          -> intitule du champ texte (defaut "Contenu") */

const CM_VERSION = "5.65.16";
const CM_BASE = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/" + CM_VERSION;
const PNP_CSS = "https://violette-bleue.github.io/puzzle-n-pixel/dist/css/components/pimp-my-post.css";

// Attributs rendus en menu deroulant, avec leurs valeurs proposees ("" = option vide).
const SELECT_ATTRS = {
  target: ["", "_blank", "_self", "_parent", "_top"]
};

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
  if (container._pnpDone) return; // garde anti double-init
  container._pnpDone = true;

  // 1. Wrapper HORS du container SCEditor (frere juste apres) : hors de portee de
  //    l'interception clavier qui vit dans le sous-arbre du container.
  const host = document.createElement("div");
  host.className = "pnp-cm-host";
  const shadow = document.createElement("textarea");
  shadow.value = inst.val();
  host.appendChild(shadow);
  container.parentNode.insertBefore(host, container.nextSibling);

  // 2. Masque le textarea source natif du container (garde la toolbar visible/utilisable).
  const sourceTextarea = container.querySelector("textarea");
  if (sourceTextarea) sourceTextarea.style.display = "none";

  const cm = window.CodeMirror.fromTextArea(shadow, {
    mode: "pnp-bbcode",
    lineWrapping: true,
    viewportMargin: Infinity,
    theme: "pnp"
  });
  container._pnpCM = cm;

  let syncing = false;

  // 3. CM -> champ POST : chaque edition clavier pousse via l'API (ciblee par ID).
  cm.on("change", () => {
    if (syncing) return;
    syncing = true;
    inst.val(cm.getValue());
    if (inst.updateOriginal) inst.updateOriginal();
    syncing = false;
  });

  // 4. Toolbar FA -> CM : les boutons inserent via ces methodes. On relit apres coup.
  const pullIntoCM = () => {
    if (syncing) return;
    syncing = true;
    const v = inst.val();
    if (v !== cm.getValue()) {
      const pos = cm.getCursor();
      cm.setValue(v);
      cm.setCursor(pos);
    }
    syncing = false;
  };
  wrapInsert(inst, "sourceEditorInsertText", pullIntoCM);
  wrapInsert(inst, "insert", pullIntoCM);

  // 5. Bascule source <-> WYSIWYG : CM visible seulement en sourceMode.
  const syncVisibility = () => {
    if (container.classList.contains("sourceMode")) {
      syncing = true;
      cm.setValue(inst.val());
      syncing = false;
      host.style.display = "";
      cm.refresh();
    } else {
      host.style.display = "none";
    }
  };
  syncVisibility();
  new MutationObserver(syncVisibility).observe(container, {
    attributes: true,
    attributeFilter: ["class"]
  });

  // 6. Volet INPUTS : bouton bascule code <-> formulaire assiste.
  setupForm(host, cm);
}

/* ---- Volet INPUTS (Pimp My Post) ------------------------------------------ */

function setupForm(host, cm) {
  const panel = document.createElement("div");
  panel.className = "pnp-pmp-panel";
  panel.style.display = "none";
  host.parentNode.insertBefore(panel, host.nextSibling);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pnp-pmp-toggle button2";
  toggle.textContent = "Pimp My Post";
  host.parentNode.insertBefore(toggle, host);

  let formMode = false;
  toggle.addEventListener("click", () => {
    formMode = !formMode;
    if (formMode) {
      buildForm(panel, cm);
      host.style.display = "none";
      panel.style.display = "";
      toggle.textContent = "\u2190 Revenir au code";
    } else {
      stripAnchors(cm); // retire les data-pnp-id avant de rendre la main au code
      host.style.display = "";
      panel.style.display = "none";
      cm.refresh();
      toggle.textContent = "Pimp My Post";
    }
  });
}

// Normalise les cibles editables d'un element : fillable -> ["text"], sinon liste data-input.
function parseTargets(el) {
  if (el.hasAttribute("fillable")) return ["text"];
  const raw = el.getAttribute("data-input") || "";
  return raw.split(/\s+/).filter(Boolean);
}

// Construit le formulaire : pose les ancres, parse, genere un groupe de champs par element.
function buildForm(panel, cm) {
  panel.innerHTML = "";
  ensureAnchors(cm);

  const doc = new DOMParser().parseFromString(cm.getValue(), "text/html");
  const els = [...doc.querySelectorAll("[data-input], [fillable]")];

  if (!els.length) {
    const info = document.createElement("p");
    info.className = "pnp-pmp-empty";
    info.textContent =
      "Aucun champ a remplir ici. Ajoute data-input=\"...\" ou fillable sur un element du code.";
    panel.appendChild(info);
    return;
  }

  els.forEach((el) => {
    const id = el.getAttribute("data-pnp-id");
    const targets = parseTargets(el);
    if (!targets.length) return;

    const group = document.createElement("fieldset");
    group.className = "pnp-pmp-group";

    const label = el.getAttribute("data-label");
    if (label) {
      const legend = document.createElement("legend");
      legend.textContent = label;
      group.appendChild(legend);
    }

    targets.forEach((target) => {
      const isText = target === "text";
      const fieldLabel = isText
        ? el.getAttribute("data-label-text") || "Contenu"
        : target;
      const initial = isText ? el.textContent : el.getAttribute(target) || "";

      const row = document.createElement("label");
      row.className = "pnp-pmp-field";
      const span = document.createElement("span");
      span.className = "pnp-pmp-field-label";
      span.textContent = fieldLabel;
      row.appendChild(span);

      let input;
      if (!isText && SELECT_ATTRS[target]) {
        input = document.createElement("select");
        SELECT_ATTRS[target].forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt === "" ? "(aucun)" : opt;
          if (opt === initial) o.selected = true;
          input.appendChild(o);
        });
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.value = initial;
      }
      input.className = "pnp-pmp-input";

      const handler = () => writeTarget(cm, id, target, input.value);
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);

      row.appendChild(input);
      group.appendChild(row);
    });

    panel.appendChild(group);
  });
}

// Pose un data-pnp-id unique sur chaque element cible qui n'en a pas encore.
// Reecriture ciblee dans le texte CM (pas de re-serialisation du HTML utilisateur).
function ensureAnchors(cm) {
  let code = cm.getValue();
  let counter = 0;
  // Pour chaque balise ouvrante portant data-input ou fillable, injecte l'ancre si absente.
  code = code.replace(/<([a-zA-Z][\w-]*)((?:[^<>]*?))>/g, (full, tag, attrs) => {
    if (!/\b(data-input|fillable)\b/.test(attrs)) return full;
    if (/\bdata-pnp-id\s*=/.test(attrs)) return full;
    counter++;
    return `<${tag}${attrs} data-pnp-id="${counter}">`;
  });
  if (counter > 0) cm.setValue(code);
}

// Reecriture chirurgicale : localise la balise data-pnp-id="id" et met a jour la cible.
function writeTarget(cm, id, target, value) {
  let code = cm.getValue();
  // Isole la balise ouvrante portant l'ancre.
  const tagRe = new RegExp(`<([a-zA-Z][\\w-]*)([^<>]*?\\bdata-pnp-id="${id}"[^<>]*?)>`);
  const m = code.match(tagRe);
  if (!m) return;

  if (target === "text") {
    // Remplace le textContent entre la balise ouvrante ancree et sa fermante correspondante.
    const openTag = m[0];
    const tagName = m[1];
    const start = code.indexOf(openTag) + openTag.length;
    const closeRe = new RegExp(`</${tagName}>`, "g");
    closeRe.lastIndex = start;
    const closeMatch = closeRe.exec(code);
    if (!closeMatch) return;
    code = code.slice(0, start) + escapeText(value) + code.slice(closeMatch.index);
  } else {
    // Remplace (ou insere) la valeur de l'attribut cible dans la balise ancree.
    let attrs = m[2];
    const attrRe = new RegExp(`(\\b${target}\\s*=\\s*")[^"]*(")`);
    if (attrRe.test(attrs)) {
      attrs = attrs.replace(attrRe, `$1${escapeAttr(value)}$2`);
    } else {
      attrs = ` ${target}="${escapeAttr(value)}"` + attrs;
    }
    code = code.replace(m[0], `<${m[1]}${attrs}>`);
  }
  const cursor = cm.getCursor();
  cm.setValue(code);
  cm.setCursor(cursor);
}

// Retire toutes les ancres data-pnp-id du code (avant retour a l'edition / soumission).
function stripAnchors(cm) {
  const code = cm.getValue().replace(/\s*data-pnp-id="\d+"/g, "");
  if (code !== cm.getValue()) cm.setValue(code);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}
function escapeText(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

// Grammaire mixte BBCode + HTML. Memes roles de couleur pour les deux langages :
//   tag = crochets/chevrons + nom de balise ; attribute = nom d'attribut ; string = valeur ;
//   operator = '=' ; comment = <!-- ... -->.
function defineBBCodeMode() {
  const CM = window.CodeMirror;
  if (CM._pnpBBCodeDefined) return;
  CM.defineSimpleMode("pnp-bbcode", {
    start: [
      { regex: /<!--/, token: "comment", next: "comment" },
      { regex: /\[\/[a-zA-Z0-9*]+\]/, token: "tag" },
      { regex: /\[[a-zA-Z0-9*]+/, token: "tag", next: "inTag" },
      { regex: /<\/?[a-zA-Z][\w-]*/, token: "tag", next: "inHtmlTag" }
    ],
    inTag: [
      { regex: /=/, token: "operator" },
      { regex: /"[^"]*"|'[^']*'/, token: "string" },
      { regex: /\]/, token: "tag", next: "start" },
      { regex: /[^\]=]+/, token: "attribute" }
    ],
    inHtmlTag: [
      { regex: /"[^"]*"|'[^']*'/, token: "string" },
      { regex: /=/, token: "operator" },
      { regex: /\/?>/, token: "tag", next: "start" },
      { regex: /[a-zA-Z-]+/, token: "attribute" }
    ],
    comment: [
      { regex: /.*?-->/, token: "comment", next: "start" },
      { regex: /.*/, token: "comment" }
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
