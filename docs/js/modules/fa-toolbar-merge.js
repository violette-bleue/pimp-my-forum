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

  // #fa_menu (menu deroulant utilisateur natif FA) n'est pas repris tel quel :
  // seuls quelques liens utiles en sont extraits (voir extractFromFaMenu), le
  // reste (mes sujets, mes messages, separateurs...) reste dans #fa_toolbar,
  // deja masque (tweaks.css), donc simplement inutilise plutot qu'affiche.
  extractFromFaMenu(userCard);

  ["fa_search", "fa_notifications"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) target.appendChild(el);
  });

  // Notifications imbriquees dans le lien plutot qu'en liste flottante a cote.
  const notifList = document.getElementById("notif_list");
  const notifLink = document.getElementById("fa_notifications");
  if (notifList && notifLink) {
    notifLink.appendChild(notifList);
    initNotifToggle(notifLink, notifList);
  }
}

// Recupere dans #fa_menulist : le lien profil (-> href du rank title), le
// lien editprofile (-> reçoit l'avatar), et les liens sujets-suivis/admin
// (-> nouveaux <li> a la suite de la navbar).
function extractFromFaMenu(userCard) {
  const menuList = document.getElementById("fa_menulist");
  if (!menuList) return;

  const profileLink = menuList.querySelector('a[href*="/u"]:not([href*="/sta/"]):not([href*="/spa/"])');
  const editLink = menuList.querySelector('a[href*="mode=editprofile"]');
  const watchLink = menuList.querySelector('a[href*="watchsearch"]');
  const adminLink = menuList.querySelector('a[href*="/admin"]');

  const rankTitle = document.getElementById("fa_ranktitle");
  if (rankTitle && profileLink) rankTitle.href = profileLink.href;

  const avatar = userCard && userCard.querySelector("img");
  if (avatar && editLink) {
    avatar.before(editLink);
    editLink.appendChild(avatar);
  }

  const navList = document.getElementById("modernbb-nav-menu");
  if (navList) {
    [watchLink, adminLink].forEach((link, i) => {
      if (!link) return;
      navList.appendChild(toNavItem(link, i === 0 ? "eye" : "lock"));
    });
  }
}

function toNavItem(link, icon) {
  link.classList.add("mainmenu");
  const i = document.createElement("i");
  i.setAttribute("icon-mask", icon);
  link.prepend(i);
  const li = document.createElement("li");
  li.appendChild(link);
  return li;
}

function initNotifToggle(notifLink, notifList) {
  notifList.hidden = true;
  notifLink.setAttribute("aria-expanded", "false");

  function close() {
    notifList.hidden = true;
    notifLink.classList.remove("is-open");
    notifLink.setAttribute("aria-expanded", "false");
  }

  notifLink.addEventListener("click", (e) => {
    if (e.target.closest("#notif_list")) return; 
    e.preventDefault();
    const open = notifList.hidden;
    notifList.hidden = !open;
    notifLink.classList.toggle("is-open", open);
    notifLink.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    if (!notifList.hidden && !notifLink.contains(e.target)) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
