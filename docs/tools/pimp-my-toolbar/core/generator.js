/* pimp-my-toolbar/core/generator.js — serialise l'etat en code pret a coller : { css, js } */

import { getPack } from "../data/packs.js";
import { TOOLBAR_REFERENCE, ALL_COMMANDS, NATIVE_GROUP } from "../data/toolbar-reference.js";

// Valeurs par defaut des variables, utilisees quand l'etat ne definit rien.
const DEFAULTS = {
  buttonSize: "32px",
  gap: "5px",
  iconSize: "18px",
  iconColor: "currentColor",
  radius: "6px"
};

// Alignement des groupes dans la toolbar (justify-content)
const ALIGN_TO_JUSTIFY = {
  left: "flex-start",
  center: "center",
  right: "flex-end"
};

// Selecteur d'un bouton par sa commande.
function sel(command) {
  return `.sceditor-button[data-sceditor-command="${command}"]`;
}

// Renvoie les commandes dont l'etat verifie un predicat (helper de diff).
function commandsWhere(state, pred) {
  return ALL_COMMANDS.filter((c) => state.buttons[c] && pred(state.buttons[c]));
}

// Genere le CSS + le JS a partir de l'etat.
// options : { applyPack:true } -> inclure le bloc pack d'icones (sinon icones natives gardees)
export function generate(state, options = {}) {
  const applyPack = options.applyPack !== false;
  return {
    css: generateCss(state, applyPack),
    js: generateJs(state)
  };
}

function generateCss(state, applyPack) {
  const pack = getPack(state.iconPack);
  const blocks = [];

  // 1. @import du pack — DOIT etre la premiere regle du CSS.
  if (applyPack && pack.font && pack.font.import) {
    blocks.push(`@import url('${pack.font.import}');`);
  }

  blocks.push("/* ===== 🌈 ૮ ˶ᵔ ᵕ ᵔ˶ ა Pimp My Toolbar 🌈 CSS généré sur https://pimpmyforum.forumactif.com/ ===== */");

  // 2. Variables : le seul endroit a modifier pour ajuster l'ensemble.
  blocks.push(varsBlock(state, pack, applyPack));

  // 3. Disposition de la toolbar (flex + retour a la ligne)
  blocks.push(toolbarLayoutBlock());

  // 4. Socle + icones du pack (tout-ou-rien).
  if (applyPack) {
    blocks.push(iconResetBlock());
    blocks.push(iconContentBlock(state, pack));
  }

  // 5. Masquage (diff : uniquement les boutons hidden).
  const hidden = commandsWhere(state, (b) => b.hidden);
  if (hidden.length) {
    blocks.push(
      "/* Boutons masques */\n" +
        hidden.map((c) => `${sel(c)} { display: none !important; }`).join("\n")
    );
  }

  // 6. Ordre intra-groupe (diff). Deplacement inter-groupes gere en JS (voir plus bas).
  const orderBlock = orderCss(state, affectedGroups(state));
  if (orderBlock) blocks.push(orderBlock);

  // 7. Habillage optionnel (fonds, bordures, hover, disposition)
  const styleBlock = stylesCss(state);
  if (styleBlock) blocks.push(styleBlock);

  // 8. Editeur collant au scroll (facultatif)
  if (state.styles.toolbar && state.styles.toolbar.sticky) blocks.push(stickyBlock());

  return blocks.filter(Boolean).join("\n\n") + "\n";
}

// Bloc de variables, scope a la toolbar. Valeurs issues de l'etat, defauts sinon.
function varsBlock(state, pack, applyPack) {
  const s = state.styles || {};
  const bt = s.button || {};
  const ic = s.icon || {};
  const gr = s.group || {};

  const lines = [
    `--pmt-btn-size: ${bt.size || DEFAULTS.buttonSize};`,
    `--pmt-gap: ${gr.gap || DEFAULTS.gap};`,
    `--pmt-radius: ${bt.radius || DEFAULTS.radius};`,
    `--pmt-icon-size: ${ic.size || DEFAULTS.iconSize};`,
    `--pmt-icon-color: ${bt.color || DEFAULTS.iconColor};`
  ];
  if (applyPack) lines.push(`--pmt-font-pack: '${pack.font.family}';`);
  if (bt.hoverColor) lines.push(`--pmt-icon-color-hover: ${bt.hoverColor};`);
  if (bt.hoverBg) lines.push(`--pmt-btn-bg-hover: ${bt.hoverBg};`);

  return `/* Reglages — modifie ces valeurs pour tout repercuter */
.sceditor-toolbar {
  ${lines.join("\n  ")}
}`;
}

