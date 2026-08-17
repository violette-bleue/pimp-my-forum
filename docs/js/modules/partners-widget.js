/* modules/partners-widget.js — deplace le widget FA "Partenaires" (id
   pmf-widget-partenaires, contenu d'un widget HTML FA) juste apres le bloc
   titre/desc de la ligne du forum "Contact & Partenariat" dans la liste des
   forums (page d'accueil/categories). Le widget natif reste masque la ou FA
   le rend par defaut ([id^="pmf-widget-"] dans layout.css) ; une fois
   deplace vers son ancre, on le rend visible explicitement. */

const PARTNERS_FORUM_HREF = "f6-contact-partenariat";

export function init() {
  const widget = document.getElementById("pmf-widget-partenaires");
  if (!widget) return;

  const link = document.querySelector('.pmf-forum-row__main a[href*="' + PARTNERS_FORUM_HREF + '"]');
  const main = link && link.closest(".pmf-forum-row__main");
  if (!main) return;

  main.insertAdjacentElement("afterend", widget);
  widget.style.display = "block";
}
