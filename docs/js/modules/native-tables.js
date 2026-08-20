/* modules/native-tables.js — les tableaux natifs FA (membres, moderation,
   galerie, anniversaires...) sortent du moteur sans classe : on les raccroche
   a .table1 (components/table.css), deja pense pour les couvrir tous. */

export function init() {
  document.querySelectorAll('[data-pmf-slot="main-content"] table:not([class])').forEach((table) => {
    table.classList.add("table1");
  });
}
