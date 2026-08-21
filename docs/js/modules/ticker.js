
export function init(tickerCfg) {
  if (!window.jQuery || !window.jQuery.fn.jcarousel) return;

  const $ = window.jQuery;
  let slidVert = false;
  let autoDir = "next";

  switch (tickerCfg.direction) {
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

  document.documentElement.style.setProperty("--ticker-spacing", tickerCfg.spacing + "px");

  $("#fa_ticker_content").css("display", "block");

  const widthMax = $("ul#fa_ticker_content").width();
  const widthItem = Math.floor(widthMax / tickerCfg.size);
  let heightMax = tickerCfg.height;

  if (widthMax > 0) {
    $("ul#fa_ticker_content li")
      .css("float", "left")
      .css("list-style", "none")
      .width(widthItem)
      .find("img")
      .each(function () {
        if ($(this).width() > widthItem) {
          const ratio = $(this).width() / widthItem;
          const newHeight = Math.round($(this).height() / ratio);
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
      auto: tickerCfg.stopTime,
      auto_direction: autoDir,
      scroll: 1,
      size: tickerCfg.size,
      height_max: heightMax,
      animation: tickerCfg.speed
    });
  } else {
    $("ul#fa_ticker_content li:not(:first)").css("display", "none");
    $("ul#fa_ticker_content li:first").css("list-style", "none").css("text-align", "center");
  }
}
