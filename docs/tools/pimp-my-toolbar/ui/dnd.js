/* pimp-my-toolbar/ui/dnd.js
   DRAG & DROP de l'apercu.

   Regle d'or : un drop ne touche JAMAIS au DOM directement. Il modifie l'ETAT, puis
   l'apercu est reconstruit depuis l'etat. L'etat reste la source de verite unique,
   donc l'apercu et le code genere ne peuvent pas diverger.

   Deux mouvements :
     - reordonner dans un groupe  -> recalcul des order du groupe
     - vers la reserve            -> hidden = true
     - depuis la reserve          -> hidden = false, atterrit dans le groupe cible

   Le deplacement inter-groupes est possible cote interface (l'etat porte "group"), mais
   il produirait un etat que le CSS seul ne sait pas traduire : on le refuse pour l'instant
   et on ramene le bouton dans son groupe d'origine. */

import { TOOLBAR_REFERENCE } from "../data/toolbar-reference.js";

const MIME = "text/pmt-command";

// Groupe natif d'une commande (pour refuser un deplacement inter-groupes).
const NATIVE_GROUP = {};
TOOLBAR_REFERENCE.forEach((group, i) => {
  group.forEach((b) => {
    NATIVE_GROUP[b.command] = i;
  });
});

/* Branche le drag & drop sur l'apercu et la reserve.
   onChange() est appele apres toute modification d'etat (l'appelant rerend). */
export function bindDnd({ previewHost, reserveHost, state, onChange }) {
  let dragged = null; // commande en cours de deplacement

  // --- Source du drag : tout bouton, dans l'apercu comme dans la reserve ---
  const allButtons = [
    ...previewHost.querySelectorAll(".sceditor-button"),
    ...reserveHost.querySelectorAll(".sceditor-button")
  ];

  allButtons.forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragged = el.getAttribute("data-sceditor-command");
      e.dataTransfer.effectAllowed = "move";
      // Certains navigateurs exigent une donnee pour demarrer le drag.
      e.dataTransfer.setData(MIME, dragged);
      e.dataTransfer.setData("text/plain", dragged);
      el.classList.add("pmt-dragging");
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("pmt-dragging");
      clearMarkers();
      dragged = null;
    });
  });

  // --- Cibles de depot : les groupes de l'apercu ---
  previewHost.querySelectorAll(".sceditor-group").forEach((group) => {
    group.addEventListener("dragover", (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      group.classList.add("pmt-drop-target");
      markInsertionPoint(group, e.clientX);
    });

    group.addEventListener("dragleave", () => {
      group.classList.remove("pmt-drop-target");
    });

    group.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragged) return;
      const targetGroup = Number(group.dataset.pmtGroup);
      dropIntoGroup(state, dragged, targetGroup, group, e.clientX);
      clearMarkers();
      onChange();
    });
  });

  // --- Cible de depot : la reserve (= masquer) ---
  reserveHost.addEventListener("dragover", (e) => {
    if (!dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    reserveHost.classList.add("pmt-drop-target");
  });

  reserveHost.addEventListener("dragleave", () => {
    reserveHost.classList.remove("pmt-drop-target");
  });

  reserveHost.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!dragged) return;
    state.buttons[dragged].hidden = true;
    clearMarkers();
    onChange();
  });

  function clearMarkers() {
    document.querySelectorAll(".pmt-drop-target").forEach((n) => n.classList.remove("pmt-drop-target"));
    document.querySelectorAll(".pmt-insert-before, .pmt-insert-after").forEach((n) =>
      n.classList.remove("pmt-insert-before", "pmt-insert-after")
    );
  }
}

/* Marque visuellement le point d'insertion (avant/apres le bouton survole). */
function markInsertionPoint(group, clientX) {
  group.querySelectorAll(".pmt-insert-before, .pmt-insert-after").forEach((n) =>
    n.classList.remove("pmt-insert-before", "pmt-insert-after")
  );
  const target = buttonUnderX(group, clientX);
  if (!target) return;
  const rect = target.el.getBoundingClientRect();
  target.el.classList.add(clientX < rect.left + rect.width / 2 ? "pmt-insert-before" : "pmt-insert-after");
}

/* Bouton survole dans un groupe, pour un X donne. */
function buttonUnderX(group, clientX) {
  const buttons = [...group.querySelectorAll(".sceditor-button")];
  for (const el of buttons) {
    const rect = el.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) return { el, rect };
  }
  return null;
}

/* Applique un depot dans un groupe : calcule la nouvelle position et reecrit les order.
   Refuse un changement de groupe (non traduisible en CSS seul pour l'instant). */
function dropIntoGroup(state, command, targetGroup, groupEl, clientX) {
  const btn = state.buttons[command];
  if (!btn) return;

  const fromReserve = btn.hidden;
  const originGroup = NATIVE_GROUP[command];

  // Deplacement inter-groupes refuse : on ramene la commande dans son groupe natif.
  if (targetGroup !== originGroup) {
    if (fromReserve) {
      // Depuis la reserve, on la reaffiche a sa place d'origine plutot que de refuser.
      btn.hidden = false;
      btn.group = originGroup;
      normalizeOrders(state, originGroup);
    }
    return;
  }

  btn.hidden = false;
  btn.group = targetGroup;

  // Ordre courant des commandes visibles du groupe (hors celle qu'on deplace).
  const current = Object.entries(state.buttons)
    .filter(([c, b]) => b.group === targetGroup && !b.hidden && c !== command)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([c]) => c);

  // Position d'insertion : d'apres le bouton survole et le cote (avant/apres son milieu).
  const target = buttonUnderX(groupEl, clientX);
  let index = current.length; // par defaut : a la fin
  if (target) {
    const overCommand = target.el.getAttribute("data-sceditor-command");
    const pos = current.indexOf(overCommand);
    if (pos !== -1) {
      const isAfter = clientX >= target.rect.left + target.rect.width / 2;
      index = isAfter ? pos + 1 : pos;
    }
  }

  current.splice(index, 0, command);
  current.forEach((c, i) => {
    state.buttons[c].order = i;
  });
}

/* Renumerote proprement les order d'un groupe (0..n) sans changer l'ordre relatif. */
function normalizeOrders(state, groupIndex) {
  Object.entries(state.buttons)
    .filter(([, b]) => b.group === groupIndex)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([c], i) => {
      state.buttons[c].order = i;
    });
}
