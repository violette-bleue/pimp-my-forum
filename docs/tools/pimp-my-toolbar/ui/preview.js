/* pimp-my-toolbar/ui/preview.js — l'APERCU, fausse toolbar reconstruite depuis l'etat
   (VUE pure, jamais une source de verite) */

import { TOOLBAR_REFERENCE } from "../data/toolbar-reference.js";
import { buttonsInGroup } from "../core/state.js";

// Conteneur de l'apercu : sert de racine au scope du CSS genere.
export const PREVIEW_SCOPE = "#pmt-preview";

// Libelles natifs (title FA) indexes par commande, pour les tooltips de l'apercu.
const LABELS = {};
TOOLBAR_REFERENCE.forEach((group) => {
  group.forEach((b) => {
    LABELS[b.command] = b.label;
  });
});

// Construit un bouton a l'identique du DOM SCEditor natif.
function buildButton(command, label) {
  const a = document.createElement("a");
  a.className = "sceditor-button sceditor-button-" + command;
  a.setAttribute("data-sceditor-command", command);
  a.setAttribute("unselectable", "on");
  a.setAttribute("title", label || command);
  a.setAttribute("draggable", "true"); // pour le drag & drop (branche par l'UI)
  a.setAttribute("href", "javascript:void(0)");

  const d = document.createElement("div");
  d.setAttribute("unselectable", "on");
  d.textContent = label || command;
  a.appendChild(d);

  return a;
}

// Construit un bouton custom a l'identique de ce que produit le JS genere (memes classes, meme variable --pmt-glyph)
function buildCustomButton(custom) {
  const a = document.createElement("a");
  const isImage = custom.iconType === "image";
  a.className = "sceditor-button pmt-custom pmt-custom-" + custom.id + (isImage ? " pmt-custom-image" : "");
  a.setAttribute("data-sceditor-command", "pmt_" + custom.id);
  a.setAttribute("unselectable", "on");
  a.setAttribute("title", custom.label || "");
  a.setAttribute("draggable", "true"); // pour le drag & drop (branche par l'UI)
  a.setAttribute("href", "javascript:void(0)");
  if (isImage) a.style.setProperty("--pmt-icon-url", "url('" + (custom.icon || "") + "')");
  else a.style.setProperty("--pmt-glyph", "'" + (custom.icon || "") + "'");

  const d = document.createElement("div");
  d.setAttribute("unselectable", "on");
  d.textContent = custom.label || "";
  a.appendChild(d);

  return a;
}

// Rend la toolbar simulee dans un conteneur, depuis l'etat (boutons masques -> reserve)
export function renderPreview(host, state) {
  host.innerHTML = "";

  const container = document.createElement("div");
  container.className = "sceditor-container ltr";

  const toolbar = document.createElement("div");
  toolbar.className = "sceditor-toolbar";
  toolbar.setAttribute("unselectable", "on");

  TOOLBAR_REFERENCE.forEach((_, groupIndex) => {
    const group = document.createElement("div");
    group.className = "sceditor-group";
    group.dataset.pmtGroup = String(groupIndex); // ancre pour le drag & drop

    buttonsInGroup(state, groupIndex)
      .filter((b) => !b.hidden)
      .forEach((b) => {
        group.appendChild(buildButton(b.command, LABELS[b.command]));
      });

    // Un groupe vide reste present (zone de depot valide pour le drag & drop).
    toolbar.appendChild(group);
  });

  if (state.custom && state.custom.length) {
    const customGroup = document.createElement("div");
    customGroup.className = "sceditor-group pmt-custom-group";
    customGroup.dataset.pmtGroup = "custom"; // ancre pour le drag & drop (sentinelle non numerique)

    state.custom
      .filter((c) => !c.hidden)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach((custom) => {
        customGroup.appendChild(buildCustomButton(custom));
      });

    // Groupe present meme vide : zone de depot valide pour reprendre un bouton masque.
    toolbar.appendChild(customGroup);
  }

  container.appendChild(toolbar);
  host.appendChild(container);
  return toolbar;
}

// Rend la reserve : les boutons masques, recuperables
export function renderReserve(host, state) {
  host.innerHTML = "";

  const zone = document.createElement("div");
  zone.className = "pmt-reserve-zone";
  zone.dataset.pmtReserve = "1";

  const hidden = Object.entries(state.buttons).filter(([, b]) => b.hidden);
  const hiddenCustom = (state.custom || []).filter((c) => c.hidden);

  if (!hidden.length && !hiddenCustom.length) {
    const empty = document.createElement("p");
    empty.className = "pmt-reserve-empty";
    empty.textContent = "Aucun bouton masque pour l'instant.";
    zone.appendChild(empty);
  } else {
    hidden.forEach(([command]) => {
      zone.appendChild(buildButton(command, LABELS[command]));
    });
    hiddenCustom.forEach((custom) => {
      zone.appendChild(buildCustomButton(custom));
    });
  }

  host.appendChild(zone);
  return zone;
}

// Scope un CSS genere a la zone d'apercu : chaque selecteur est prefixe par PREVIEW_SCOPE.
// Les at-rules (@import, @media...) et les commentaires sont laisses tels quels.
function scopeCss(css, scope) {
  return css.replace(
    /(^|\})\s*([^@{}][^{}]*)\{/g,
    (match, brace, selectors) => {
      const scoped = selectors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => `${scope} ${s}`)
        .join(", ");
      return `${brace}\n${scoped} {`;
    }
  );
}

// Injecte (ou met a jour) le CSS genere, SCOPE a l'apercu, pour un restyle en direct.
export function applyGeneratedCss(css) {
  let tag = document.getElementById("pmt-generated-style");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "pmt-generated-style";
    document.head.appendChild(tag);
  }
  // L'@import doit rester en tete et non scope : on l'extrait avant de scoper le reste.
  const imports = [];
  const body = css.replace(/@import[^;]+;/g, (m) => {
    imports.push(m);
    return "";
  });
  tag.textContent = imports.join("\n") + "\n" + scopeCss(body, PREVIEW_SCOPE);
}
