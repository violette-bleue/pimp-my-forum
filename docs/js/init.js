const cfg = window.pmfConfig || {};

// Config Supabase 
const SUPABASE_URL = "https://zmcemvepmmawriilblky.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fYNIKzORfbNwReKtP_PFDw_XFo0ueLF";

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

  // Toujours actif : fusion toolbar fa et navbar / table
  import("./modules/fa-toolbar-merge.js").then((m) => m.init());
  import("./modules/native-tables.js").then((m) => m.init());

  // Conditionnel : icon navbar
  if (document.querySelector('#modernbb-nav-menu a.mainmenu img, #modernbb-nav-menu a.mainmenu i[icon-mask^="http"]')) {
    import("./modules/nav-icons.js").then((m) => m.init());
  }

  // Conditionnel : carousel
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

  // Conditionnel : menu post + highlight.js 
  if (document.querySelector('[data-pmf-slot="postrow"]')) {
    import("./modules/viewtopic-post-menu.js").then((m) => m.init());
  }

  // Conditionnel : réactions 
  if (document.querySelector(".pmf-post__reactions[data-post-id]") || document.getElementById("pmf-reactions-admin")) {
    import("./modules/reactions.js").then((m) => m.init());
  }

  // Conditionnel : Pimp My Post
  if (document.getElementById("text_editor_textarea")) {
    import("./modules/pimp-my-post.js").then((m) => m.init());
  }

  // Conditionnel : smilies
  if (document.getElementById("smiley-box")) {
    import("./modules/smiley-box.js").then((m) => m.init());
  }

  // Conditionnel : bouton copier sur les balises [code]
  if (document.querySelector(".codebox")) {
    import("./modules/codebox-copy.js").then((m) => m.init());
  }

  // Conditionnel : mirror des <select>
  if (document.querySelector("select:not([multiple])")) {
    import("./modules/select-mirror.js").then((m) => m.init());
  }

  // Conditionnel : classes forums/categories
  if (document.querySelector(".pmf-forum-row, .pmf-category")) {
    import("./modules/forum-classes.js").then((m) => m.init(cfg.forumClasses));
  }

  // Conditionnel : widget partenaires
  if (document.getElementById("pmf-widget-partenaires")) {
    import("./modules/partners-widget.js").then((m) => m.init());
  }

  if (document.getElementById("pmf-widget-sidebar-left") || document.getElementById("pmf-widget-sidebar-right")) {
    import("./modules/sidebar-widgets.js").then((m) => m.init());
  }

  // Conditionnel : Pimp My Toolbar
  const pmtApp = document.getElementById("pmt-app");
  if (pmtApp) {
    import("../tools/pimp-my-toolbar/app.js").then((m) => m.mount(pmtApp));
  }
}