// Disposition de la toolbar + reset des regles natives FA parasites (fond, bordure)
function toolbarLayoutBlock() {
  return `/* Disposition + reset des regles natives parasites (fond, bordure) */
.sceditor-toolbar,
.sceditor-group {
  background: unset !important;
  border: none !important;
    padding: 0 !important;
    margin: 0 !important;
}`;
}

// Socle + reset : neutralise le sprite natif, prepare ::before avec la police du pack
function iconResetBlock() {
  return `/* Socle : dimensions, centrage, neutralisation du sprite natif */
.sceditor-toolbar .sceditor-group {
  display: inline-flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: var(--pmt-gap) !important;
  box-sizing: border-box !important;
}
.sceditor-toolbar .sceditor-button {
  background-image: none !important;
  width: var(--pmt-btn-size) !important;
  height: var(--pmt-btn-size) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: var(--pmt-radius) !important;
  text-indent: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}
.sceditor-toolbar .sceditor-button div { display: none !important; }

/* Icones : police du pack */
.sceditor-toolbar .sceditor-button::before {
  font-family: var(--pmt-font-pack) !important;
  font-size: var(--pmt-icon-size) !important;
  color: var(--pmt-icon-color) !important;
  line-height: 1 !important;
  font-style: normal !important;
  font-weight: normal !important;
  font-variant: normal !important;
  text-transform: none !important;
  -webkit-font-smoothing: antialiased !important;
}
.sceditor-toolbar .sceditor-button.disabled::before { opacity: .35 !important; }
.sceditor-toolbar .sceditor-button:hover { background: var(--pmt-btn-bg-hover, transparent) !important; }
.sceditor-toolbar .sceditor-button:hover::before { color: var(--pmt-icon-color-hover, var(--pmt-icon-color)) !important; }
.sceditor-toolbar .pmt-custom::before { content: var(--pmt-glyph, '') !important; }
.sceditor-toolbar .pmt-custom-image::before {
  content: '' !important;
  display: inline-block !important;
  width: var(--pmt-icon-size) !important;
  height: var(--pmt-icon-size) !important;
  background-image: var(--pmt-icon-url) !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
}`;
}

// Un content par commande (glyphe du pack, sauf override d'icone dans l'etat).
function iconContentBlock(state, pack) {
  const lines = ALL_COMMANDS.map((command) => {
    const override = state.buttons[command] && state.buttons[command].icon;
    const glyph = override || pack.icons[command];
    if (!glyph) return null; // securite : commande sans glyphe (mapping exhaustif attendu)
    return `${sel(command)}::before { content: '${glyph}' !important; }`;
  }).filter(Boolean);
  return "/* Glyphes par commande */\n" + lines.join("\n");
}

// Groupes touches par un deplacement inter-groupes (comparaison au groupe natif).
// Leur composition/ordre final est traduit en JS (reorgSnippet) plutot qu'en CSS.
function affectedGroups(state) {
  const affected = new Set();
  ALL_COMMANDS.forEach((c) => {
    const b = state.buttons[c];
    if (!b || b.hidden) return;
    if (b.group !== NATIVE_GROUP[c]) {
      affected.add(NATIVE_GROUP[c]);
      affected.add(b.group);
    }
  });
  return affected;
}

