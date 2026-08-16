/* modules/fa-toolbar-merge.js — deplace des morceaux de #fa_toolbar (recherche,
   menu utilisateur, notifications) dans la navbar */

export function init() {
  const target = document.querySelector("#headerbar .wrap");
  if (!target) return;

  // Carte utilisateur (avatar/rang/stats), en tete de la navbar
  const userCard = document.getElementById("fa_usermenu");
  if (userCard) target.prepend(userCard);

  const welcome = document.getElementById("fa_welcome");
  if (welcome) welcome.remove();

  ["fa_search", "fa_menu", "fa_notifications"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) target.appendChild(el);
  });

  // Notifications imbriquees dans le lien plutot qu'en liste flottante a cote.
  const notifList = document.getElementById("notif_list");
  const notifLink = document.getElementById("fa_notifications");
  if (notifList && notifLink) notifLink.appendChild(notifList);
}
