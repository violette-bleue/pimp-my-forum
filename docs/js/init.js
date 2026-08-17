/* pmf.js — point d'entrée (chargé en <script type="module">) */

const cfg = window.pmfConfig || {};

// Config Supabase (log usage + check licence)
const SUPABASE_URL = "https://zmcemvepmmawriilblky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fYNIKzORfbNwReKtP_PFDw_XFo0ueLF";

// Log d'usage (fire-and-forget)
fetch(SUPABASE_URL + "/rest/v1/pmf_installs", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + SUPABASE_ANON_KEY,
    Prefer: "return=minimal",
  },
  body: JSON.stringify({ host: location.hostname }),
}).catch(() => {});

// Check de licence (fail-open)
fetch(SUPABASE_URL + "/rest/v1/rpc/pmf_check_status", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({ p_host: location.hostname }),
})
  .then((r) => r.json())
  .then((rows) => {
    const row = Array.isArray(rows) ? rows[0] : null;
    if (row && row.status === "suspended") {
      showSuspendedBanner(row.message);
      return;
    }
    initModules();
  })
  .catch(() => initModules());

function showSuspendedBanner(message) {
  const el = document.createElement("div");
  el.id = "pmf-suspended-banner";
  el.textContent = message || "Pimp My Forum a été suspendu sur ce forum pour non-respect des conditions d'usage.";
  Object.assign(el.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    zIndex: "999999",
    padding: "10px 16px",
    background: "linear-gradient(90deg, #c6a3ff 0%, #ff89c1 73%, #eed91b 140%)",
    color: "#2b1f3d",
    fontFamily: "sans-serif",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "center",
  });
  document.body.appendChild(el);
}

function initModules() {
  // Toujours actif : gestion du menu burger mobile
  import("./modules/burger-menu.js").then((m) => m.init());

  // Toujours actif : integre recherche/menu utilisateur/notifications de
  // #fa_toolbar dans la navbar plutot que de les laisser dans la barre FA.
  import("./modules/fa-toolbar-merge.js").then((m) => m.init());

  // Conditionnel : convertit les images des liens de menu custom (barre de
  // nav generee par FA) en icones du pack du site.
  if (document.querySelector("#modernbb-nav-menu a.mainmenu img")) {
    import("./modules/nav-icons.js").then((m) => m.init());
  }

  // Conditionnel : ticker "new" (jcarousel), seulement si activé côté admin FA
  if (cfg.ticker && cfg.ticker.enabled) {
    import("./modules/ticker.js").then((m) => m.init(cfg.ticker));
  }

  // Conditionnel : recentrage du popup de login au resize
  if (cfg.login && cfg.login.enabled) {
    import("./modules/login-popup.js").then((m) => m.init(cfg.login));
  }

  // Conditionnel : popups natifs PM / signalement
  if (cfg.popups && (cfg.popups.pm || cfg.popups.report)) {
    import("./modules/native-popups.js").then((m) => m.init(cfg.popups));
  }

  // Conditionnel : menu post + highlight.js (viewtopic_body uniquement)
  if (document.querySelector('[data-pmf-slot="postrow"]')) {
    import("./modules/viewtopic-post-menu.js").then((m) => m.init());
  }

  // Conditionnel : réactions multi-étiquettes (Supabase), sur tout topic —
  // conteneurs de réaction et/ou point de montage du panneau admin mod.
  if (document.querySelector(".pmf-post__reactions[data-post-id]") || document.getElementById("pmf-reactions-admin")) {
    import("./modules/reactions.js").then((m) => m.init());
  }

  // Conditionnel : Pimp My Post (coloration BBCode/HTML + inputs assistes) dans l'editeur
  // SCEditor (pages post/reponse/edition).
  if (document.getElementById("text_editor_textarea")) {
    import("./modules/pimp-my-post.js").then((m) => m.init());
  }

  // Conditionnel : reprise en main du picker de smileys (#smiley-box, frame /smilies).
  if (document.getElementById("smiley-box")) {
    import("./modules/smiley-box.js").then((m) => m.init());
  }

  // Conditionnel : mirror des <select> simples (hors [multiple]) en trigger/panel stylables.
  if (document.querySelector("select:not([multiple])")) {
    import("./modules/select-mirror.js").then((m) => m.init());
  }

  // Conditionnel : classes stables pmf-forum-<id>/pmf-categorie-<position> sur
  // la liste des forums (index_box), pour cibler en CSS sans :has().
  if (document.querySelector(".pmf-forum-row, .pmf-category")) {
    import("./modules/forum-classes.js").then((m) => m.init(cfg.forumClasses));
  }

  // Conditionnel : widget partenaires, deplace juste apres la ligne du forum
  // "Contact & Partenariat" dans la liste des forums (page d'accueil).
  if (document.getElementById("pmf-widget-partenaires")) {
    import("./modules/partners-widget.js").then((m) => m.init());
  }

  // Conditionnel : contenu giefmod_index1/2 (index_box), deplace vers les
  // ancres sidebar-left/right du header.
  if (document.getElementById("pmf-widget-sidebar-left") || document.getElementById("pmf-widget-sidebar-right")) {
    import("./modules/sidebar-widgets.js").then((m) => m.init());
  }

  // Conditionnel : Pimp My Toolbar, sur toute page qui contient son point de montage.
  const pmtApp = document.getElementById("pmt-app");
  if (pmtApp) {
    import("../tools/pimp-my-toolbar/app.js").then((m) => m.mount(pmtApp));
  }
}
