const cfg = window.pmfConfig || {};

// config supabase
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

// chargement tolérant
function loadModule(path, run) {
  return import(path).then(run, (err) => {
    if (err instanceof TypeError && /dynamically imported module/i.test(err.message || "")) return;
    console.warn("[pmf] module non chargé :", path, err);
  });
}

function initModules() {
  // fusion toolbar/navbar
  loadModule("./modules/fa-toolbar-merge.js", (m) => m.init());

  // icon navbar
  if (document.querySelector('#modernbb-nav-menu a.mainmenu img, #modernbb-nav-menu a.mainmenu i[icon-mask^="http"]')) {
    loadModule("./modules/nav-icons.js", (m) => m.init());
  }

  // pimp my tooltip
  if (document.querySelector("[title]")) {
    loadModule("./modules/pimp-my-tooltip.js", (m) => m.init());
  }

  // bouton copier
  if (document.querySelector(".codebox")) {
    loadModule("./modules/codebox-copy.js", (m) => m.init());
  }

  // mirror select
  if (document.querySelector("select:not([multiple])")) {
    loadModule("./modules/select-mirror.js", (m) => m.init());
  }

  // classes forums
  if (document.querySelector(".pmf-forum-row, .pmf-category")) {
    loadModule("./modules/forum-classes.js", (m) => m.init(cfg.forumClasses));
  }

  // widget partenaires
  if (document.getElementById("pmf-widget-partenaires")) {
    loadModule("./modules/partners-widget.js", (m) => m.init());
  }

  if (document.getElementById("pmf-widget-sidebar-left") || document.getElementById("pmf-widget-sidebar-right")) {
    loadModule("./modules/sidebar-widgets.js", (m) => m.init());
  }
}
