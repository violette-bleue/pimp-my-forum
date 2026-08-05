/* ==========================================================================
   Puzzle & Pixel — pnp.js
   Logique sortie des templates FA (overall_header / overall_footer_begin).
   Lit window.pnpConfig, exposé en inline dans overall_header pour contourner
   le fait que ce fichier n'est jamais interpolé par le moteur de templates FA.
   ========================================================================== */

(function () {
  "use strict";

  var cfg = window.pnpConfig || {};

  function ready(fn) {
    if (window.jQuery) {
      window.jQuery(document).ready(fn);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  /* --------------------------------------------------------------------
     Burger menu (mobile) — ferme le menu si on clique en dehors
     -------------------------------------------------------------------- */
  function initBurgerMenu() {
    document.onclick = function (e) {
      if (!e.target.classList.contains("navicon")) {
        var closestBar = e.target.closest ? e.target.closest(".responsive-headerbar") : null;
        if (!closestBar && e.target.id !== "menu-btn") {
          var menuBtn = document.getElementById("menu-btn");
          if (menuBtn) menuBtn.checked = false;
        }
      }
    };
  }

  /* --------------------------------------------------------------------
     Ticker "new" (jcarousel) — nécessite jQuery + jcarousel chargés
     -------------------------------------------------------------------- */
  function initTickerNew() {
    if (!cfg.ticker || !cfg.ticker.enabled) return;
    if (!window.jQuery || !window.jQuery.fn.jcarousel) return;

    var $ = window.jQuery;
    var t = cfg.ticker;
    var slidVert = false;
    var autoDir = "next";

    switch (t.direction) {
      case "top":
        slidVert = true;
        break;
      case "left":
        break;
      case "bottom":
        slidVert = true;
        autoDir = "prev";
        break;
      case "right":
        autoDir = "prev";
        break;
      default:
        slidVert = true;
    }

    $("#fa_ticker_content").css("display", "block");

    var widthMax = $("ul#fa_ticker_content").width();
    var widthItem = Math.floor(widthMax / t.size);
    var heightMax = t.height;

    if (widthMax > 0) {
      $("ul#fa_ticker_content li")
        .css("float", "left")
        .css("list-style", "none")
        .width(widthItem)
        .find("img")
        .each(function () {
          if ($(this).width() > widthItem) {
            var ratio = $(this).width() / widthItem;
            var newHeight = Math.round($(this).height() / ratio);
            $(this).height(newHeight).width(widthItem);
          }
        });

      if (slidVert) {
        $("ul#fa_ticker_content li").each(function () {
          if ($(this).height() > heightMax) heightMax = $(this).height();
        });
        $("ul#fa_ticker_content")
          .width(widthItem)
          .height(heightMax)
          .css("marginLeft", "auto")
          .css("marginRight", "auto");
        $("ul#fa_ticker_content li").height(heightMax);
      }

      $("#fa_ticker_content").jcarousel({
        vertical: slidVert,
        wrap: "circular",
        auto: t.stopTime,
        auto_direction: autoDir,
        scroll: 1,
        size: t.size,
        height_max: heightMax,
        animation: t.speed
      });
    } else {
      $("ul#fa_ticker_content li:not(:first)").css("display", "none");
      $("ul#fa_ticker_content li:first").css("list-style", "none").css("text-align", "center");
    }
  }

  /* --------------------------------------------------------------------
     Login popup — recentre au resize
     -------------------------------------------------------------------- */
  function initLoginPopupResize() {
    if (!cfg.login || !cfg.login.enabled) return;
    if (!window.jQuery) return;
    var $ = window.jQuery;

    $(window).resize(function () {
      var windowWidth = document.documentElement.clientWidth;
      var popupWidth = $("#login_popup").width();
      $("#login_popup").css({ left: windowWidth / 2 - popupWidth / 2 });
    });
  }

  /* --------------------------------------------------------------------
     Popups PM / report — fenêtres natives FA
     -------------------------------------------------------------------- */
  function initNativePopups() {
    if (cfg.popups && cfg.popups.pm) {
      var pm = window.open(cfg.popups.pm, "_faprivmsg", "HEIGHT=225,resizable=yes,WIDTH=400");
      if (pm) pm.focus();
    }
    if (cfg.popups && cfg.popups.report) {
      var report = window.open(
        cfg.popups.report,
        "_phpbbreport",
        "HEIGHT=" + cfg.popups.reportH + ",resizable=yes,scrollbars=no,WIDTH=" + cfg.popups.reportW
      );
      if (report) report.focus();
    }
  }

  ready(function () {
    initBurgerMenu();
    initTickerNew();
    initLoginPopupResize();
    initNativePopups();
  });
})();
