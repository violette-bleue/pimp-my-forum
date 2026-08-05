/* modules/native-popups.js — fenêtres natives FA (messagerie privée, signalement) */

export function init(popupsCfg) {
  if (popupsCfg.pm) {
    const pm = window.open(popupsCfg.pm, "_faprivmsg", "HEIGHT=225,resizable=yes,WIDTH=400");
    if (pm) pm.focus();
  }
  if (popupsCfg.report) {
    const report = window.open(
      popupsCfg.report,
      "_phpbbreport",
      "HEIGHT=" + popupsCfg.reportH + ",resizable=yes,scrollbars=no,WIDTH=" + popupsCfg.reportW
    );
    if (report) report.focus();
  }
}
