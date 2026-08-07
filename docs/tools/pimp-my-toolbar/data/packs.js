/* pimp-my-toolbar/data/packs.js
   Packs d'icones. Un pack = une police d'icones + un mapping exhaustif
   commande SCEditor -> glyphe (les 40 commandes de TOOLBAR_REFERENCE).

   Structure d'un pack :
     {
       id, name,
       font: { import: "<url @import de la police>", family: "<font-family>" },
       icons: { <command>: "<glyphe>", ... },  // exhaustif : les 40 commandes
       commonIcons: ["<glyphe>", ...]          // selection courante pour le dropdown
                                                // des boutons personnalises (pas exhaustif :
                                                // le champ libre reste le repli complet)
     }

   Decliner un pack = copier cette structure, changer font + les valeurs de icons.
   Les CLES de icons sont invariantes (ce sont les commandes SCEditor) ; seules les
   VALEURS (glyphes) et la police changent d'un pack a l'autre.

   Le "value" (glyphe) est ce qui part dans le CSS (content) ; la police est chargee
   via font.import (CDN officiel pour une police publique, jsDelivr pour un pack maison). */

export const PACKS = {
  material: {
    id: "material",
    name: "Material Symbols",
    font: {
      import: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined",
      family: "Material Symbols Outlined"
    },
    // Mapping exhaustif (glyphes valides en reel sur un forum de reference).
    icons: {
      // G0 — mise en forme texte
      bold: "format_bold",
      italic: "format_italic",
      underline: "format_underlined",
      strike: "format_strikethrough",
      // G1 — alignement
      left: "format_align_left",
      center: "format_align_center",
      right: "format_align_right",
      justify: "format_align_justify",
      // G2 — listes
      bulletlist: "format_list_bulleted",
      orderedlist: "format_list_numbered",
      horizontalrule: "horizontal_rule",
      // G3 — contenus speciaux
      quote: "format_quote",
      code: "code",
      faspoiler: "visibility_off",
      fahide: "lock",
      table: "table_chart",
      // G4 — medias
      servimg: "cloud_upload",
      image: "image",
      link: "link",
      embed: "add_link",
      youtube: "smart_display",
      // G5 — typographie
      headers: "title",
      size: "format_size",
      color: "palette",
      font: "font_download",
      removeformat: "format_clear",
      // G6 — plus/moins
      more: "more_horiz",
      // G7 — indice/exposant
      subscript: "subscript",
      superscript: "superscript",
      // G8 — animations FA
      fascroll: "swap_horiz",
      faupdown: "swap_vert",
      farand: "shuffle",
      // G9 — divers
      twemojifa: "mood",
      date: "calendar_today",
      time: "schedule",
      pastetext: "content_paste",
      source: "terminal"
    },
    // Selection courante pour le dropdown des boutons personnalises (non exhaustif).
    commonIcons: [
      "star", "favorite", "warning", "info", "help", "campaign", "push_pin",
      "bookmark", "flag", "thumb_up", "thumb_down", "celebration", "mood",
      "block", "report", "verified", "new_releases", "local_fire_department",
      "emoji_events", "military_tech", "diamond", "auto_awesome", "bolt",
      "priority_high", "forum", "chat_bubble", "group", "person", "public",
      "language", "translate", "schedule", "event", "notifications",
      "volume_up", "mic", "videocam", "photo_camera", "movie", "music_note",
      "palette", "brush", "extension", "build", "settings", "tune",
      "search", "add_circle", "check_circle", "cancel", "arrow_forward",
      "expand_more", "open_in_new", "download", "share", "edit", "delete",
      "content_copy", "refresh", "timer", "key", "shield", "gavel"
    ]
  }
};

// Pack par defaut (id).
export const DEFAULT_PACK = "material";

// Recupere un pack par id, avec repli sur le pack par defaut.
export function getPack(id) {
  return PACKS[id] || PACKS[DEFAULT_PACK];
}
