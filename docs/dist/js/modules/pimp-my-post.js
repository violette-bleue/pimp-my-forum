/* modules/pimp-my-post.js — "Pimp My Post" : glow-up des posts dans l'editeur SCEditor.
   Deux volets sous un meme toit, partageant la meme instance CodeMirror :
     1. COLORATION syntaxique BBCode + HTML (balises, attributs, valeurs, commentaires)
     2. INPUTS assistes : bascule code <-> formulaire genere a partir des data-input

   CM est monte HORS du container SCEditor (frere, apres lui) pour echapper a l'interception
   clavier que SCEditor applique dans son propre sous-arbre. Le textarea source natif est
   masque mais nourri via inst.val() (BBCode canonique propre, ciblee par ID).
   Sync bidirectionnel : frappe CM -> val(x) ; toolbar FA (insert) -> relit val() vers CM.
   En mode formulaire, la toolbar est routee vers le dernier champ PMP actif (a la position
   du curseur) au lieu du contenu global.
   CodeMirror n'est pas charge sur FA : le module le charge lui-meme (une seule fois).

   Convention inputs (declaree par l'auteur du template) :
     Mode simple   : data-input="href target text"  (cibles separees par espaces)
     Mode groupes  : data-input="(Lien@href) (Cible@target) (@text)"
                     -> chaque (label@cible) = un champ ; label avant le @, optionnel.
     "text"/"textarea"  -> textContent (input / textarea long) ; aussi en attribut sucre.
     "class--<groupe>"  -> groupe de classes exclusif/multi, valeurs definies en config staff.
     data-label / data-label-text -> en-tete de groupe / intitule du champ texte.

   Config staff optionnelle, lue defensivement depuis PimpMyPost.Config :
     labels  : { "href": "...", "img href": "...", ... }
     selects : { "data-size": ["petit","moyen","grand"], ... }        (menus deroulants)
     classes : { layout: ["col1","col2"],                              (groupe exclusif)
                 couleur: { mode:"multi", values:["rouge","bleu"] } }  (groupe multi)

   Le champ texte accepte du markup brut (BBCode ET HTML), sans echappement.
   Les valeurs d'attributs echappent seulement les guillemets. */

const CM_VERSION = "5.65.16";
const CM_BASE = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/" + CM_VERSION;
const PNP_CSS = "https://violette-bleue.github.io/puzzle-n-pixel/dist/css/components/pimp-my-post.css";

// Attributs rendus en menu deroulant par defaut ("" = option vide). Fusionnes avec config.selects.
const SELECT_ATTRS = {
  target: ["", "_blank", "_self", "_parent", "_top"]
};

// Dico de labels par defaut du module. Cles simples ("href") ou contextuelles ("img href").
const DEFAULT_LABELS = {
  href: "Lien",
  "img href": "Lien direct vers l'image",
  src: "Source",
  "img src": "Image (URL)",
  title: "Contenu du tooltip",
  alt: "Texte alternatif",
  target: "Cible",
  text: "Contenu",
  textarea: "Contenu"
};

// Lecture defensive de la config staff : PimpMyPost.Config peut ne pas exister.
function getStaffConfig() {
  try {
    return (window.PimpMyPost && window.PimpMyPost.Config) || {};
  } catch (e) {
    return {};
  }
}

// Selects effectifs = defauts du module + config.selects du staff.
function getSelectAttrs() {
  return Object.assign({}, SELECT_ATTRS, getStaffConfig().selects || {});
}