// Ordre intra-groupe : pose order:N sur les boutons d'un groupe qui differe du natif
function orderCss(state, affected) {
  const out = [];
  TOOLBAR_REFERENCE.forEach((group, groupIndex) => {
    if (affected.has(groupIndex)) return;

    const inGroup = ALL_COMMANDS.filter(
      (c) => state.buttons[c] && state.buttons[c].group === groupIndex
    ).sort((a, b) => state.buttons[a].order - state.buttons[b].order);

    const native = group.map((b) => b.command);
    const differs = inGroup.length !== native.length || inGroup.some((c, i) => c !== native[i]);
    if (!differs || inGroup.length === 0) return;

    inGroup.forEach((c, i) => {
      out.push(`${sel(c)} { order: ${i} !important; }`);
    });
  });
  return out.length ? "/* Ordre intra-groupe */\n" + out.join("\n") : "";
}

// Habillage optionnel : fonds, bordures, espacements, disposition
function stylesCss(state) {
  const s = state.styles || {};
  const out = [];

  const tb = s.toolbar || {};
  const tbDecl = [];
  if (tb.bg) tbDecl.push(`background: ${tb.bg} !important;`);
  if (tb.padding) tbDecl.push(`padding: ${tb.padding} !important;`);
  if (tb.radius) tbDecl.push(`border-radius: ${tb.radius} !important;`);
  if (tb.direction) tbDecl.push(`flex-direction: ${tb.direction} !important;`);
  if (tb.maxWidth) tbDecl.push(`max-width: ${tb.maxWidth} !important;`);
  if (tb.gap) tbDecl.push(`gap: ${tb.gap} !important;`);
  if (tb.align) {
    // En flex, l'axe qui porte l'alignement horizontal depend du sens : justify-content
    // en ligne (axe principal horizontal), align-items en colonne (axe secondaire).
    const prop = tb.direction === "column" ? "align-items" : "justify-content";
    tbDecl.push(`${prop}: ${ALIGN_TO_JUSTIFY[tb.align]} !important;`);
  }
  // Le socle pose deja flex-wrap:wrap ; ici on pose seulement l'exception (nowrap)
  if (tb.wrap === "nowrap") tbDecl.push("flex-wrap: nowrap !important;");
  if (tb.border) tbDecl.push(`border: ${tb.border} !important;`);
  if (tbDecl.length) out.push(`.sceditor-toolbar {\n  ${tbDecl.join("\n  ")}\n}`);

  const gr = s.group || {};
  const grDecl = [];
  if (gr.bg) grDecl.push(`background: ${gr.bg} !important;`);
  if (gr.border) grDecl.push(`border: ${gr.border} !important;`);
  if (gr.radius) grDecl.push(`border-radius: ${gr.radius} !important;`);
  if (gr.padding) grDecl.push(`padding: ${gr.padding} !important;`);
  if (gr.width) grDecl.push(`width: ${gr.width} !important;`);
  if (grDecl.length) out.push(`.sceditor-toolbar .sceditor-group {\n  ${grDecl.join("\n  ")}\n}`);

  const bt = s.button || {};
  const btDecl = [];
  if (bt.bg) btDecl.push(`background: ${bt.bg} !important;`);
  if (bt.border) btDecl.push(`border: ${bt.border} !important;`);
  if (bt.padding) btDecl.push(`padding: ${bt.padding} !important;`);
  if (btDecl.length) out.push(`.sceditor-toolbar .sceditor-button {\n  ${btDecl.join("\n  ")}\n}`);

  return out.length ? "/* Habillage */\n" + out.join("\n\n") : "";
}

// Editeur collant au scroll
function stickyBlock() {
  return `/* Editeur collant au scroll */
#postingbox {
  overflow: unset !important;
}
#message-box .sceditor-container {
  position: sticky !important;
  top: 40px !important;
}`;
}

// --- JS (uniquement si necessaire : boutons custom et/ou deplacement inter-groupes) ---

