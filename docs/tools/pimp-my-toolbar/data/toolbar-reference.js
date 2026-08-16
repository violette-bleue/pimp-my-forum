/* pimp-my-toolbar/data/toolbar-reference.js — reference figee de la toolbar SCEditor FA
   (40 commandes, ordre et groupe natifs) */

export const TOOLBAR_REFERENCE = [
  // G0 — mise en forme texte
  [
    { command: "bold", label: "Gras" },
    { command: "italic", label: "Italique" },
    { command: "underline", label: "Souligné" },
    { command: "strike", label: "Barré" }
  ],
  // G1 — alignement
  [
    { command: "left", label: "Aligné à gauche" },
    { command: "center", label: "Centré" },
    { command: "right", label: "Aligné à droite" },
    { command: "justify", label: "Justifié" }
  ],
  // G2 — listes
  [
    { command: "bulletlist", label: "Liste à puces" },
    { command: "orderedlist", label: "Liste ordonnée" },
    { command: "horizontalrule", label: "Ligne horizontale" }
  ],
  // G3 — contenus speciaux
  [
    { command: "quote", label: "Citer" },
    { command: "code", label: "Code" },
    { command: "faspoiler", label: "Spoiler" },
    { command: "fahide", label: "Caché" },
    { command: "table", label: "Tableau" }
  ],
  // G4 — medias
  [
    { command: "servimg", label: "Héberger une image" },
    { command: "image", label: "Insérer une image" },
    { command: "link", label: "Insérer un lien" },
    { command: "embed", label: "Enrichir un lien" },
    { command: "youtube", label: "Vidéo YouTube" }
  ],
  // G5 — typographie
  [
    { command: "headers", label: "Format des titres" },
    { command: "size", label: "Taille police" },
    { command: "color", label: "Couleur" },
    { command: "font", label: "Police" },
    { command: "removeformat", label: "Supprimer le formatage" }
  ],
  // G6 — plus/moins
  [
    { command: "more", label: "Plus/Moins de boutons" }
  ],
  // G7 — indice/exposant
  [
    { command: "subscript", label: "Indice" },
    { command: "superscript", label: "Exposant" }
  ],
  // G8 — animations FA
  [
    { command: "fascroll", label: "Défilement horizontal" },
    { command: "faupdown", label: "Défilement vertical" },
    { command: "farand", label: "Aléatoire" }
  ],
  // G9 — divers
  [
    { command: "twemojifa", label: "Twemoji" },
    { command: "date", label: "Date actuelle" },
    { command: "time", label: "Heure actuelle" },
    { command: "pastetext", label: "Coller sans formatage" },
    { command: "source", label: "Mode source" }
  ]
];

// Liste plate des commandes (pratique pour valider un pack exhaustif, iterer, etc.).
export const ALL_COMMANDS = TOOLBAR_REFERENCE.reduce(
  (acc, group) => acc.concat(group.map((b) => b.command)),
  []
);

// Groupe natif de chaque commande (index dans TOOLBAR_REFERENCE). Sert de reference pour
// detecter un deplacement inter-groupes (dnd.js) et le traduire en JS (generator.js).
export const NATIVE_GROUP = {};
TOOLBAR_REFERENCE.forEach((group, i) => {
  group.forEach((b) => {
    NATIVE_GROUP[b.command] = i;
  });
});
