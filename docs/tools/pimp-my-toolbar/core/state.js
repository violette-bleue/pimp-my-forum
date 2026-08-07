/* pimp-my-toolbar/core/state.js
   L'ETAT est le pivot de l'outil : source de verite unique que l'interface edite,
   que l'apercu lit, et que le generateur serialise en CSS/JS.

   Forme de l'etat :
   {
     version: 1,
     buttons: {                       // cle = data-sceditor-command
       bold: { hidden:false, group:0, order:0, icon:null },  // icon null = glyphe du pack
       ...                            // les 40 commandes
     },
     iconPack: "material",
     custom: [                        // boutons custom (groupe dedie), types extensibles
       { id, label, icon, type:"insert"|"action"|..., payload }
     ],
     styles: { toolbar:{}, group:{}, button:{}, icon:{} }
   }

   L'etat initial reflete la toolbar NATIVE (rien de masque, ordre/groupe natifs,
   aucune icone surchargee). Le generateur produit alors un diff minimal : un etat
   initial pur -> CSS quasi vide (juste le pack d'icones si on veut l'appliquer). */

import { TOOLBAR_REFERENCE } from "../data/toolbar-reference.js";
import { DEFAULT_PACK } from "../data/packs.js";

// Construit l'etat initial depuis la reference (toolbar native).
export function createInitialState() {
  const buttons = {};
  TOOLBAR_REFERENCE.forEach((group, groupIndex) => {
    group.forEach((btn, order) => {
      buttons[btn.command] = {
        hidden: false,
        group: groupIndex, // groupe natif
        order, // position native dans le groupe
        icon: null // null = glyphe du pack actif (pas de surcharge)
      };
    });
  });

  return {
    version: 1,
    buttons,
    iconPack: DEFAULT_PACK,
    custom: [],
    styles: {
      toolbar: {}, // ex: { bg, padding, radius }
      group: {}, // ex: { bg, border, radius, gap }
      button: {}, // ex: { size, color, hoverColor, hoverBg, radius }
      icon: {} // ex: { size }
    }
  };
}

// --- Helpers de mutation (utilises plus tard par l'interface) ---

// Masque / reaffiche un bouton (glisser vers/hors la reserve).
export function setHidden(state, command, hidden) {
  if (state.buttons[command]) state.buttons[command].hidden = hidden;
}

// Reordonne un bouton dans son groupe (nouvelle position).
export function setOrder(state, command, order) {
  if (state.buttons[command]) state.buttons[command].order = order;
}

// Surcharge (ou reinitialise) l'icone d'un bouton. glyph null = retour au pack.
export function setIcon(state, command, glyph) {
  if (state.buttons[command]) state.buttons[command].icon = glyph;
}

// Change le pack d'icones actif.
export function setPack(state, packId) {
  state.iconPack = packId;
}

// Ajoute un bouton custom (id genere si absent).
export function addCustom(state, custom) {
  const id = custom.id || "c" + (state.custom.length + 1);
  state.custom.push(Object.assign({ id, type: "insert", payload: {} }, custom));
  return id;
}

// Retire un bouton custom par id.
export function removeCustom(state, id) {
  state.custom = state.custom.filter((c) => c.id !== id);
}

// Renvoie les boutons d'un groupe donne, tries par order (helper de lecture pour l'apercu).
export function buttonsInGroup(state, groupIndex) {
  return Object.entries(state.buttons)
    .filter(([, b]) => b.group === groupIndex)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([command, b]) => ({ command, ...b }));
}
