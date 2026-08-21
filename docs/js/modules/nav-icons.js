/* modules/nav-icons.js — deux sources d'icones "brutes" a normaliser dans la
   navbar FA vers notre pack, pour que tout passe par le meme dictionnaire
   CSS (icons/icon.css) sans ciblage/traitement distinct :

   1. Boutons custom (Panneau admin > Modules > Barre d'outils) : FA ne
      propose qu'un champ "image" (URL), limitant (une image fixe, pas de
      coherence avec le pack d'icones du site). On le detourne en y tapant
      l'id d'une icone existante (ex: "discord", "home"), rendu en
      <img src="id"> (casse, 404 natif attendu et inoffensif) qu'on remplace
      par une icone reelle. La quasi-totalite du dictionnaire est en
      icon-mask="id" (recolorable en currentColor) ; seuls les logos de
      marque (ex: "discord") passent en icon="id" (background-image, couleur
      de marque fixe, cf credits/simple-icons.json).

   2. Icones natives (Accueil, Calendrier, FAQ...) : le theme rend directement
      <i icon-mask="https://2img.net/i/fa/modernbb/icon_home.png">, une URL
      inutilisable telle quelle (aucune entree du dictionnaire ne la
      reconnait). On mappe le nom de fichier vers notre icone equivalente et
      on reecrit l'attribut avec ce nom. */

// Logos de marque : pas de version icon-mask (couleur fixe), donc icon="id".
const BRAND_ICONS = new Set(["discord"]);

const NATIVE_ICON_MAP = {
  icon_home: "home",
  icon_calendar: "calendar",
  icon_faq: "faq",
  icon_search: "search",
  icon_members: "users",
  icon_groups: "groups",
  icon_ucp: "user",
  icon_message: "message",
  icon_logout: "logout",
};

export function init() {
  document.querySelectorAll("#modernbb-nav-menu a.mainmenu img").forEach((img) => {
    const id = img.getAttribute("src");
    if (!id) return;
    const icon = document.createElement("i");
    icon.setAttribute(BRAND_ICONS.has(id) ? "icon" : "icon-mask", id);
    img.replaceWith(icon);
  });

  document.querySelectorAll('#modernbb-nav-menu a.mainmenu i[icon-mask^="http"]').forEach((icon) => {
    const url = icon.getAttribute("icon-mask");
    const file = url.split("/").pop().replace(/\.[a-z0-9]+$/i, "");
    const name = NATIVE_ICON_MAP[file];
    if (name) icon.setAttribute("icon-mask", name);
  });
}
