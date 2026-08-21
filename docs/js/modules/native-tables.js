/* */

export function init() {
  document.querySelectorAll('[data-pmf-slot="main-content"] table:not([class])').forEach((table) => {
    table.classList.add("table1");
  });
}