// Deplace physiquement les boutons des groupes affectes vers leur position cible
function reorgSnippet(state, affected) {
  const layout = {};
  affected.forEach((groupIndex) => {
    layout[groupIndex] = ALL_COMMANDS.filter(
      (c) => state.buttons[c] && state.buttons[c].group === groupIndex && !state.buttons[c].hidden
    ).sort((a, b) => state.buttons[a].order - state.buttons[b].order);
  });

  return `    // Reorganisation inter-groupes : deplace physiquement les boutons concernes
    // (le CSS seul ne peut pas changer de conteneur flex parent).
    var GROUP_LAYOUT = ${JSON.stringify(layout)};
    var groups = toolbar.querySelectorAll('.sceditor-group');
    Object.keys(GROUP_LAYOUT).forEach(function (idx) {
      var group = groups[idx];
      if (!group) return;
      GROUP_LAYOUT[idx].forEach(function (cmd) {
        var el = toolbar.querySelector('[data-sceditor-command="' + cmd + '"]');
        if (el) group.appendChild(el);
      });
    });`;
}

// Cree le groupe de boutons custom et cable leurs actions. N'emet que les boutons
// visibles (diff comme pour les boutons natifs), tries par order.
function customSnippet(visibleCustom) {
  const items = JSON.stringify(visibleCustom, null, 2);
  return `    if (toolbar.querySelector('.pmt-custom-group')) return; // anti double-injection
    var CUSTOM = ${items};
    var group = document.createElement('div');
    group.className = 'sceditor-group pmt-custom-group';

    CUSTOM.forEach(function (btn) {
      var a = document.createElement('a');
      var isImage = btn.iconType === 'image';
      a.className = 'sceditor-button pmt-custom pmt-custom-' + btn.id + (isImage ? ' pmt-custom-image' : '');
      a.setAttribute('data-sceditor-command', 'pmt_' + btn.id);
      a.setAttribute('title', btn.label || '');
      a.setAttribute('unselectable', 'on');
      if (isImage) a.style.setProperty('--pmt-icon-url', "url('" + (btn.icon || '') + "')");
      else a.style.setProperty('--pmt-glyph', "'" + (btn.icon || '') + "'");
      var d = document.createElement('div');
      d.textContent = btn.label || '';
      a.appendChild(d);

      a.addEventListener('click', function (e) {
        e.preventDefault();
        handle(btn, inst);
      });
      group.appendChild(a);
    });

    toolbar.appendChild(group);`;
}

const HANDLE_FN = `
  function handle(btn, inst) {
    var p = btn.payload || {};
    switch (btn.type) {
      case 'insert':
        if (typeof p.html === 'string') inst.insert(p.html);
        else inst.insert(p.open || '', p.close || '');
        break;
      case 'action':
        try { (new Function('inst', p.js || ''))(inst); } catch (e) { /* silencieux */ }
        break;
      // types a venir : popup, dropdown, link...
      default:
        if (p.open || p.close) inst.insert(p.open || '', p.close || '');
    }
  }`;

function generateJs(state) {
  const affected = affectedGroups(state);
  const hasReorg = affected.size > 0;
  const visibleCustom = (state.custom || [])
    .filter((c) => !c.hidden)
    .sort((a, b) => a.order - b.order);
  const hasCustom = visibleCustom.length > 0;
  if (!hasReorg && !hasCustom) return "";

  const parts = [];
  if (hasReorg) parts.push(reorgSnippet(state, affected));
  if (hasCustom) parts.push(customSnippet(visibleCustom));

  return `/* ===== Pimp My Toolbar — JS genere ===== */
(function () {
  function ready(cb) {
    var tries = 0;
    var t = setInterval(function () {
      var tb = document.querySelector('.sceditor-toolbar');
      var orig = document.getElementById('text_editor_textarea');
      var inst = orig && window.jQuery && window.jQuery(orig).sceditor
        ? window.jQuery(orig).sceditor('instance') : null;
      if (tb && inst) { clearInterval(t); cb(tb, inst); }
      else if (++tries > 40) { clearInterval(t); }
    }, 300);
  }

  ready(function (toolbar, inst) {
${parts.join("\n\n")}
  });
${hasCustom ? HANDLE_FN : ""}
})();`;
}
