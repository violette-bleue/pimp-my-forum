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
   Le dernier mode choisi (code/form) est memorise en localStorage et reapplique a l'ouverture.
   CodeMirror n'est pas charge sur FA : le module le charge lui-meme (une seule fois).

   Convention inputs (declaree par l'auteur du template) :
     Mode simple   : data-input="href target text"  (cibles separees par espaces)
     Mode groupes  : data-input="(Lien@href) (Cible@target) (@text)"
                     -> chaque (label@cible) = un champ ; label avant le @, optionnel.
     "text"/"textarea"  -> textContent (input / textarea long) ; aussi en attribut sucre.
     "class--<groupe>"  -> groupe de classes exclusif/multi, valeurs definies en config staff.
     data-label / data-label-text -> en-tete de groupe / intitule du champ texte.
     data-freezone[="Titre"]      -> emplacement (et libelle) de la zone de texte libre ;
                                     a defaut, la zone libre ecrit avant la derniere fermeture.

   Zone de texte libre : mini-instance CodeMirror (coloree comme l'editeur principal) dont le
   contenu vit dans un element custom <pmp-freezone>...</pmp-freezone> (cree a la 1ere saisie).
   Si l'utilisateur y tape un element porteur d'un data-input, un bouton "promouvoir" apparait
   sur sa ligne (line-widget) : au clic, l'element est extrait de la zone libre et insere dans le
   code principal juste avant <pmp-freezone>, ou il devient un vrai champ assiste.

   Config staff optionnelle, lue defensivement depuis PimpMyPost.Config :
     labels  : { "href": "...", "img href": "...", "freezone": "...", ... }
     selects : { "data-size": ["sm", { value:"lg", label:"Grand" }], ... }
     classes : { layout: ["col1", { value:"col2", label:"Deux colonnes" }],   (exclusif)
                 couleur: { mode:"multi", values:["rouge","bleu"] } }          (multi)
   Partout ou une liste de valeurs est attendue, chaque entree peut etre une string
   ("val" -> label = val) ou un objet { value, label } (label optionnel, defaut = value).
   Le "value" est ce qui s'ecrit dans le code ; le "label" est purement d'affichage.

   Le champ texte accepte du markup brut (BBCode ET HTML), sans echappement.
   Les valeurs d'attributs echappent seulement les guillemets. */

const CM_VERSION = "5.65.16";
const CM_BASE = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/" + CM_VERSION;
const PMF_CSS = "https://violette-bleue.github.io/puzzle-n-pixel/css/components/pimp-my-post.css";

// Cle localStorage du dernier mode choisi ("form" | "code").
const MODE_KEY = "pmf-pmp-mode";

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
  textarea: "Contenu",
  freezone: "Ajout libre"
};

// Lecture defensive de la config staff : PimpMyPost.Config peut ne pas exister.
function getStaffConfig() {
  try {
    return (window.PimpMyPost && window.PimpMyPost.Config) || {};
  } catch (e) {
    return {};
  }
}

// Memo du mode (localStorage, defensif : navigation privee stricte, storage bloque...).
function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY);
  } catch (e) {
    return null;
  }
}
function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch (e) {
    /* storage indisponible : on ignore, le module reste fonctionnel */
  }
}

// Normalise une liste de valeurs (strings et/ou objets) -> [{ value, label }].
// "val" -> { value:"val", label:"val" } ; { value, label? } -> label defaut = value.
function normValues(list) {
  return (list || []).map((item) => {
    if (item && typeof item === "object") {
      const value = item.value != null ? String(item.value) : "";
      const label = item.label != null ? String(item.label) : value;
      return { value, label };
    }
    const s = String(item);
    return { value: s, label: s };
  });
}

// Selects effectifs = defauts du module + config.selects du staff.
function getSelectAttrs() {
  return Object.assign({}, SELECT_ATTRS, getStaffConfig().selects || {});
}