// Normalise une entree config.classes[name] -> { mode:"single"|"multi", values:[...] }.
// Tableau nu -> exclusif (single) ; objet { mode, values } -> tel quel.
function getClassGroup(name) {
  const raw = (getStaffConfig().classes || {})[name];
  if (!raw) return null;
  if (Array.isArray(raw)) return { mode: "single", values: raw };
  return { mode: raw.mode === "multi" ? "multi" : "single", values: raw.values || [] };
}

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

  // Etat partage entre les volets (mode courant + champ PMP actif pour le routage toolbar).
  const state = { formMode: false, activeField: null };
  container._pnpState = state;

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

  // 4. Toolbar FA. Mode code : insertion globale + relecture vers CM. Mode formulaire :
  //    on route l'insertion vers le champ PMP actif et on court-circuite le global.
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
  wrapInsert(inst, "sourceEditorInsertText", state, pullIntoCM);
  wrapInsert(inst, "insert", state, pullIntoCM);

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
  setupForm(host, cm, state);
}

/* ---- Volet INPUTS (Pimp My Post) ------------------------------------------ */

const TARGET_SELECTOR = "[data-input], [text], [textarea]";

function setupForm(host, cm, state) {
  const panel = document.createElement("div");
  panel.className = "pnp-pmp-panel";
  panel.style.display = "none";
  host.parentNode.insertBefore(panel, host.nextSibling);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pnp-pmp-toggle button2";
  toggle.textContent = "Pimp My Post";
  host.parentNode.insertBefore(toggle, host);

  toggle.addEventListener("click", () => {
    state.formMode = !state.formMode;
    if (state.formMode) {
      buildForm(panel, cm, state);
      host.style.display = "none";
      panel.style.display = "";
      toggle.textContent = "\u2190 Revenir au code";
    } else {
      state.activeField = null;
      stripAnchors(cm);
      host.style.display = "";
      panel.style.display = "none";
      cm.refresh();
      toggle.textContent = "Pimp My Post";
    }
  });
}

// Normalise les cibles editables -> liste de { target, label } (label null si absent).
function parseTargets(el) {
  if (el.hasAttribute("textarea")) return [{ target: "textarea", label: null }];
  if (el.hasAttribute("text")) return [{ target: "text", label: null }];

  const raw = el.getAttribute("data-input") || "";
  if (raw.indexOf("(") !== -1) {
    const out = [];
    const re = /\(([^)]*)\)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const inner = m[1];
      const at = inner.lastIndexOf("@");
      let label = null;
      let target;
      if (at !== -1) {
        label = inner.slice(0, at).trim() || null;
        target = inner.slice(at + 1).trim();
      } else {
        target = inner.trim();
      }
      if (target) out.push({ target, label });
    }
    return out;
  }
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((target) => ({ target, label: null }));
}

function isTextTarget(t) {
  return t === "text" || t === "textarea";
}

// Cible groupe de classes ? "class--layout" -> { group:"layout" }, sinon null.
function classGroupName(target) {
  return target.indexOf("class--") === 0 ? target.slice("class--".length) : null;
}

function resolveLabel(target, explicitLabel, tagName, el) {
  if (explicitLabel) return explicitLabel;
  if (isTextTarget(target)) {
    const dlt = el.getAttribute("data-label-text");
    if (dlt) return dlt;
  }
  const staff = getStaffConfig().labels || {};
  const ctxKey = tagName + " " + target;
  if (staff[ctxKey]) return staff[ctxKey];
  if (staff[target]) return staff[target];
  if (DEFAULT_LABELS[ctxKey]) return DEFAULT_LABELS[ctxKey];
  if (DEFAULT_LABELS[target]) return DEFAULT_LABELS[target];
  return target;
}

