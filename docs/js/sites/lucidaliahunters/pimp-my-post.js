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