// Normalise une entree config.classes[name] -> { mode:"single"|"multi", values:[{value,label}] }.
// Tableau nu -> exclusif (single) ; objet { mode, values } -> tel quel.
function getClassGroup(name) {
  const raw = (getStaffConfig().classes || {})[name];
  if (!raw) return null;
  if (Array.isArray(raw)) return { mode: "single", values: normValues(raw) };
  return {
    mode: raw.mode === "multi" ? "multi" : "single",
    values: normValues(raw.values)
  };
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
  if (container._pmfDone) return; // garde anti double-init
  container._pmfDone = true;

  // Etat partage entre les volets (mode courant + champ PMP actif pour le routage toolbar).
  const state = { formMode: false, activeField: null };
  container._pmfState = state;

  // 1. Wrapper HORS du container SCEditor (frere juste apres) : hors de portee de
  //    l'interception clavier qui vit dans le sous-arbre du container.
  const host = document.createElement("div");
  host.className = "pmf-cm-host";
  const shadow = document.createElement("textarea");
  shadow.value = inst.val();
  host.appendChild(shadow);
  container.parentNode.insertBefore(host, container.nextSibling);

  // 2. Masque le textarea source natif du container (garde la toolbar visible/utilisable).
  const sourceTextarea = container.querySelector("textarea");
  if (sourceTextarea) sourceTextarea.style.display = "none";

  const cm = window.CodeMirror.fromTextArea(shadow, {
    mode: "pmf-bbcode",
    lineWrapping: true,
    viewportMargin: Infinity,
    theme: "pmf"
  });
  container._pmfCM = cm;

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
// Balise custom de la zone de texte libre (voir entete). Un tiret = custom element valide.
const FREE_TAG = "pmp-freezone";

function setupForm(host, cm, state) {
  const panel = document.createElement("div");
  panel.className = "pmf-pmp-panel";
  panel.style.display = "none";
  host.parentNode.insertBefore(panel, host.nextSibling);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pmf-pmp-toggle button2";
  toggle.textContent = "Pimp My Post";
  host.parentNode.insertBefore(toggle, host);

  // Applique un mode (form ou code) : bascule affichage + libelle du bouton. Utilise par le
  // clic et par la restauration du memo a l'ouverture. persist=false pour la restauration
  // initiale (inutile de reecrire ce qu'on vient de lire).
  const applyMode = (showForm, persist) => {
    state.formMode = showForm;
    if (showForm) {
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
    if (persist) saveMode(showForm ? "form" : "code");
  };

  toggle.addEventListener("click", () => applyMode(!state.formMode, true));

  // Restauration du dernier mode memorise (form ouvert meme si aucun champ, par choix).
  if (loadMode() === "form") applyMode(true, false);
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

// Cible groupe de classes ? "class--layout" -> "layout", sinon null.
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

// Ajoute une <option> a un select.
function addOption(sel, value, label, selected) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = label;
  if (selected) o.selected = true;
  sel.appendChild(o);
}

function buildForm(panel, cm, state) {
  panel.innerHTML = "";
  ensureAnchors(cm);

  const doc = new DOMParser().parseFromString(cm.getValue(), "text/html");
  const els = [...doc.querySelectorAll(TARGET_SELECTOR)];

  if (!els.length) {
    const info = document.createElement("p");
    info.className = "pmf-pmp-empty";
    info.textContent =
      "Aucun champ balise ici. Tu peux ecrire librement ci-dessous, ou ajouter des data-input dans le code.";
    panel.appendChild(info);
  }

  const selectAttrs = getSelectAttrs();

  els.forEach((el) => {
    const id = el.getAttribute("data-pmf-id");
    const tagName = el.tagName.toLowerCase();
    const targets = parseTargets(el);
    if (!targets.length) return;

    const group = document.createElement("fieldset");
    group.className = "pmf-pmp-group";

    const groupLabel = el.getAttribute("data-label");
    if (groupLabel) {
      const legend = document.createElement("legend");
      legend.textContent = groupLabel;
      group.appendChild(legend);
    }

    targets.forEach(({ target, label }) => {
      const fieldLabel = resolveLabel(target, label, tagName, el);
      const row = document.createElement("label");
      row.className = "pmf-pmp-field";
      const span = document.createElement("span");
      span.className = "pmf-pmp-field-label";
      span.textContent = fieldLabel;
      row.appendChild(span);

      const grpName = classGroupName(target);
      if (grpName) {
        // --- Groupe de classes (exclusif ou multi) ---
        const cfg = getClassGroup(grpName); // values normalisees en [{value,label}]
        if (!cfg) {
          span.textContent = fieldLabel + " (groupe inconnu)";
          group.appendChild(row);
          return;
        }
        const groupVals = cfg.values.map((v) => v.value);
        const present = currentClasses(el).filter((c) => groupVals.indexOf(c) !== -1);

        if (cfg.mode === "multi") {
          const box = document.createElement("span");
          box.className = "pmf-pmp-checks";
          cfg.values.forEach(({ value, label: optLabel }) => {
            const lbl = document.createElement("label");
            lbl.className = "pmf-pmp-check";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = value;
            cb.checked = present.indexOf(value) !== -1;
            cb.addEventListener("change", () => {
              const chosen = [...box.querySelectorAll("input:checked")].map((c) => c.value);
              writeClassGroup(cm, id, groupVals, chosen);
            });
            lbl.appendChild(cb);
            lbl.appendChild(document.createTextNode(" " + optLabel));
            box.appendChild(lbl);
          });
          row.appendChild(box);
        } else {
          const sel = document.createElement("select");
          sel.className = "pmf-pmp-input";
          addOption(sel, "", "(aucun)", present.length === 0);
          cfg.values.forEach(({ value, label: optLabel }) => {
            addOption(sel, value, optLabel, present.indexOf(value) !== -1);
          });
          sel.addEventListener("change", () => {
            writeClassGroup(cm, id, groupVals, sel.value ? [sel.value] : []);
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
        normValues(selectAttrs[target]).forEach(({ value, label: optLabel }) => {
          addOption(input, value, value === "" ? "(aucun)" : optLabel, value === initial);
        });
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.value = initial;
      }
      input.className = "pmf-pmp-input";

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

  // Zone de texte libre (mini-CM), toujours presente en fin de formulaire.
  appendFreeEditor(panel, cm, state);
}

// Zone de texte libre : mini-instance CodeMirror editant le contenu de <pmp-freezone>.
// Coloree comme l'editeur principal ; sync vers le code via writeFreeContent.
// Detecte les data-input tapes et pose un bouton "promouvoir" sur leur ligne.
function appendFreeEditor(panel, cm, state) {
  const group = document.createElement("fieldset");
  group.className = "pmf-pmp-group pmf-pmp-free";

  const legend = document.createElement("legend");
  legend.textContent = resolveFreeLabel(cm);
  group.appendChild(legend);

  const ta = document.createElement("textarea");
  ta.value = readFreeContent(cm);
  group.appendChild(ta);
  panel.appendChild(group);

  const freeCm = window.CodeMirror.fromTextArea(ta, {
    mode: "pmf-bbcode",
    lineWrapping: true,
    viewportMargin: Infinity,
    theme: "pmf"
  });
  freeCm.setSize(null, 110);
  setTimeout(() => freeCm.refresh(), 0);

  let debounce = null;
  freeCm.on("change", () => {
    writeFreeContent(cm, freeCm.getValue());
    clearTimeout(debounce);
    debounce = setTimeout(() => refreshPromoteWidgets(freeCm, panel, cm, state), 300);
  });
  freeCm.on("focus", () => {
    state.activeField = { kind: "cm-free", freeCm };
  });

  // Detection initiale (si la zone contient deja un data-input a l'ouverture).
  setTimeout(() => refreshPromoteWidgets(freeCm, panel, cm, state), 50);
}

// Scanne le mini-CM et pose un line-widget "promouvoir" sur chaque ligne portant un data-input.
function refreshPromoteWidgets(freeCm, panel, cm, state) {
  // Nettoie les widgets precedents.
  (freeCm._pmfWidgets || []).forEach((w) => w.clear());
  freeCm._pmfWidgets = [];

  const found = scanFreeInputs(freeCm.getValue());
  found.forEach(({ line, tagName, preview }) => {
    const bar = document.createElement("div");
    bar.className = "pmf-pmp-promote";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pmf-pmp-promote-btn button2";
    btn.textContent = "\u2295 Ajouter ce champ";
    const hint = document.createElement("span");
    hint.className = "pmf-pmp-promote-hint";
    hint.textContent = preview;
    bar.appendChild(btn);
    bar.appendChild(hint);

    btn.addEventListener("click", () => promoteElement(freeCm, panel, cm, state, line, tagName));

    const widget = freeCm.addLineWidget(line, bar, { above: true });
    freeCm._pmfWidgets.push(widget);
  });
}

// Repere chaque balise ouvrante portant data-input -> { line, tagName, openIndex, preview }.
function scanFreeInputs(text) {
  const out = [];
  const re = /<([a-zA-Z][\w-]*)\b[^>]*\bdata-input\b[^>]*>/g;
  let m;
  const lineStarts = computeLineStarts(text);
  while ((m = re.exec(text)) !== null) {
    const idx = m.index;
    const line = indexToLine(idx, lineStarts);
    out.push({
      line,
      tagName: m[1].toLowerCase(),
      openIndex: idx,
      preview: m[0].length > 42 ? m[0].slice(0, 40) + "\u2026" : m[0]
    });
  }
  return out;
}

// Positions de debut de chaque ligne, pour convertir un index char -> numero de ligne.
function computeLineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") starts.push(i + 1);
  }
  return starts;
}
function indexToLine(idx, lineStarts) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// Promeut l'element data-input de la ligne donnee : extrait le bloc complet du mini-CM
// et l'insere avant <pmp-freezone> dans le code principal, puis regenere le formulaire.
function promoteElement(freeCm, panel, cm, state, line, tagName) {
  const text = freeCm.getValue();
  const lineStarts = computeLineStarts(text);
  // Retrouve la balise ouvrante sur cette ligne (data-input).
  const re = /<([a-zA-Z][\w-]*)\b[^>]*\bdata-input\b[^>]*>/g;
  let m;
  let openIndex = -1;
  while ((m = re.exec(text)) !== null) {
    if (indexToLine(m.index, lineStarts) === line) {
      openIndex = m.index;
      break;
    }
  }
  if (openIndex === -1) return;

  const openEnd = openIndex + m[0].length;
  const closeIdx = findMatchingClose(text, openEnd, tagName);
  if (closeIdx === -1) return; // extraction impossible -> on laisse dans la freezone

  const closeEnd = closeIdx + `</${tagName}>`.length;
  const block = text.slice(openIndex, closeEnd);

  // Retire le bloc du mini-CM (et nettoie un eventuel retour a la ligne orphelin).
  let remaining = text.slice(0, openIndex) + text.slice(closeEnd);
  remaining = remaining.replace(/\n{3,}/g, "\n\n");
  freeCm.setValue(remaining);
  writeFreeContent(cm, remaining);

  // Insere le bloc dans le code principal, juste avant <pmp-freezone>, avec un retour ligne.
  insertBeforeFreeZone(cm, block);

  // Regenere le formulaire : le nouvel element devient un champ assiste.
  buildForm(panel, cm, state);
}

// Trouve l'index de la balise fermante correspondante en comptant l'imbrication du meme tag.
function findMatchingClose(text, fromIndex, tagName) {
  const openRe = new RegExp(`<${tagName}\\b[^>]*?>`, "gi");
  const closeRe = new RegExp(`</${tagName}\\s*>`, "gi");
  const selfClose = new RegExp(`<${tagName}\\b[^>]*/>`, "i");
  let depth = 0;
  let i = fromIndex;
  while (i < text.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const nextOpen = openRe.exec(text);
    const nextClose = closeRe.exec(text);
    if (!nextClose) return -1;
    if (nextOpen && nextOpen.index < nextClose.index) {
      // balise ouvrante du meme tag (ignore les self-closing <tag .../>)
      if (!selfClose.test(nextOpen[0])) depth++;
      i = nextOpen.index + nextOpen[0].length;
    } else {
      if (depth === 0) return nextClose.index;
      depth--;
      i = nextClose.index + nextClose[0].length;
    }
  }
  return -1;
}

// Insere un bloc dans le code principal juste avant <pmp-freezone> (avec retour a la ligne).
function insertBeforeFreeZone(cm, block) {
  let code = cm.getValue();
  const re = new RegExp(`<${FREE_TAG}\\b`);
  const m = code.match(re);
  if (m) {
    const idx = code.indexOf(m[0]);
    code = code.slice(0, idx) + block + "\n" + code.slice(idx);
  } else {
    // pas de freezone (rare ici) : on ajoute a la fin.
    code = code + "\n" + block;
  }
  const cursor = cm.getCursor();
  cm.setValue(code);
  cm.setCursor(cursor);
}

// Libelle de la zone libre : data-freezone="Titre" (auteur) > config staff > dico.
function resolveFreeLabel(cm) {
  const code = cm.getValue();
  const m = code.match(/\bdata-freezone\s*=\s*"([^"]*)"/);
  if (m && m[1].trim()) return m[1].trim();
  const staff = getStaffConfig().labels || {};
  return staff.freezone || DEFAULT_LABELS.freezone;
}

// Lit le contenu actuel du <pmp-freezone> s'il existe.
function readFreeContent(cm) {
  const code = cm.getValue();
  const m = code.match(new RegExp(`<${FREE_TAG}\\b[^>]*>([\\s\\S]*?)</${FREE_TAG}>`));
  return m ? m[1] : "";
}

// Ecrit le contenu de la zone libre. Cree le <pmp-freezone> a la 1ere saisie non vide,
// a l'emplacement voulu (data-freezone en priorite, sinon avant la derniere fermeture).
function writeFreeContent(cm, value) {
  let code = cm.getValue();
  const existing = new RegExp(`<${FREE_TAG}\\b[^>]*>[\\s\\S]*?</${FREE_TAG}>`);

  if (existing.test(code)) {
    code = code.replace(existing, `<${FREE_TAG}>${value}</${FREE_TAG}>`);
  } else {
    if (!value) return; // rien a ecrire, on ne cree pas d'element vide
    code = insertFreeZone(code, `<${FREE_TAG}>${value}</${FREE_TAG}>`);
  }
  const cursor = cm.getCursor();
  cm.setValue(code);
  cm.setCursor(cursor);
}

// Insere la zone libre : dans data-freezone si present, sinon avant la derniere
// sequence de balises fermantes (heuristique de repli).
function insertFreeZone(code, block) {
  const fz = code.match(/<([a-zA-Z][\w-]*)\b[^>]*\bdata-freezone\b[^>]*>/);
  if (fz) {
    const tagName = fz[1];
    const openEnd = code.indexOf(fz[0]) + fz[0].length;
    const closeRe = new RegExp(`</${tagName}>`, "g");
    closeRe.lastIndex = openEnd;
    const close = closeRe.exec(code);
    if (close) {
      return code.slice(0, close.index) + block + code.slice(close.index);
    }
  }
  const tail = code.match(/((?:\s*<\/[a-zA-Z][\w-]*>)+)\s*$/);
  if (tail) {
    const idx = code.lastIndexOf(tail[1]);
    return code.slice(0, idx) + block + code.slice(idx);
  }
  return code + block;
}

// Insere du texte a la position du curseur dans le champ actif, puis resync.
// Gere deux types de champ actif : input/textarea natif (.el) ou mini-CM libre (.freeCm).
function insertIntoField(field, cm, open, close) {
  const o = open || "";
  const c = close || "";

  if (field.kind === "cm-free" && field.freeCm) {
    const fcm = field.freeCm;
    const sel = fcm.getSelection();
    fcm.replaceSelection(o + sel + c);
    if (!sel) {
      const pos = fcm.getCursor();
      fcm.setCursor({ line: pos.line, ch: pos.ch - c.length });
    }
    fcm.focus();
    return;
  }

  const el = field.el;
  if (!el) return;
  const start = el.selectionStart != null ? el.selectionStart : el.value.length;
  const end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  const before = el.value.slice(0, start);
  const selected = el.value.slice(start, end);
  const after = el.value.slice(end);

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
    if (/\bdata-pmf-id\s*=/.test(attrs)) return full;
    counter++;
    return `<${tag}${attrs} data-pmf-id="${counter}">`;
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
  const tagRe = new RegExp(`<([a-zA-Z][\\w-]*)([^<>]*?\\bdata-pmf-id="${id}"[^<>]*?)>`);
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

// Retire les ancres data-pmf-id (le <pmp-freezone> reste tel quel : il est son propre marqueur).
function stripAnchors(cm) {
  const code = cm.getValue().replace(/\s*data-pmf-id="\d+"/g, "");
  if (code !== cm.getValue()) cm.setValue(code);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

function wrapInsert(inst, fnName, state, after) {
  const original = inst[fnName];
  if (typeof original !== "function" || original._pmfWrapped) return;
  const wrapped = function (open, close) {
    const f = state.activeField;
    if (state.formMode && f && (f.el || f.freeCm)) {
      insertIntoField(f, getCM(), open, close);
      return;
    }
    const r = original.apply(this, arguments);
    after();
    return r;
  };
  wrapped._pmfWrapped = true;
  inst[fnName] = wrapped;
}

function getCM() {
  const orig = document.getElementById("text_editor_textarea");
  const container = orig && orig.nextElementSibling;
  return container ? container._pmfCM : null;
}

function loadCodeMirror(cb) {
  if (window.CodeMirror) {
    defineBBCodeMode();
    return cb();
  }
  injectCss(CM_BASE + "/codemirror.min.css");
  injectCss(pmf_CSS);
  injectScript(CM_BASE + "/codemirror.min.js", () => {
    injectScript(CM_BASE + "/addon/mode/simple.min.js", () => {
      defineBBCodeMode();
      cb();
    });
  });
}

function defineBBCodeMode() {
  const CM = window.CodeMirror;
  if (CM._pmfBBCodeDefined) return;
  CM.defineSimpleMode("pmf-bbcode", {
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
  CM._pmfBBCodeDefined = true;
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
