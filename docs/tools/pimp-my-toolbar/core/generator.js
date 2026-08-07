/* pimp-my-toolbar/core/generator.js
   Le GENERATEUR serialise l'etat en code pret a coller : { css, js }.

   Principe :
     - CSS = gros du livrable. Diff minimal pour masquage / ordre / styles (on ne genere
       que ce qui s'ecarte du natif). Le pack d'icones, lui, est un bloc coherent tout-ou-rien
       (appliquer un pack = remplacer toutes les icones natives), genere si applyPack=true.
     - JS = minimal, uniquement si des boutons custom existent (creation du groupe dedie
       + cablage des actions). Aucun JS pour masquage/ordre/style (tout CSS).

   Conventions :
     - ciblage par [data-sceditor-command="X"] (semantique, stable)
     - !important systematique (le CSS natif FA est coriace)
     - @import du pack en toute premiere ligne du CSS
*/

import { getPack } from "../data/packs.js";
import { TOOLBAR_REFERENCE, ALL_COMMANDS } from "../data/toolbar-reference.js";

// Valeurs de socle appliquees avec le pack d'icones. Sans elles, remplacer le sprite natif
// par une police laisse des boutons sans dimension ni couleur (le natif dimensionnait via
// l'image de fond). Ces valeurs sont surchargeables par state.styles, genere apres.
const BASE = {
  buttonSize: "32px",
  iconSize: "18px",
  iconColor: "currentColor",
  radius: "6px"
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
// options : { applyPack:true }  -> inclure le bloc pack d'icones (sinon icones natives gardees)
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

  blocks.push("/* ===== Pimp My Toolbar — CSS genere ===== */");

  // 2. Bloc pack d'icones (tout-ou-rien) : socle + reset du natif + un content par commande.
  if (applyPack) {
    blocks.push(iconResetBlock(pack));
    blocks.push(iconContentBlock(state, pack));
  }

  // 3. Masquage (diff : uniquement les boutons hidden).
  const hidden = commandsWhere(state, (b) => b.hidden);
  if (hidden.length) {
    blocks.push(
      "/* Boutons masques */\n" +
        hidden.map((c) => `${sel(c)} { display: none !important; }`).join("\n")
    );
  }

  // 4. Ordre intra-groupe (diff : uniquement les groupes dont l'ordre differe du natif).
  const orderBlock = orderCss(state);
  if (orderBlock) blocks.push(orderBlock);

  // 5. Styles d'apparence (diff : uniquement les proprietes definies). Genere en dernier
  //    pour surcharger le socle a specificite egale.
  const styleBlock = stylesCss(state);
  if (styleBlock) blocks.push(styleBlock);

  return blocks.filter(Boolean).join("\n\n") + "\n";
}

