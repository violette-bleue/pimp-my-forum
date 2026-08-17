/* modules/sidebar-widgets.js — deplace le contenu des blocs giefmod_index1/2
   (rendus dans index_box.html, seul contexte ou FA les peuple) vers les
   ancres data-pmf-slot="sidebar-left/right" du header. On deplace les enfants
   plutot que le wrapper : si giefmod n'a rien rendu, l'ancre reste vide et
   .pmf-sidebar:empty (layout.css) la cache automatiquement. */

const SLOTS = [
  { widgetId: "pmf-widget-sidebar-left", slot: "sidebar-left" },
  { widgetId: "pmf-widget-sidebar-right", slot: "sidebar-right" },
];

export function init() {
  SLOTS.forEach(({ widgetId, slot }) => {
    const source = document.getElementById(widgetId);
    const target = document.querySelector('[data-pmf-slot="' + slot + '"]');
    if (!source || !target) return;

    while (source.firstChild) {
      target.appendChild(source.firstChild);
    }
    source.remove();
  });
}
