/* pimp-my-toolbar/ui/dnd.js
   DRAG & DROP de l'apercu.

   Regle d'or : un drop ne touche JAMAIS au DOM directement. Il modifie l'ETAT, puis
   l'apercu est reconstruit depuis l'etat. L'etat reste la source de verite unique,
   donc l'apercu et le code genere ne peuvent pas diverger.

   Trois mouvements, tous traites par la meme fonction (dropIntoGroup) :
     - reordonner dans un groupe   -> recalcul des order du groupe
     - vers la reserve             -> hidden = true
     - depuis la reserve / un autre groupe -> hidden = false, group = cible, order recalcule

   Le deplacement inter-groupes est traduit en JS par le generateur (le CSS seul ne peut
   pas deplacer un noeud vers un autre conteneur flex parent) ; voir generator.js.

   Les boutons custom (state.custom, prefixe "pmt_" sur data-sceditor-command) suivent la
   meme logique de reordonnancement/reserve mais dans leur seul groupe dedie (pas de
   groupe natif, pas de deplacement inter-groupes) : dropCustomButton, en parallele de
   dropIntoGroup. */

const MIME = "text/pmt-command";
const CUSTOM_PREFIX = "pmt_";

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

      const isCustomDragged = dragged.indexOf(CUSTOM_PREFIX) === 0;
      const isCustomTarget = group.dataset.pmtGroup === "custom";
      if (isCustomDragged !== isCustomTarget) {
        // Types incompatibles (bouton natif <-> groupe custom, ou l'inverse) : on annule.
        clearMarkers();
        return;
      }

      if (isCustomDragged) {
        dropCustomButton(state, dragged.slice(CUSTOM_PREFIX.length), group, e.clientX);
      } else {
        dropIntoGroup(state, dragged, Number(group.dataset.pmtGroup), group, e.clientX);
      }
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
    if (dragged.indexOf(CUSTOM_PREFIX) === 0) {
      const c = state.custom.find((cc) => cc.id === dragged.slice(CUSTOM_PREFIX.length));
      if (c) c.hidden = true;
    } else if (state.buttons[dragged]) {
      state.buttons[dragged].hidden = true;
    }
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

/* Applique un depot dans un groupe (natif ou non) : calcule la nouvelle position et
   reecrit les order. Un changement de groupe est accepte ; sa traduction (deplacement
   physique du bouton, impossible en CSS seul) est du ressort du generateur. */
function dropIntoGroup(state, command, targetGroup, groupEl, clientX) {
  const btn = state.buttons[command];
  if (!btn) return;

  const previousGroup = btn.group;
  btn.hidden = false;
  btn.group = targetGroup;

  // Ordre courant des commandes visibles du groupe cible (hors celle qu'on deplace).
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

  // Le groupe quitte perd un membre : renumeroter pour combler le trou.
  if (previousGroup !== targetGroup) normalizeOrders(state, previousGroup);
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

/* Applique un depot dans le groupe custom : reordonnancement uniquement (un seul groupe,
   pas de deplacement inter-groupes possible pour ces boutons). Meme logique de calcul de
   position que dropIntoGroup, adaptee a state.custom (tableau, pas objet par commande). */
function dropCustomButton(state, id, groupEl, clientX) {
  const btn = state.custom.find((c) => c.id === id);
  if (!btn) return;

  btn.hidden = false;

  const current = state.custom
    .filter((c) => !c.hidden && c.id !== id)
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id);

  const target = buttonUnderX(groupEl, clientX);
  let index = current.length; // par defaut : a la fin
  if (target) {
    const overCommand = target.el.getAttribute("data-sceditor-command");
    const overId = overCommand.indexOf(CUSTOM_PREFIX) === 0 ? overCommand.slice(CUSTOM_PREFIX.length) : null;
    const pos = overId ? current.indexOf(overId) : -1;
    if (pos !== -1) {
      const isAfter = clientX >= target.rect.left + target.rect.width / 2;
      index = isAfter ? pos + 1 : pos;
    }
  }

  current.splice(index, 0, id);
  current.forEach((cid, i) => {
    const c = state.custom.find((cc) => cc.id === cid);
    if (c) c.order = i;
  });
}
