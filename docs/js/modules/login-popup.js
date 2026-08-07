/* modules/login-popup.js — recentre #login_popup au resize de la fenêtre */

export function init(loginCfg) {
  if (!window.jQuery) return;
  const $ = window.jQuery;

  $(window).resize(function () {
    const windowWidth = document.documentElement.clientWidth;
    const popupWidth = $("#login_popup").width();
    $("#login_popup").css({ left: windowWidth / 2 - popupWidth / 2 });
  });
}
