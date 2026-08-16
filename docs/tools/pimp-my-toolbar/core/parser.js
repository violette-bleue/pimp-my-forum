/* pimp-my-toolbar/core/parser.js — l'IMPORTEUR, miroir inverse de generator.js */

import { createInitialState, setStyle } from "./state.js";
import { PACKS, DEFAULT_PACK, getPack } from "../data/packs.js";

// Correspondance inverse de ALIGN_TO_JUSTIFY (generator.js).
const JUSTIFY_TO_ALIGN = {
  "flex-start": "left",
  center: "center",
  "flex-end": "right"
};

// Marqueurs de blocs, dans l'ordre ou generateCss() les emet
const CSS_MARKERS = [
  "Reglages — modifie ces valeurs pour tout repercuter",
  "Disposition + reset des regles natives parasites (fond, bordure)",
  "Socle : dimensions, centrage, neutralisation du sprite natif",
  "Glyphes par commande",
  "Boutons masques",
  "Ordre intra-groupe",
  "Habillage",
  "Editeur collant au scroll"
];

// Reconstruit un etat complet a partir du CSS et du JS deja generes (ou colles depuis le forum)
export function parseImport(cssText, jsText) {
  const state = createInitialState();
  const css = cssText || "";

  const pack = parsePack(css, state);
  const blocks = splitByMarkers(css, CSS_MARKERS);

  parseVars(blocks["Reglages — modifie ces valeurs pour tout repercuter"], state);
  parseGlyphs(blocks["Glyphes par commande"], state, pack);
  parseHidden(blocks["Boutons masques"], state);
  parseOrder(blocks["Ordre intra-groupe"], state);
  parseHabillage(blocks["Habillage"], state);
  if (blocks["Editeur collant au scroll"]) setStyle(state, "toolbar", "sticky", true);

  parseJs(jsText || "", state);

  return state;
}

// --- Pack d'icones -----------------------------------------------------------

function parsePack(css, state) {
  const fontFamily = matchDecl(css, "--pmt-font-pack");
  const importUrl = firstMatch(css, /@import url\(['"]([^'"]+)['"]\)/);

  let found = null;
  if (fontFamily) {
    const clean = fontFamily.replace(/^'|'$/g, "");
    found = Object.values(PACKS).find((p) => p.font.family === clean);
  }
  if (!found && importUrl) {
    found = Object.values(PACKS).find((p) => p.font.import === importUrl);
  }

  state.iconPack = found ? found.id : DEFAULT_PACK;
  return getPack(state.iconPack);
}

// --- Variables (taille, gap, couleurs...) -------------------------------------

function parseVars(block, state) {
  if (!block) return;

  const btnSize = matchDecl(block, "--pmt-btn-size");
  const gap = matchDecl(block, "--pmt-gap");
  const radius = matchDecl(block, "--pmt-radius");
  const iconSize = matchDecl(block, "--pmt-icon-size");
  const iconColor = matchDecl(block, "--pmt-icon-color");
  const hoverColor = matchDecl(block, "--pmt-icon-color-hover");
  const hoverBg = matchDecl(block, "--pmt-btn-bg-hover");

  if (btnSize) setStyle(state, "button", "size", btnSize);
  if (gap) setStyle(state, "group", "gap", gap);
  if (radius) setStyle(state, "button", "radius", radius);
  if (iconSize) setStyle(state, "icon", "size", iconSize);
  if (iconColor && iconColor !== "currentColor") setStyle(state, "button", "color", iconColor);
  if (hoverColor) setStyle(state, "button", "hoverColor", hoverColor);
  if (hoverBg) setStyle(state, "button", "hoverBg", hoverBg);
}

// --- Glyphes surcharges par bouton --------------------------------------------

function parseGlyphs(block, state, pack) {
  if (!block) return;
  const re = /\[data-sceditor-command="([a-zA-Z]+)"\]::before\s*\{\s*content:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(block))) {
    const [, command, glyph] = m;
    if (state.buttons[command] && pack.icons[command] && glyph !== pack.icons[command]) {
      state.buttons[command].icon = glyph;
    }
  }
}

// --- Masquage ------------------------------------------------------------------

