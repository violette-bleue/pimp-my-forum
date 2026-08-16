/* modules/forum-classes.js — tague chaque ligne de forum et chaque
   categorie de la liste (index_box) avec une classe CSS stable, pour
   cibler en CSS sans :has() :
     .pmf-forum-row  -> pmf-forum-<id FA>       (extrait du href, ex: f3-xxx -> 3)
     .pmf-category   -> pmf-categorie-<position> (FA n'expose pas d'id fiable
                                                    cote categorie, cf CUR_ID
                                                    qui vaut toujours "root")

   Alias optionnels et user-friendly, en plus de la classe numerique (qui ne
   bouge jamais, meme en cas de renommage) :
     window.pmfConfig.forumClasses = {
       aliases: { "f3": "concept", "c1": "tutoriels" }
     }
   -> ajoute aussi pmf-forum-concept / pmf-categorie-tutoriels. A definir
   soi-meme via Modules > HTML & JAVASCRIPT (jamais inline dans un template
   FA, cf piege des accolades vides). */

export function init(config) {
  const aliases = (config && config.aliases) || {};

  document.querySelectorAll(".pmf-forum-row").forEach((row) => {
    const link = row.querySelector(".pmf-forum-row__title a[href]");
    const match = link && link.getAttribute("href").match(/\/f(\d+)-/);
    if (!match) return;
    const id = match[1];
    row.classList.add("pmf-forum-" + id);
    if (aliases["f" + id]) row.classList.add("pmf-forum-" + aliases["f" + id]);
  });

  document.querySelectorAll(".pmf-category").forEach((cat, i) => {
    const position = i + 1;
    cat.classList.add("pmf-categorie-" + position);
    if (aliases["c" + position]) cat.classList.add("pmf-categorie-" + aliases["c" + position]);
  });
}
