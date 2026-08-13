/* docs/sites/lucidaliahunters/pimp-my-post.js
   Surcouche "Pimp My Post" specifique au forum Lucidalia Hunters.

   Ce fichier ne touche pas au core (docs/js/modules/pimp-my-post.js) : il le charge tel
   quel depuis le CDN, pose la config du forum (PimpMyPost.Config, cf entete du core pour
   le detail des cles labels/selects/classes/toolbarButtons/fieldTypes), puis appelle
   init(). Le forum profite donc des mises a jour du core sans rien repercuter ici, tant
   que la forme de Config ne change pas.

   A coller (ou importer) dans Administration > Modules > HTML & JAVASCRIPT > Gestion des
   codes Javascript (placement : toutes les pages), en <script type="module">.

   Garde-fou (pas absolu, contournable par quiconque lit ce fichier) : n'agit que sur les
   hotes de Lucidalia Hunters, pour eviter qu'un copier-coller naif du CDN ne l'active
   ailleurs. */

const ALLOWED_HOSTS = ["lucidaliahunters.forumactif.com", "lucidaliahunterstest.forumactif.com"];

if (ALLOWED_HOSTS.includes(location.hostname)) {
  window.PimpMyPost = {
    Config: {
      // labels:  { href: "Lien", ... },
      // selects: { "data-size": ["sm", { value: "lg", label: "Grand" }] },
      // classes: { layout: ["col1", { value: "col2", label: "Deux colonnes" }] },
      // toolbarButtons: [{ label: "...", onClick({ cm, state, container }) {} }],
      // fieldTypes: { bgcolor(ctx) { return node; } }
    }
  };

  import("https://cdn.jsdelivr.net/gh/violette-bleue/pimp-my-forum@main/docs/js/modules/pimp-my-post.js").then(
    (m) => m.init()
  );
}
