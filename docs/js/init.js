/* ==========================================================================
   pmf.js — point d'entrée (chargé en <script type="module">)
   Ne charge (import() dynamique) que les modules nécessaires, selon
   window.pmfConfig exposé en inline dans overall_header, ou la présence
   d'un data-pmf-slot précis dans le DOM de la page.
   ========================================================================== */

const cfg = window.pmfConfig || {};

// Toujours actif : gestion du menu burger mobile
import("./modules/burger-menu.js").then((m) => m.init());

// Toujours actif : integre recherche/menu utilisateur/notifications de
// #fa_toolbar dans la navbar plutot que de les laisser dans la barre FA.
import("./modules/fa-toolbar-merge.js").then((m) => m.init());

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

// Conditionnel : Pimp My Toolbar, sur toute page qui contient son point de montage.
// FA bloque les <script> dans le contenu des messages/pages ; #pmt-app seul (une simple
// div) passe, et c'est ce point d'entree central qui se charge du montage.
const pmtApp = document.getElementById("pmt-app");
if (pmtApp) {
  import("../tools/pimp-my-toolbar/app.js").then((m) => m.mount(pmtApp));
}
