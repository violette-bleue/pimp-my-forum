/* pimp-my-toolbar/ui/preview.js
   L'APERCU : une fausse toolbar reconstruite depuis l'etat, reproduisant EXACTEMENT
   la structure DOM de SCEditor sur ForumActif :

     .sceditor-container > .sceditor-toolbar > .sceditor-group > a.sceditor-button
                                                                  [data-sceditor-command]
                                                                  > div (libelle, masque)

   Pourquoi cette fidelite : le CSS genere par l'outil cible ces memes selecteurs.
   En reproduisant la vraie structure, le CSS s'applique a l'apercu exactement comme
   il s'appliquera sur le forum -> l'apercu est le vrai rendu, pas une approximation.

   IMPORTANT — scope : le CSS genere est SCOPE a la zone d'apercu avant injection.
   Sans ca, une regle de masquage (display:none sur une commande) s'appliquerait aussi
   a la copie du bouton presente dans la reserve, la rendant invisible. Le scope garantit
   que seule la toolbar simulee est affectee, jamais la reserve ni le reste de la page.

   L'apercu se reconstruit depuis l'etat a chaque changement : c'est une VUE, jamais
   une source de verite. L'etat reste le pivot. */

import { TOOLBAR_REFERENCE } from "../data/toolbar-reference.js";
import { buttonsInGroup } from "../core/state.js";

// Conteneur de l'apercu : sert de racine au scope du CSS genere.
export const PREVIEW_SCOPE = "#pmt-preview";

// Libelles natifs (title FA) indexes par commande, pour les tooltips de l'apercu.
const LABELS = {};
TOOLBAR_REFERENCE.forEach((group) => {
  group.forEach((b) => {
    LABELS[b.command] = b.label;
  });
});

// Construit un bouton a l'identique du DOM SCEditor natif.
function buildButton(command, label) {
  const a = document.createElement("a");
  a.className = "sceditor-button sceditor-button-" + command;
  a.setAttribute("data-sceditor-command", command);
  a.setAttribute("unselectable", "on");
  a.setAttribute("title", label || command);
  a.setAttribute("draggable", "true"); // pour le drag & drop (branche par l'UI)
  a.setAttribute("href", "javascript:void(0)");

  const d = document.createElement("div");
  d.setAttribute("unselectable", "on");
  d.textContent = label || command;
  a.appendChild(d);

  return a;
}

// Construit un bouton custom a l'identique de ce que produit le JS genere (memes classes,
// meme variable --pmt-glyph), pour que l'apercu reflete fidelement le rendu reel. La police
// et la taille du glyphe viennent de la regle generale .sceditor-button::before (heritee) ;
// seul le content (--pmt-glyph) est propre au bouton custom.
function buildCustomButton(custom) {
  const a = document.createElement("a");
  const isImage = custom.iconType === "image";
  a.className = "sceditor-button pmt-custom pmt-custom-" + custom.id + (isImage ? " pmt-custom-image" : "");
  a.setAttribute("data-sceditor-command", "pmt_" + custom.id);
  a.setAttribute("unselectable", "on");
  a.setAttribute("title", custom.label || "");
  a.setAttribute("href", "javascript:void(0)");
  if (isImage) a.style.setProperty("--pmt-icon-url", "url('" + (custom.icon || "") + "')");
  else a.style.setProperty("--pmt-glyph", "'" + (custom.icon || "") + "'");

  const d = document.createElement("div");
  d.setAttribute("unselectable", "on");
  d.textContent = custom.label || "";
  a.appendChild(d);

  return a;
}

// Rend la toolbar simulee dans un conteneur, depuis l'etat.
// Les boutons masques ne sont pas rendus ici : ils vont dans la reserve. Les boutons
// custom (state.custom) sont ajoutes dans leur propre groupe en fin de toolbar, exactement
// comme le fait le JS genere sur le vrai forum.
export function renderPreview(host, state) {
  host.innerHTML = "";

  const container = document.createElement("div");
  container.className = "sceditor-container ltr";

  const toolbar = document.createElement("div");
  toolbar.className = "sceditor-toolbar";
  toolbar.setAttribute("unselectable", "on");

  TOOLBAR_REFERENCE.forEach((_, groupIndex) => {
    const group = document.createElement("div");
    group.className = "sceditor-group";
    group.dataset.pmtGroup = String(groupIndex); // ancre pour le drag & drop

    buttonsInGroup(state, groupIndex)
      .filter((b) => !b.hidden)
      .forEach((b) => {
        group.appendChild(buildButton(b.command, LABELS[b.command]));
      });

    // Un groupe vide reste present (zone de depot valide pour le drag & drop).
    toolbar.appendChild(group);
  });

  if (state.custom && state.custom.length) {
    const customGroup = document.createElement("div");
    customGroup.className = "sceditor-group pmt-custom-group";
    state.custom.forEach((custom) => {
      customGroup.appendChild(buildCustomButton(custom));
    });
    toolbar.appendChild(customGroup);
  }

  container.appendChild(toolbar);
  host.appendChild(container);
  return toolbar;
}

// Rend la reserve : les boutons masques, recuperables.
// Classe racine volontairement DIFFERENTE de .sceditor-toolbar : la reserve ne doit pas
// heriter du CSS genere (sinon un bouton masque y serait invisible). Son rendu est pilote
// par le CSS de l'outil (tool.css), qui reprend les memes principes d'icone.
export function renderReserve(host, state) {
  host.innerHTML = "";

  const zone = document.createElement("div");
  zone.className = "pmt-reserve-zone";
  zone.dataset.pmtReserve = "1";

  const hidden = Object.entries(state.buttons).filter(([, b]) => b.hidden);

  if (!hidden.length) {
    const empty = document.createElement("p");
    empty.className = "pmt-reserve-empty";
    empty.textContent = "Aucun bouton masque pour l'instant.";
    zone.appendChild(empty);
  } else {
    hidden.forEach(([command]) => {
      zone.appendChild(buildButton(command, LABELS[command]));
    });
  }

  host.appendChild(zone);
  return zone;
}

// Scope un CSS genere a la zone d'apercu : chaque selecteur est prefixe par PREVIEW_SCOPE.
// Les at-rules (@import, @media...) et les commentaires sont laisses tels quels.
function scopeCss(css, scope) {
  return css.replace(
    /(^|\})\s*([^@{}][^{}]*)\{/g,
    (match, brace, selectors) => {
      const scoped = selectors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `${scope} ${s}`)
        .join(", ");
      return `${brace}\n${scoped} {`;
    }
  );
}

// Injecte (ou met a jour) le CSS genere, SCOPE a l'apercu, pour un restyle en direct.
export function applyGeneratedCss(css) {
  let tag = document.getElementById("pmt-generated-style");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "pmt-generated-style";
    document.head.appendChild(tag);
  }
  // L'@import doit rester en tete et non scope : on l'extrait avant de scoper le reste.
  const imports = [];
  const body = css.replace(/@import[^;]+;/g, (m) => {
    imports.push(m);
    return "";
  });
  tag.textContent = imports.join("\n") + "\n" + scopeCss(body, PREVIEW_SCOPE);
}