// Liste des classes actuelles de l'element (depuis l'attribut class brut).
function currentClasses(el) {
  return (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
}

function buildForm(panel, cm, state) {
  panel.innerHTML = "";
  ensureAnchors(cm);

  const doc = new DOMParser().parseFromString(cm.getValue(), "text/html");
  const els = [...doc.querySelectorAll(TARGET_SELECTOR)];

  if (!els.length) {
    const info = document.createElement("p");
    info.className = "pnp-pmp-empty";
    info.textContent =
      "Aucun champ a remplir ici. Ajoute data-input=\"...\", text ou textarea sur un element.";
    panel.appendChild(info);
    return;
  }

  const selectAttrs = getSelectAttrs();

  els.forEach((el) => {
    const id = el.getAttribute("data-pnp-id");
    const tagName = el.tagName.toLowerCase();
    const targets = parseTargets(el);
    if (!targets.length) return;

    const group = document.createElement("fieldset");
    group.className = "pnp-pmp-group";

    const groupLabel = el.getAttribute("data-label");
    if (groupLabel) {
      const legend = document.createElement("legend");
      legend.textContent = groupLabel;
      group.appendChild(legend);
    }

    targets.forEach(({ target, label }) => {
      const fieldLabel = resolveLabel(target, label, tagName, el);
      const row = document.createElement("label");
      row.className = "pnp-pmp-field";
      const span = document.createElement("span");
      span.className = "pnp-pmp-field-label";
      span.textContent = fieldLabel;
      row.appendChild(span);

      const grpName = classGroupName(target);
      if (grpName) {
        // --- Groupe de classes (exclusif ou multi) ---
        const cfg = getClassGroup(grpName);
        if (!cfg) {
          span.textContent = fieldLabel + " (groupe inconnu)";
          group.appendChild(row);
          return;
        }
        const present = currentClasses(el).filter((c) => cfg.values.indexOf(c) !== -1);

        if (cfg.mode === "multi") {
          const box = document.createElement("span");
          box.className = "pnp-pmp-checks";
          cfg.values.forEach((val) => {
            const lbl = document.createElement("label");
            lbl.className = "pnp-pmp-check";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = val;
            cb.checked = present.indexOf(val) !== -1;
            cb.addEventListener("change", () => {
              const chosen = [...box.querySelectorAll("input:checked")].map((c) => c.value);
              writeClassGroup(cm, id, cfg.values, chosen);
            });
            lbl.appendChild(cb);
            lbl.appendChild(document.createTextNode(" " + val));
            box.appendChild(lbl);
          });
          row.appendChild(box);
        } else {
          const sel = document.createElement("select");
          sel.className = "pnp-pmp-input";
          [""].concat(cfg.values).forEach((val) => {
            const o = document.createElement("option");
            o.value = val;
            o.textContent = val === "" ? "(aucun)" : val;
            if (present.indexOf(val) !== -1) o.selected = true;
            sel.appendChild(o);
          });
          sel.addEventListener("change", () => {
            writeClassGroup(cm, id, cfg.values, sel.value ? [sel.value] : []);
          });
          row.appendChild(sel);
        }
        group.appendChild(row);
        return;
      }

      // --- Cibles standard (texte, attribut libre, select) ---
      const textTarget = isTextTarget(target);
      const initial = textTarget
        ? readRawText(cm, id, tagName)
        : el.getAttribute(target) || "";

      let input;
      if (target === "textarea") {
        input = document.createElement("textarea");
        input.rows = 4;
        input.value = initial;
      } else if (!textTarget && selectAttrs[target]) {
        input = document.createElement("select");
        selectAttrs[target].forEach((opt) => {
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

      if (input.tagName !== "SELECT") {
        input.addEventListener("focus", () => {
          state.activeField = { el: input, id, target };
        });
      }

      row.appendChild(input);
      group.appendChild(row);
    });

    panel.appendChild(group);
  });
}

function insertIntoField(field, cm, open, close) {
  const el = field.el;
  const start = el.selectionStart != null ? el.selectionStart : el.value.length;
  const end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  const before = el.value.slice(0, start);
  const selected = el.value.slice(start, end);
  const after = el.value.slice(end);
  const o = open || "";
  const c = close || "";

  el.value = before + o + selected + c + after;
  const caret = selected ? start + o.length + selected.length + c.length : start + o.length;
  el.focus();
  el.setSelectionRange(caret, caret);

  writeTarget(cm, field.id, field.target, el.value);
}

function ensureAnchors(cm) {
  let code = cm.getValue();
  let counter = 0;
  code = code.replace(/<([a-zA-Z][\w-]*)((?:[^<>]*?))>/g, (full, tag, attrs) => {
    if (!/\b(data-input|textarea|text)\b/.test(attrs)) return full;
    if (/\bdata-pnp-id\s*=/.test(attrs)) return full;
    counter++;
    return `<${tag}${attrs} data-pnp-id="${counter}">`;
  });
  if (counter > 0) cm.setValue(code);
}

function readRawText(cm, id, tagName) {
  const code = cm.getValue();
  const m = matchAnchoredTag(code, id);
  if (!m) return "";
  const start = code.indexOf(m[0]) + m[0].length;
  const closeRe = new RegExp(`</${tagName}>`, "g");
  closeRe.lastIndex = start;
  const closeMatch = closeRe.exec(code);
  if (!closeMatch) return "";
  return code.slice(start, closeMatch.index);
}

function matchAnchoredTag(code, id) {
  const tagRe = new RegExp(`<([a-zA-Z][\\w-]*)([^<>]*?\\bdata-pnp-id="${id}"[^<>]*?)>`);
  return code.match(tagRe);
}

// Reecriture chirurgicale d'un attribut ou du textContent.
function writeTarget(cm, id, target, value) {
  let code = cm.getValue();
  const m = matchAnchoredTag(code, id);
  if (!m) return;

  if (isTextTarget(target)) {
    const openTag = m[0];
    const tagName = m[1];
    const start = code.indexOf(openTag) + openTag.length;
    const closeRe = new RegExp(`</${tagName}>`, "g");
    closeRe.lastIndex = start;
    const closeMatch = closeRe.exec(code);
    if (!closeMatch) return;
    code = code.slice(0, start) + value + code.slice(closeMatch.index);
  } else {
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

// Operation d'ensemble sur l'attribut class : retire les membres du groupe presents,
// ajoute les choisis, preserve les classes hors-groupe. N'ecrase jamais tout l'attribut.
function writeClassGroup(cm, id, groupValues, chosen) {
  let code = cm.getValue();
  const m = matchAnchoredTag(code, id);
  if (!m) return;

  let attrs = m[2];
  const classRe = /(\bclass\s*=\s*")([^"]*)(")/;
  const existing = classRe.test(attrs) ? attrs.match(classRe)[2].split(/\s+/).filter(Boolean) : [];
  // Garde tout ce qui n'appartient pas au groupe, puis ajoute les valeurs choisies.
  const kept = existing.filter((c) => groupValues.indexOf(c) === -1);
  const next = kept.concat(chosen).join(" ");

  if (classRe.test(attrs)) {
    attrs = attrs.replace(classRe, `$1${escapeAttr(next)}$3`);
  } else {
    attrs = ` class="${escapeAttr(next)}"` + attrs;
  }
  code = code.replace(m[0], `<${m[1]}${attrs}>`);

  const cursor = cm.getCursor();
  cm.setValue(code);
  cm.setCursor(cursor);
}

function stripAnchors(cm) {
  const code = cm.getValue().replace(/\s*data-pnp-id="\d+"/g, "");
  if (code !== cm.getValue()) cm.setValue(code);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

function wrapInsert(inst, fnName, state, after) {
  const original = inst[fnName];
  if (typeof original !== "function" || original._pnpWrapped) return;
  const wrapped = function (open, close) {
    if (state.formMode && state.activeField && state.activeField.el) {
      insertIntoField(state.activeField, getCM(), open, close);
      return;
    }
    const r = original.apply(this, arguments);
    after();
    return r;
  };
  wrapped._pnpWrapped = true;
  inst[fnName] = wrapped;
}

function getCM() {
  const orig = document.getElementById("text_editor_textarea");
  const container = orig && orig.nextElementSibling;
  return container ? container._pnpCM : null;
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
