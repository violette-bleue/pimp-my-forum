/* modules/fa-toolbar-merge.js — deplace des morceaux de #fa_toolbar (recherche,
   menu utilisateur, notifications) dans la navbar plutot que de les laisser
   dans la barre FA d'origine. Deplacement pur (appendChild), pas de clone :
   les listeners JS que FA attache a ces elements restent intacts. */

const IDS = ["fa_search", "fa_menu", "fa_notifications", "notif_list"];

export function init() {
  const target = document.querySelector("#headerbar .wrap");
  if (!target) return;

  IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) target.appendChild(el);
  });
}
