/* modules/partners-widget.js — deplace le widget FA "Partenaires" (id
   pmf-widget-partenaires, contenu d'un widget HTML FA) juste apres le bloc
   titre/desc de la ligne du forum "Contact & Partenariat" dans la liste des
   forums (page d'accueil/categories), puis initialise le carousel
   boutons+iframes (cf. local/README.md pour le detail du mecanisme). */

const PARTNERS_FORUM_HREF = "f6-contact-partenariat";
const AUTOPLAY_MS = 6000;

export function init() {
  const widget = document.getElementById("pmf-widget-partenaires");
  if (!widget) return;

  const link = document.querySelector('.pmf-forum-row__main a[href*="' + PARTNERS_FORUM_HREF + '"]');
  const main = link && link.closest(".pmf-forum-row__main");
  if (!main) return;

  main.insertAdjacentElement("afterend", widget);
  widget.style.display = "block";

  initCarousel(widget);
}

function initCarousel(widget) {
  const framesWrap = widget.querySelector(".pmf-partenaires__frames-wrap");
  const frames = Array.from(widget.querySelectorAll(".pmf-partenaires__frame"));
  const boutons = Array.from(widget.querySelectorAll(".pmf-partenaires__bouton"));
  const track = widget.querySelector(".pmf-partenaires__frames");
  const stage = widget.querySelector(".pmf-partenaires__stage");
  let dotsWrap = widget.querySelector(".pmf-partenaires__dots");
  if (!dotsWrap && stage) {
    dotsWrap = document.createElement("div");
    dotsWrap.className = "pmf-partenaires__dots";
    stage.insertAdjacentElement("afterend", dotsWrap);
  }
  if (dotsWrap) dotsWrap.textContent = ""; // vide le &nbsp; posé en dur (evite que FA supprime le bloc vide)
  const prevBtn = widget.querySelector(".pmf-partenaires__arrow--prev");
  const nextBtn = widget.querySelector(".pmf-partenaires__arrow--next");
  if (!framesWrap || !track || frames.length === 0) return;

  const dots = frames.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "pmf-partenaires__dot";
    dot.setAttribute("aria-label", "Aller au partenaire " + (i + 1));
    dot.addEventListener("click", () => goTo(i, true));
    if (dotsWrap) dotsWrap.appendChild(dot);
    return dot;
  });

  let index = 0;
  let timer = null;

  function frameHeight(i) {
    const iframe = frames[i].querySelector("iframe");
    return (iframe && parseInt(iframe.getAttribute("height"), 10)) || 420;
  }

  function goTo(i, userTriggered) {
    index = (i + frames.length) % frames.length;
    track.style.transform = "translateX(-" + index * 100 + "%)";
    framesWrap.style.setProperty("--pmf-partenaires-h", frameHeight(index) + "px");
    boutons.forEach((b, bi) => b.classList.toggle("is-active", bi === index));
    dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
    if (userTriggered) restartAutoplay();
  }

  function next() {
    goTo(index + 1);
  }

  function startAutoplay() {
    if (frames.length < 2) return;
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1, true));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1, true));

  widget.addEventListener("mouseenter", stopAutoplay);
  widget.addEventListener("mouseleave", startAutoplay);

  goTo(0);
  startAutoplay();
}