// Socle + reset : masque le libelle natif, neutralise le sprite, redimensionne et centre
// le bouton, prepare ::before avec la police du pack. Gere les etats natifs (.disabled).
function iconResetBlock(pack) {
  return `/* Socle : dimensions, centrage, neutralisation du sprite natif */
.sceditor-toolbar .sceditor-button {
  background-image: none !important;
  width: ${BASE.buttonSize} !important;
  height: ${BASE.buttonSize} !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: ${BASE.radius} !important;
  text-indent: 0 !important;
  overflow: hidden !important;
}
.sceditor-toolbar .sceditor-button div { display: none !important; }

/* Icones : police du pack */
.sceditor-toolbar .sceditor-button::before {
  font-family: '${pack.font.family}' !important;
  font-size: ${BASE.iconSize} !important;
  color: ${BASE.iconColor} !important;
  line-height: 1 !important;
  font-style: normal !important;
  font-weight: normal !important;
  font-variant: normal !important;
  text-transform: none !important;
  -webkit-font-smoothing: antialiased !important;
}
.sceditor-toolbar .sceditor-button.disabled::before { opacity: .35 !important; }
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

// Ordre intra-groupe : pour chaque groupe dont l'ordre courant differe du natif,
// on passe le groupe en flex et on pose un order:N sur chaque bouton du groupe.
function orderCss(state) {
  const out = [];
  TOOLBAR_REFERENCE.forEach((group, groupIndex) => {
    const inGroup = ALL_COMMANDS.filter(
      (c) => state.buttons[c] && state.buttons[c].group === groupIndex
    ).sort((a, b) => state.buttons[a].order - state.buttons[b].order);

    const native = group.map((b) => b.command);
    const differs = inGroup.length !== native.length || inGroup.some((c, i) => c !== native[i]);
    if (!differs || inGroup.length === 0) return;

    // Le groupe n'a pas d'identifiant propre : on le cible via un bouton connu qu'il contient.
    const anchor = native[0];
    out.push(`.sceditor-group:has(${sel(anchor)}) { display: flex !important; }`);
    inGroup.forEach((c, i) => {
      out.push(`${sel(c)} { order: ${i} !important; }`);
    });
  });
  return out.length ? "/* Ordre intra-groupe */\n" + out.join("\n") : "";
}

// Styles d'apparence : ne genere que les proprietes reellement definies dans l'etat.
function stylesCss(state) {
  const s = state.styles || {};
  const out = [];

  const tb = s.toolbar || {};
  const tbDecl = [];
  if (tb.bg) tbDecl.push(`background: ${tb.bg} !important;`);
  if (tb.padding) tbDecl.push(`padding: ${tb.padding} !important;`);
  if (tb.radius) tbDecl.push(`border-radius: ${tb.radius} !important;`);
  if (tbDecl.length) out.push(`.sceditor-toolbar {\n  ${tbDecl.join("\n  ")}\n}`);

  const gr = s.group || {};
  const grDecl = [];
  if (gr.bg) grDecl.push(`background: ${gr.bg} !important;`);
  if (gr.border) grDecl.push(`border: ${gr.border} !important;`);
  if (gr.radius) grDecl.push(`border-radius: ${gr.radius} !important;`);
  if (gr.gap) grDecl.push(`gap: ${gr.gap} !important;`);
  if (grDecl.length) out.push(`.sceditor-toolbar .sceditor-group {\n  ${grDecl.join("\n  ")}\n}`);

  const bt = s.button || {};
  const btDecl = [];
  if (bt.size) {
    btDecl.push(`width: ${bt.size} !important;`);
    btDecl.push(`height: ${bt.size} !important;`);
  }
  if (bt.radius) btDecl.push(`border-radius: ${bt.radius} !important;`);
  if (btDecl.length) out.push(`.sceditor-toolbar .sceditor-button {\n  ${btDecl.join("\n  ")}\n}`);

  const ic = s.icon || {};
  const beforeDecl = [];
  if (ic.size) beforeDecl.push(`font-size: ${ic.size} !important;`);
  if (bt.color) beforeDecl.push(`color: ${bt.color} !important;`);
  if (beforeDecl.length)
    out.push(`.sceditor-toolbar .sceditor-button::before {\n  ${beforeDecl.join("\n  ")}\n}`);

  if (bt.hoverBg || bt.hoverColor) {
    if (bt.hoverBg) {
      out.push(
        `.sceditor-toolbar .sceditor-button:hover { background: ${bt.hoverBg} !important; }`
      );
    }
    if (bt.hoverColor) {
      out.push(
        `.sceditor-toolbar .sceditor-button:hover::before { color: ${bt.hoverColor} !important; }`
      );
    }
  }

  return out.length ? "/* Apparence */\n" + out.join("\n\n") : "";
}

// --- JS (uniquement si boutons custom) ---
function generateJs(state) {
  if (!state.custom || !state.custom.length) return "";

  const pack = getPack(state.iconPack);
  const items = JSON.stringify(state.custom, null, 2);

  return `/* ===== Pimp My Toolbar — JS genere (boutons custom) ===== */
(function () {
  var CUSTOM = ${items};
  var PACK_FAMILY = ${JSON.stringify(pack.font.family)};

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