function parseHidden(block, state) {
  if (!block) return;
  const re = /\[data-sceditor-command="([a-zA-Z]+)"\]\s*\{\s*display:\s*none/g;
  let m;
  while ((m = re.exec(block))) {
    if (state.buttons[m[1]]) state.buttons[m[1]].hidden = true;
  }
}

// --- Ordre intra-groupe (groupes non affectes par un deplacement) --------------

function parseOrder(block, state) {
  if (!block) return;
  const re = /\[data-sceditor-command="([a-zA-Z]+)"\]\s*\{\s*order:\s*(\d+)/g;
  let m;
  while ((m = re.exec(block))) {
    if (state.buttons[m[1]]) state.buttons[m[1]].order = parseInt(m[2], 10);
  }
}

// --- Habillage (fond, bordure, radius, padding, disposition...) ----------------

function parseHabillage(block, state) {
  if (!block) return;

  const tb = matchRuleBody(block, ".sceditor-toolbar");
  if (tb) {
    const bg = matchDecl(tb, "background");
    const padding = matchDecl(tb, "padding");
    const radius = matchDecl(tb, "border-radius");
    const direction = matchDecl(tb, "flex-direction");
    const maxWidth = matchDecl(tb, "max-width");
    const gap = matchDecl(tb, "gap");
    const wrap = matchDecl(tb, "flex-wrap");
    const border = matchDecl(tb, "border");
    const justify = matchDecl(tb, "justify-content") || matchDecl(tb, "align-items");

    if (bg) setStyle(state, "toolbar", "bg", bg);
    if (padding) setStyle(state, "toolbar", "padding", padding);
    if (radius) setStyle(state, "toolbar", "radius", radius);
    if (direction) setStyle(state, "toolbar", "direction", direction);
    if (maxWidth) setStyle(state, "toolbar", "maxWidth", maxWidth);
    if (gap) setStyle(state, "toolbar", "gap", gap);
    if (wrap === "nowrap") setStyle(state, "toolbar", "wrap", "nowrap");
    if (border) setStyle(state, "toolbar", "border", border);
    if (justify && JUSTIFY_TO_ALIGN[justify]) setStyle(state, "toolbar", "align", JUSTIFY_TO_ALIGN[justify]);
  }

  const gr = matchRuleBody(block, ".sceditor-toolbar .sceditor-group");
  if (gr) {
    const bg = matchDecl(gr, "background");
    const border = matchDecl(gr, "border");
    const radius = matchDecl(gr, "border-radius");
    const padding = matchDecl(gr, "padding");
    const width = matchDecl(gr, "width");

    if (bg) setStyle(state, "group", "bg", bg);
    if (border) setStyle(state, "group", "border", border);
    if (radius) setStyle(state, "group", "radius", radius);
    if (padding) setStyle(state, "group", "padding", padding);
    if (width) setStyle(state, "group", "width", width);
  }

  const bt = matchRuleBody(block, ".sceditor-toolbar .sceditor-button");
  if (bt) {
    const bg = matchDecl(bt, "background");
    const border = matchDecl(bt, "border");
    const padding = matchDecl(bt, "padding");

    if (bg) setStyle(state, "button", "bg", bg);
    if (border) setStyle(state, "button", "border", border);
    if (padding) setStyle(state, "button", "padding", padding);
  }
}

// --- JS : deplacement inter-groupes + boutons custom ----------------------------

function parseJs(js, state) {
  const glMatch = js.match(/var GROUP_LAYOUT = (\{[\s\S]*?\});/);
  if (glMatch) {
    try {
      const layout = JSON.parse(glMatch[1]);
      Object.keys(layout).forEach((groupIndexStr) => {
        const groupIndex = parseInt(groupIndexStr, 10);
        layout[groupIndexStr].forEach((command, i) => {
          if (state.buttons[command]) {
            state.buttons[command].group = groupIndex;
            state.buttons[command].order = i;
          }
        });
      });
    } catch (e) { /* JSON inattendu (CSS/JS retouche a la main) : on ignore ce morceau */ }
  }

  const customMatch = js.match(/var CUSTOM = (\[[\s\S]*?\]);/);
  if (customMatch) {
    try {
      const custom = JSON.parse(customMatch[1]);
      custom.forEach((btn, i) => {
        state.custom.push(Object.assign({ hidden: false, order: i }, btn));
      });
    } catch (e) { /* idem */ }
  }
}

// --- Utilitaires -----------------------------------------------------------------

// Decoupe le CSS en sections d'apres une liste de marqueurs connus (commentaires en
// tete de bloc dans generator.js), dans l'ordre ou ils apparaissent reellement.
function splitByMarkers(css, markers) {
  const found = markers
    .map((marker) => ({ marker, idx: css.indexOf("/* " + marker) }))
    .filter((m) => m.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  const blocks = {};
  found.forEach((f, i) => {
    const end = i + 1 < found.length ? found[i + 1].idx : css.length;
    blocks[f.marker] = css.slice(f.idx, end);
  });
  return blocks;
}

// Corps ({ ... }) de la premiere regle dont le selecteur correspond exactement (pas de
// faux-positif entre ".sceditor-toolbar" et ".sceditor-toolbar .sceditor-group").
function matchRuleBody(text, selector) {
  const re = new RegExp(escapeRe(selector) + "\\s*\\{([\\s\\S]*?)\\}");
  const m = text.match(re);
  return m ? m[1] : null;
}

// Valeur d'une declaration ("prop: valeur;"), !important retire.
function matchDecl(text, prop) {
  if (!text) return null;
  const re = new RegExp(escapeRe(prop) + "\\s*:\\s*([^;]+);");
  const m = text.match(re);
  return m ? m[1].replace(/!important/gi, "").trim() : null;
}

function firstMatch(text, re) {
  const m = text.match(re);
  return m ? m[1] : null;
}

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
