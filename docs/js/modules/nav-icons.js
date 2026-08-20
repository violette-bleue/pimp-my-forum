/* modules/nav-icons.js — FA ne propose qu'un champ "image" (URL) pour
   personnaliser un lien de menu custom (Panneau admin > Modules > Barre
   d'outils). On detourne ce champ, limitant en soi (une image fixe, pas de
   coherence avec le pack d'icones du site) : au lieu d'y coller une vraie
   image, on y tape l'id d'une icone existante (ex: "discord", "home") et ce
   module remplace l'<img> (cassee, 404 natif attendu et inoffensif) par une
   icone reelle en icon-mask. */

export function init() {
  document.querySelectorAll("#modernbb-nav-menu a.mainmenu img").forEach((img) => {
    const id = img.getAttribute("src");
    if (!id) return;
    const icon = document.createElement("i");
    icon.setAttribute("icon-mask", id);
    img.replaceWith(icon);
    //console.info('[pmf] nav-icons : "' + id + '" -> icon-mask (le 404 juste au-dessus vient de la meme image, attendu et sans consequence)');
  });
}
