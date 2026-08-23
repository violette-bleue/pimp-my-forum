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
