const BRAND_ICONS = new Set(["discord"]);

const NATIVE_ICON_MAP = {
  icon_home: "home",
  icon_calendar: "calendar",
  icon_faq: "faq",
  icon_search: "search",
  icon_members: "users",
  icon_groups: "groups",
  icon_ucp: "user",
  icon_register: "register",
  icon_message: "message",
  icon_logout: "logout",
};

export function init() {
  document.querySelectorAll("#modernbb-nav-menu a.mainmenu img").forEach((img) => {
    const id = img.getAttribute("src");
    if (!id) return;
    const icon = document.createElement("i");
    icon.setAttribute(BRAND_ICONS.has(id) ? "icon" : "icon-mask", id);
    img.replaceWith(icon);
  });

  document.querySelectorAll('#modernbb-nav-menu a.mainmenu i[icon-mask^="http"]').forEach((icon) => {
    const url = icon.getAttribute("icon-mask");
    const file = url.split("/").pop().replace(/\.[a-z0-9]+$/i, "");
    const name = NATIVE_ICON_MAP[file];
    if (name) icon.setAttribute("icon-mask", name);
  });
}
