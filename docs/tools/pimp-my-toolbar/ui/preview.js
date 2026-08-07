/* pimp-my-toolbar/ui/preview.js
   L'APERCU : une fausse toolbar reconstruite depuis l'etat, reproduisant EXACTEMENT
   la structure DOM de SCEditor sur ForumActif :

     .sceditor-container > .sceditor-toolbar > .sceditor-group > a.sceditor-button
                                                                  [data-sceditor-command]
                                                                  > div (libelle, masque)

   Pourquoi cette fidelite : le CSS genere par l'outil cible ces memes selecteurs.
   En reproduisant la vraie structure, le CSS s'applique a l'apercu exactement comme
   il s'appliquera sur le forum -> l'apercu est le vrai rendu, pas une approximation.

   L'apercu se reconstruit depuis l'etat a chaque changement : c'est une VUE, jamais
   une source de verite. L'etat reste le pivot. */

import { TOOLBAR_REFERENCE } from "../data/toolbar-reference.js";
import { buttonsInGroup } from "../core/state.js";

// Libelles natifs (title FA) indexes par commande, pour les tooltips de l'apercu.
const LABELS = {};
TOOLBAR_REFERENCE.forEach((group) => {
  group.forEach((b) => {
    LABELS[b.command] = b.label;
  });
});

// Construit un bouton a l'identique du DOM SCEditor natif.
// hiddenPreview : dans l'apercu, un bouton masque n'est pas retire du DOM mais marque,
// pour rester manipulable (le CSS genere, lui, le mettra en display:none sur le forum).
function buildButton(command, label) {
  const a = document.createElement("a");
  a.className = "sceditor-button sceditor-button-" + command;
  a.setAttribute("data-sceditor-command", command);
  a.setAttribute("unselectable", "on");
  a.setAttribute("title", label || command);
  a.setAttribute("draggable", "true"); // pour le drag & drop (branche par l'UI)

  const d = document.createElement("div");
  d.setAttribute("unselectable", "on");
  d.textContent = label || command;
  a.appendChild(d);

  return a;
}

// Rend la toolbar simulee dans un conteneur, depuis l'etat.
// Les boutons masques ne sont PAS rendus ici : ils vont dans la reserve (voir renderReserve).
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

  container.appendChild(toolbar);
  host.appendChild(container);
  return toolbar;
}

// Rend la reserve : les boutons masques, reglissables vers la toolbar.
// Meme structure de bouton (donc meme rendu d'icone que dans la toolbar).
export function renderReserve(host, state) {
  host.innerHTML = "";

  const zone = document.createElement("div");
  zone.className = "sceditor-toolbar pmt-reserve-zone"; // meme classe = memes styles d'icones
  zone.dataset.pmtReserve = "1";

  const group = document.createElement("div");
  group.className = "sceditor-group";

  Object.entries(state.buttons)
    .filter(([, b]) => b.hidden)
    .forEach(([command]) => {
      group.appendChild(buildButton(command, LABELS[command]));
    });

  zone.appendChild(group);
  host.appendChild(zone);
  return zone;
}

// Injecte (ou met a jour) le CSS genere dans la page, pour que l'apercu se restyle en direct.
// Le CSS est porte par une balise <style> dediee, remplacee a chaque mise a jour.
export function applyGeneratedCss(css) {
  let tag = document.getElementById("pmt-generated-style");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "pmt-generated-style";
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}
