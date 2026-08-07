/*  pimp-my-toolbar/core/generator.js
   Le GENERATEUR serialise l'etat en code pret a coller : { css, js }.

   Principe :
     - CSS = gros du livrable. Diff minimal pour masquage / ordre (on ne genere que ce qui
       s'ecarte du natif). Le pack d'icones est un bloc coherent tout-ou-rien (appliquer un
       pack = remplacer toutes les icones natives), genere si applyPack=true.
     - JS = minimal, uniquement si des boutons custom existent (creation du groupe dedie
       + cablage des actions). Aucun JS pour masquage/ordre/style (tout CSS).

   VARIABLES CSS : le bloc genere declare ses reglages en variables sur .sceditor-toolbar
   (taille des boutons, gap, taille/couleur des icones, police du pack, rayon). Elles sont
   scopees a la toolbar (pas de pollution globale) et heritees par les groupes et boutons.
   Consequence pratique : l'utilisateur a un seul endroit a modifier pour tout repercuter,
   et changer de pack ne demande de toucher qu'a --pmt-font-pack.

   Conventions :
     - ciblage par [data-sceditor-command="X"] (semantique, stable)
     - !important systematique (le CSS natif FA est coriace)
     - @import du pack en toute premiere ligne du CSS
*/

import { getPack } from "../data/packs.js";
import { TOOLBAR_REFERENCE, ALL_COMMANDS } from "../data/toolbar-reference.js";

// Valeurs par defaut des variables, utilisees quand l'etat ne definit rien.
const DEFAULTS = {
  buttonSize: "32px",
  gap: "5px",
  iconSize: "18px",
  iconColor: "currentColor",
  radius: "6px"
};

// Alignement des groupes dans la toolbar (justify-content) : flex-start/flex-end plutot
// que left/right, pour un support flex plus large.
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

  // 3. Disposition de la toolbar (flex + retour a la ligne) : toujours applique,
  // independant du pack d'icones (c'est un sujet de mise en page, pas d'icone).
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

  // 6. Ordre intra-groupe (diff : uniquement les groupes dont l'ordre differe du natif).
  const orderBlock = orderCss(state);
  if (orderBlock) blocks.push(orderBlock);

  // 7. Habillage optionnel (fonds, bordures, hover, disposition) : uniquement si defini
  // dans l'etat.
  const styleBlock = stylesCss(state);
  if (styleBlock) blocks.push(styleBlock);

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

// Disposition de la toolbar elle-meme : flex + retour a la ligne, pour qu'elle s'adapte
// a l'espace disponible plutot que de deborder. Toujours emis (independant du pack).
function toolbarLayoutBlock() {
  return `/* Disposition : la toolbar passe a la ligne plutot que de deborder */
.sceditor-toolbar {
  display: flex !important;
  flex-wrap: wrap !important;
}`;
}

// Socle + reset : neutralise le sprite natif, dimensionne et centre le bouton, masque le
// libelle, prepare ::before avec la police du pack. Les groupes passent en flex pour le gap
// (et pour rendre le reordonnancement par order possible).
function iconResetBlock() {
  return `/* Socle : dimensions, centrage, neutralisation du sprite natif */
.sceditor-toolbar .sceditor-group {
  display: inline-flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: var(--pmt-gap) !important;
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
.sceditor-toolbar .pmt-custom::before { content: var(--pmt-glyph, '') !important; }`;
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

// Ordre intra-groupe : pour chaque groupe dont l'ordre courant differe du natif, on pose
// un order:N sur ses boutons. Les groupes sont deja en flex via le socle.
function orderCss(state) {
  const out = [];
  TOOLBAR_REFERENCE.forEach((group, groupIndex) => {
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

// Habillage optionnel : fonds, bordures, espacements, disposition de la toolbar et des
// groupes. Taille, gap, couleurs d'icone passent par les variables, pas ici.
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
  if (tb.align) {
    // En flex, l'axe qui porte l'alignement horizontal depend du sens : justify-content
    // en ligne (axe principal horizontal), align-items en colonne (axe secondaire).
    const prop = tb.direction === "column" ? "align-items" : "justify-content";
    tbDecl.push(`${prop}: ${ALIGN_TO_JUSTIFY[tb.align]} !important;`);
  }
  // Le socle pose deja flex-wrap:wrap par defaut ; ici on ne pose que l'exception (nowrap),
  // qui l'emporte grace a l'ordre des regles (meme selecteur, meme poids, la derniere gagne).
  if (tb.wrap === "nowrap") tbDecl.push("flex-wrap: nowrap !important;");
  if (tb.border) tbDecl.push(`border: ${tb.border} !important;`);
  if (tbDecl.length) out.push(`.sceditor-toolbar {\n  ${tbDecl.join("\n  ")}\n}`);

  const gr = s.group || {};
  const grDecl = [];
  if (gr.bg) grDecl.push(`background: ${gr.bg} !important;`);
  if (gr.border) grDecl.push(`border: ${gr.border} !important;`);
  if (gr.radius) grDecl.push(`border-radius: ${gr.radius} !important;`);
  if (gr.padding) grDecl.push(`padding: ${gr.padding} !important;`);
  if (grDecl.length) out.push(`.sceditor-toolbar .sceditor-group {\n  ${grDecl.join("\n  ")}\n}`);

  const bt = s.button || {};
  const btDecl = [];
  if (bt.bg) btDecl.push(`background: ${bt.bg} !important;`);
  if (bt.border) btDecl.push(`border: ${bt.border} !important;`);
  if (bt.padding) btDecl.push(`padding: ${bt.padding} !important;`);
  if (btDecl.length) out.push(`.sceditor-toolbar .sceditor-button {\n  ${btDecl.join("\n  ")}\n}`);

  return out.length ? "/* Habillage */\n" + out.join("\n\n") : "";
}

// --- JS (uniquement si boutons custom) ---
function generateJs(state) {
  if (!state.custom || !state.custom.length) return "";

  const items = JSON.stringify(state.custom, null, 2);

  return `/* ===== Pimp My Toolbar — JS genere (boutons custom) ===== */
(function () {
  var CUSTOM = ${items};

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
    if (toolbar.querySelector('.pmt-custom-group')) return; // anti double-injection
    var group = document.createElement('div');
    group.className = 'sceditor-group pmt-custom-group';

    CUSTOM.forEach(function (btn) {
      var a = document.createElement('a');
      a.className = 'sceditor-button pmt-custom pmt-custom-' + btn.id;
      a.setAttribute('data-sceditor-command', 'pmt_' + btn.id);
      a.setAttribute('title', btn.label || '');
      a.setAttribute('unselectable', 'on');
      a.style.setProperty('--pmt-glyph', "'" + (btn.icon || '') + "'");
      var d = document.createElement('div');
      d.textContent = btn.label || '';
      a.appendChild(d);

      a.addEventListener('click', function (e) {
        e.preventDefault();
        handle(btn, inst);
      });
      group.appendChild(a);
    });

    toolbar.appendChild(group);
  });

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
  }
})();`;
}
