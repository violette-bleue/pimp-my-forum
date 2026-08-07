/* pimp-my-toolbar/app.js
   Point d'entree de l'outil. Assemble le cycle :

     INTERFACE  --edite-->  ETAT  --serialise-->  CSS + JS
         |                    |
         +---- apercu <-------+

   L'etat est la source de verite unique : l'apercu le lit, le generateur le serialise.
   Aucune divergence possible entre ce que l'utilisateur voit et le code produit.

   Integration sur une page/un topic FA : FA bloque les <script> dans le contenu des
   messages, donc pas de tag a coller ici. Seul un point de montage est necessaire :
     <div id="pmt-app"></div>
   Le montage est pris en charge par le point d'entree central du site (docs/js/init.js),
   charge globalement (Modules > HTML & JAVASCRIPT), qui detecte #pmt-app et importe ce
   module a la demande. Voir init.js pour le detail.

   Montage manuel (autre contexte : plusieurs instances, id different...) :
     <div id="mon-id"></div>
     <script type="module">
       import { mount } from "<base>/tools/pimp-my-toolbar/app.js";
       mount(document.getElementById("mon-id"));
     </script>
*/

import { createInitialState, setHidden, setPack, setStyle, addCustom, removeCustom, setCustomHidden } from "./core/state.js";
import { generate } from "./core/generator.js";
import { renderPreview, renderReserve, applyGeneratedCss } from "./ui/preview.js";
import { bindDnd } from "./ui/dnd.js";
import { PACKS, getPack } from "./data/packs.js";

// Valeurs sentinelles de la grille d'icones des boutons custom (distinctes des noms de
// glyphe reels, qui ne contiennent jamais d'espace).
const ICON_GLYPH_OTHER = "__glyph__";
const ICON_IMAGE_URL = "__image__";

// Charge la police d'un pack pour le picker d'icones, independamment de "Appliquer le
// pack" (qui ne concerne que le CSS EXPORTE) : le picker doit toujours pouvoir afficher
// les vrais glyphes, meme si l'utilisateur garde les icones natives sur sa toolbar.
const loadedPickerFonts = new Set();
function loadPickerFont(pack) {
  if (!pack.font || !pack.font.import || loadedPickerFonts.has(pack.id)) return;
  loadedPickerFonts.add(pack.id);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = pack.font.import;
  document.head.appendChild(link);
}

// Marge bouton/icone (px) : le bouton suit la taille d'icone choisie en gardant cet
// ecart, pour rester coherent avec le defaut natif (32px bouton / 18px icone).
const BUTTON_PADDING = 14;

// Synchronise un slider et son champ nombre associe (l'un pilote l'autre), et notifie
// onChange(valeur) quel que soit le controle actionne.
function syncRangeNumber(rangeEl, numEl, onChange) {
  const apply = (value) => {
    rangeEl.value = value;
    numEl.value = value;
    onChange(value);
  };
  rangeEl.addEventListener("input", () => apply(rangeEl.value));
  numEl.addEventListener("input", () => apply(numEl.value));
}

// Slider + nombre facultatifs, actives par une checkbox : decoche => pas de style (valeur
// null) ; coche => valeur courante, synchronisee entre slider et champ nombre.
function bindOptionalRange(enableEl, rangeEl, numEl, onChange) {
  enableEl.addEventListener("change", () => {
    const on = enableEl.checked;
    rangeEl.disabled = !on;
    numEl.disabled = !on;
    onChange(on ? numEl.value : null);
  });
  syncRangeNumber(rangeEl, numEl, (v) => {
    if (!enableEl.checked) return;
    onChange(v);
  });
}

// Associe une checkbox d'activation a un input (color ou texte) : decoche => valeur null
// (pas de style genere), coche => valeur courante de l'input. onChange(valeur) notifie.
function bindToggleInput(enableEl, inputEl, onChange) {
  enableEl.addEventListener("change", () => {
    inputEl.disabled = !enableEl.checked;
    onChange(enableEl.checked ? inputEl.value : null);
  });
  inputEl.addEventListener("input", () => {
    if (!enableEl.checked) return;
    onChange(inputEl.value);
  });
}

export function mount(root) {
  if (!root) return;

  const state = createInitialState();
  const ui = buildLayout(root);

  // Bascule Simple/Avance : affiche ou masque les reglages avances (pur affichage, aucun
  // impact sur l'etat — une valeur avancee deja definie reste active meme masquee).
  const advancedEls = [...root.querySelectorAll(".pmt-advanced-only")];
  ui.advancedMode.addEventListener("change", () => {
    advancedEls.forEach((el) => { el.hidden = !ui.advancedMode.checked; });
  });

  // Rafraichit apercu + reserve depuis l'etat, applique le CSS courant, rebranche les
  // interactions. Le DOM etant reconstruit a chaque passage, les ecouteurs doivent l'etre
  // aussi : c'est le prix de "l'apercu est une vue pure de l'etat", et il est modique.
  function refresh() {
    renderPreview(ui.preview, state);
    renderReserve(ui.reserve, state);
    renderCustomList();

    // Un seul generate() : alimente a la fois l'apercu live et les zones de code, qui
    // restent donc toujours a jour sans action explicite.
    const out = generate(state, { applyPack: ui.applyPack.checked });
    applyGeneratedCss(out.css);
    ui.cssOut.value = out.css;
    ui.jsOut.value = out.js || "/* Aucun bouton personnalise : pas de JS necessaire. */";

    bindDnd({
      previewHost: ui.preview,
      reserveHost: ui.reserve,
      state,
      onChange: refresh
    });
    bindClickShortcut();
  }

  // Liste des boutons custom, avec suppression. Meme logique que le reste : une VUE de
  // state.custom, reconstruite a chaque refresh().
  function renderCustomList() {
    ui.customList.innerHTML = "";

    if (!state.custom.length) {
      const empty = document.createElement("p");
      empty.className = "pmt-reserve-empty";
      empty.textContent = "Aucun bouton personnalise pour l'instant.";
      ui.customList.appendChild(empty);
      return;
    }

    [...state.custom].sort((a, b) => a.order - b.order).forEach((btn) => {
      const row = document.createElement("div");
      row.className = "pmt-custom-item";

      const label = document.createElement("span");
      label.className = "pmt-custom-item-label";
      label.textContent = btn.label || btn.id;

      const type = document.createElement("span");
      type.className = "pmt-custom-item-type";
      type.textContent = btn.hidden ? "Masque" : "Visible";

      const del = document.createElement("button");
      del.type = "button";
      del.className = "pmt-custom-item-remove";
      del.textContent = "Supprimer";
      del.addEventListener("click", () => {
        removeCustom(state, btn.id);
        refresh();
      });

      row.append(label, type, del);
      ui.customList.appendChild(row);
    });
  }

  // Raccourci d'appoint : un clic fait la meme chose qu'un glisser vers/depuis la reserve.
  // Pratique au clavier/tactile, et sans conflit avec le drag (qui n'emet pas de click).
  // Les boutons custom (prefixe "pmt_") passent par setCustomHidden plutot que setHidden.
  function bindClickShortcut() {
    const toggle = (el, hidden) => {
      const command = el.getAttribute("data-sceditor-command");
      if (command.indexOf("pmt_") === 0) setCustomHidden(state, command.slice(4), hidden);
      else setHidden(state, command, hidden);
      refresh();
    };
    ui.preview.querySelectorAll(".sceditor-button").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        toggle(el, true);
      });
    });
    ui.reserve.querySelectorAll(".sceditor-button").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        toggle(el, false);
      });
    });
  }

  // Choix du pack.
  ui.packSelect.addEventListener("change", () => {
    setPack(state, ui.packSelect.value);
    populateCustomIconGrid();
    refresh();
  });

  // Grille d'icones des boutons custom : chaque bouton affiche le VRAI glyphe (police du
  // pack chargee independamment de "Appliquer le pack", pour que le picker fonctionne
  // meme si l'utilisateur garde les icones natives sur la toolbar). Plus deux entrees
  // sentinelles (glyphe libre / image perso), rendues en texte plutot qu'en glyphe.
  function populateCustomIconGrid() {
    const pack = getPack(state.iconPack);
    ui.customIconGrid.style.setProperty("--pmt-picker-font", `'${pack.font.family}'`);
    loadPickerFont(pack);

    const previousActive = ui.customIconGrid.querySelector(".active");
    const previousValue = previousActive ? previousActive.dataset.icon : null;
    ui.customIconGrid.innerHTML = "";

    const items = (pack.commonIcons || []).map((name) => ({ value: name, label: name, glyph: true }));
    items.push({ value: ICON_GLYPH_OTHER, label: "Autre...", glyph: false });
    items.push({ value: ICON_IMAGE_URL, label: "Image...", glyph: false });

    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pmt-icon-pick" + (item.glyph ? "" : " pmt-icon-pick-special");
      btn.dataset.icon = item.value;
      btn.title = item.label;
      btn.textContent = item.glyph ? item.value : item.label;
      btn.setAttribute("role", "option");
      btn.addEventListener("click", () => selectIconPick(btn));
      ui.customIconGrid.appendChild(btn);
    });

    const toReselect = (previousValue &&
      [...ui.customIconGrid.children].find((b) => b.dataset.icon === previousValue)
    ) || ui.customIconGrid.firstElementChild;
    if (toReselect) selectIconPick(toReselect);
  }

  function selectIconPick(btn) {
    [...ui.customIconGrid.children].forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-selected", String(b === btn));
    });
    const v = btn.dataset.icon;
    ui.customIconGlyph.hidden = v !== ICON_GLYPH_OTHER;
    ui.customIconUrl.hidden = v !== ICON_IMAGE_URL;
  }

  populateCustomIconGrid();

  ui.applyPack.addEventListener("change", refresh);

  // Reglages : gap, taille des icones (la taille des boutons suit pour ne pas clipper
  // le glyphe), couleur facultative. Slider + champ nombre restent synchronises (l'un
  // ou l'autre pilote la meme valeur).
  syncRangeNumber(ui.gapRange, ui.gapNum, (v) => {
    setStyle(state, "group", "gap", v + "px");
    refresh();
  });

  syncRangeNumber(ui.iconSizeRange, ui.iconSizeNum, (v) => {
    const size = parseInt(v, 10);
    setStyle(state, "icon", "size", size + "px");
    setStyle(state, "button", "size", size + BUTTON_PADDING + "px");
    refresh();
  });

  bindToggleInput(ui.colorEnable, ui.colorInput, (v) => {
    setStyle(state, "button", "color", v);
    refresh();
  });

  bindToggleInput(ui.toolbarBgEnable, ui.toolbarBgInput, (v) => {
    setStyle(state, "toolbar", "bg", v);
    refresh();
  });

  bindToggleInput(ui.groupBgEnable, ui.groupBgInput, (v) => {
    setStyle(state, "group", "bg", v);
    refresh();
  });

  bindToggleInput(ui.iconBgEnable, ui.iconBgInput, (v) => {
    setStyle(state, "button", "bg", v);
    refresh();
  });

  // Bordure : valeur composite (ex. "1px solid #2b2118"), texte libre comme group.border.
  bindToggleInput(ui.toolbarBorderEnable, ui.toolbarBorderInput, (v) => {
    setStyle(state, "toolbar", "border", v);
    refresh();
  });

  bindToggleInput(ui.groupBorderEnable, ui.groupBorderInput, (v) => {
    setStyle(state, "group", "border", v);
    refresh();
  });

  bindToggleInput(ui.iconBorderEnable, ui.iconBorderInput, (v) => {
    setStyle(state, "button", "border", v);
    refresh();
  });

  // Disposition de la toolbar : sens (ligne/colonne), retour a la ligne, largeur max
  // facultative. Le wrap est actif par defaut (socle) ; decocher ecrit l'exception nowrap.
  ui.toolbarDirection.addEventListener("change", () => {
    const v = ui.toolbarDirection.value;
    setStyle(state, "toolbar", "direction", v === "row" ? null : v); // "row" = defaut, rien a ecrire
    refresh();
  });

  ui.wrapToggle.addEventListener("change", () => {
    setStyle(state, "toolbar", "wrap", ui.wrapToggle.checked ? null : "nowrap"); // wrap = defaut
    refresh();
  });

  ui.stickyToggle.addEventListener("change", () => {
    setStyle(state, "toolbar", "sticky", ui.stickyToggle.checked ? true : null); // off = defaut
    refresh();
  });

  bindOptionalRange(ui.maxWidthEnable, ui.maxWidthRange, ui.maxWidthInput, (v) => {
    setStyle(state, "toolbar", "maxWidth", v && v + "px");
    refresh();
  });

  bindOptionalRange(ui.toolbarGapEnable, ui.toolbarGapRange, ui.toolbarGapNum, (v) => {
    setStyle(state, "toolbar", "gap", v && v + "px");
    refresh();
  });

  bindOptionalRange(ui.groupWidthEnable, ui.groupWidthRange, ui.groupWidthNum, (v) => {
    setStyle(state, "group", "width", v && v + "px");
    refresh();
  });

  // Arrondi : container et groupes sont facultatifs (habillage, rien par defaut) ; les
  // icones ont deja un defaut (6px, via la variable --pmt-radius), donc toujours actif.
  bindOptionalRange(ui.toolbarRadiusEnable, ui.toolbarRadiusRange, ui.toolbarRadiusNum, (v) => {
    setStyle(state, "toolbar", "radius", v && v + "px");
    refresh();
  });

  bindOptionalRange(ui.groupRadiusEnable, ui.groupRadiusRange, ui.groupRadiusNum, (v) => {
    setStyle(state, "group", "radius", v && v + "px");
    refresh();
  });

  syncRangeNumber(ui.iconRadiusRange, ui.iconRadiusNum, (v) => {
    setStyle(state, "button", "radius", v + "px");
    refresh();
  });

  // Padding : facultatif sur les 3 niveaux (box-sizing:border-box pose au socle evite
  // qu'il ne fasse deborder la taille fixe des boutons ou la largeur max du container).
  bindOptionalRange(ui.toolbarPaddingEnable, ui.toolbarPaddingRange, ui.toolbarPaddingNum, (v) => {
    setStyle(state, "toolbar", "padding", v && v + "px");
    refresh();
  });

  bindOptionalRange(ui.groupPaddingEnable, ui.groupPaddingRange, ui.groupPaddingNum, (v) => {
    setStyle(state, "group", "padding", v && v + "px");
    refresh();
  });

  bindOptionalRange(ui.iconPaddingEnable, ui.iconPaddingRange, ui.iconPaddingNum, (v) => {
    setStyle(state, "button", "padding", v && v + "px");
    refresh();
  });

  ui.alignButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.align;
      ui.alignButtons.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      setStyle(state, "toolbar", "align", v === "left" ? null : v); // "left" = defaut, rien a ecrire
      refresh();
    });
  });

  // Boutons personnalises : ajout a l'etat. Simple pour l'instant : encadrement
  // avant/apres uniquement (pas de choix de type, l'action JS viendra plus tard).
  ui.customAdd.addEventListener("click", () => {
    const label = ui.customLabel.value.trim();
    if (!label) return; // libelle obligatoire, sinon rien d'identifiable dans la toolbar

    const activePick = ui.customIconGrid.querySelector(".active");
    const iconChoice = activePick ? activePick.dataset.icon : "";
    let icon = iconChoice;
    let iconType = "glyph";
    if (iconChoice === ICON_GLYPH_OTHER) {
      icon = ui.customIconGlyph.value.trim();
    } else if (iconChoice === ICON_IMAGE_URL) {
      icon = ui.customIconUrl.value.trim();
      iconType = "image";
    }

    const payload = { open: ui.customOpen.value, close: ui.customClose.value };

    addCustom(state, { label, icon, iconType, payload });

    ui.customLabel.value = "";
    ui.customIconGlyph.value = "";
    ui.customIconUrl.value = "";
    ui.customOpen.value = "";
    ui.customClose.value = "";
    refresh();
  });

  // Le code est deja tenu a jour en live par refresh() ; le bouton se contente d'afficher
  // ou masquer le panneau (evite de noyer un nouvel utilisateur sous du code d'entree).
  ui.generateBtn.addEventListener("click", () => {
    ui.output.hidden = !ui.output.hidden;
    ui.generateBtn.textContent = ui.output.hidden ? "Afficher le code" : "Masquer le code";
  });

  refresh();
  return { state, refresh };
}

// Construit le squelette de l'interface et renvoie les noeuds utiles.
function buildLayout(root) {
  root.innerHTML = `
    <div class="pmt">
      <header class="pmt-head">
        <h1>Pimp My Toolbar</h1>
        <p class="pmf-tool-sub">Compose ta barre d'outils, recupere le code pret a coller.</p>
      </header>

      <section class="pmt-panel">
        <div class="pmf-tool-row">
          <label>Pack d'icones
            <select id="pmt-pack"></select>
          </label>
          <label class="pmf-tool-check">
            <input type="checkbox" id="pmt-apply-pack" checked>
            Appliquer le pack (sinon icones natives conservees)
          </label>
        </div>
      </section>

      <section class="pmt-panel" id="pmt-settings">
        <h2>Reglages</h2>
        <p class="pmf-tool-hint">Les valeurs par defaut collent a la toolbar native.</p>
        <label class="pmf-tool-check pmf-tool-mode-switch">
          <input type="checkbox" id="pmt-advanced-mode">
          Mode avance
        </label>

        <h3 class="pmt-advanced-only" hidden>Container</h3>
        <div class="pmf-tool-row">
          <label class="pmt-advanced-only" hidden>Disposition
            <select id="pmt-toolbar-direction">
              <option value="row">Ligne</option>
              <option value="column">Colonne</option>
            </select>
          </label>
          <label class="pmf-tool-check">
            <input type="checkbox" id="pmt-wrap" checked>
            Retour a la ligne
          </label>
          <label class="pmf-tool-check">
            <input type="checkbox" id="pmt-sticky">
            Editeur collant au scroll
          </label>
          <div class="pmt-align-group" role="group" aria-label="Alignement">
            <button type="button" class="pmt-align-btn active" data-align="left" title="Aligner a gauche" aria-pressed="true">
              <span style="height:60%"></span><span style="height:40%"></span><span style="height:25%"></span>
            </button>
            <button type="button" class="pmt-align-btn" data-align="center" title="Centrer" aria-pressed="false">
              <span style="height:40%"></span><span style="height:60%"></span><span style="height:25%"></span>
            </button>
            <button type="button" class="pmt-align-btn" data-align="right" title="Aligner a droite" aria-pressed="false">
              <span style="height:25%"></span><span style="height:40%"></span><span style="height:60%"></span>
            </button>
          </div>
        </div>
        <div class="pmf-tool-row pmt-advanced-only" hidden>
          <span class="pmf-tool-inline-group">
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-maxwidth-enable">
              Largeur max
            </label>
            <input type="range" id="pmt-maxwidth-range" min="100" max="1200" step="10" value="400" disabled>
            <input type="number" id="pmt-maxwidth" class="pmf-tool-num" min="100" max="1200" step="10" value="400" disabled> px
          </span>
          <span class="pmf-tool-inline-group">
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-toolbar-gap-enable">
              Gap
            </label>
            <input type="range" id="pmt-toolbar-gap-range" min="0" max="40" step="1" value="8" disabled>
            <input type="number" id="pmt-toolbar-gap" class="pmf-tool-num" min="0" max="40" step="1" value="8" disabled> px
          </span>
          <span class="pmf-tool-inline-group">
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-toolbar-bg-enable">
              Couleur de fond
            </label>
            <input type="color" id="pmt-toolbar-bg" value="#f5efe4" disabled>
          </span>
          <span class="pmf-tool-inline-group">
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-toolbar-radius-enable">
              Arrondi
            </label>
            <input type="range" id="pmt-toolbar-radius-range" min="0" max="40" step="1" value="8" disabled>
            <input type="number" id="pmt-toolbar-radius" class="pmf-tool-num" min="0" max="40" step="1" value="8" disabled> px
          </span>
          <span class="pmf-tool-inline-group">
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-toolbar-padding-enable">
              Padding
            </label>
            <input type="range" id="pmt-toolbar-padding-range" min="0" max="40" step="1" value="8" disabled>
            <input type="number" id="pmt-toolbar-padding" class="pmf-tool-num" min="0" max="40" step="1" value="8" disabled> px
          </span>
          <span class="pmf-tool-inline-group">
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-toolbar-border-enable">
              Bordure
            </label>
            <input type="text" id="pmt-toolbar-border" class="pmf-tool-text" placeholder="1px solid #2b2118" disabled>
          </span>
        </div>

        <h3 class="pmt-advanced-only" hidden>Groupes</h3>
        <div class="pmf-tool-row">
          <label>Espacement
            <input type="range" id="pmt-gap" min="0" max="20" step="1" value="5">
            <input type="number" id="pmt-gap-num" class="pmf-tool-num" min="0" max="20" step="1" value="5"> px
          </label>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-group-width-enable">
              Largeur fixe
            </label>
            <input type="range" id="pmt-group-width-range" min="40" max="400" step="10" value="120" disabled>
            <input type="number" id="pmt-group-width" class="pmf-tool-num" min="40" max="400" step="10" value="120" disabled> px
          </span>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-group-bg-enable">
              Couleur de fond
            </label>
            <input type="color" id="pmt-group-bg" value="#f5efe4" disabled>
          </span>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-group-radius-enable">
              Arrondi
            </label>
            <input type="range" id="pmt-group-radius-range" min="0" max="40" step="1" value="6" disabled>
            <input type="number" id="pmt-group-radius" class="pmf-tool-num" min="0" max="40" step="1" value="6" disabled> px
          </span>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-group-padding-enable">
              Padding
            </label>
            <input type="range" id="pmt-group-padding-range" min="0" max="20" step="1" value="4" disabled>
            <input type="number" id="pmt-group-padding" class="pmf-tool-num" min="0" max="20" step="1" value="4" disabled> px
          </span>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-group-border-enable">
              Bordure
            </label>
            <input type="text" id="pmt-group-border" class="pmf-tool-text" placeholder="1px solid #2b2118" disabled>
          </span>
        </div>

        <h3 class="pmt-advanced-only" hidden>Icones</h3>
        <div class="pmf-tool-row">
          <label>Taille
            <input type="range" id="pmt-icon-size" min="12" max="32" step="1" value="18">
            <input type="number" id="pmt-icon-size-num" class="pmf-tool-num" min="12" max="32" step="1" value="18"> px
          </label>
          <label class="pmf-tool-check">
            <input type="checkbox" id="pmt-color-enable">
            Couleur
          </label>
          <input type="color" id="pmt-color" value="#2b2118" disabled>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-icon-bg-enable">
              Couleur de fond
            </label>
            <input type="color" id="pmt-icon-bg" value="#f5efe4" disabled>
          </span>
          <label class="pmt-advanced-only" hidden>Arrondi
            <input type="range" id="pmt-icon-radius" min="0" max="24" step="1" value="6">
            <input type="number" id="pmt-icon-radius-num" class="pmf-tool-num" min="0" max="24" step="1" value="6"> px
          </label>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-icon-padding-enable">
              Padding
            </label>
            <input type="range" id="pmt-icon-padding-range" min="0" max="16" step="1" value="4" disabled>
            <input type="number" id="pmt-icon-padding" class="pmf-tool-num" min="0" max="16" step="1" value="4" disabled> px
          </span>
          <span class="pmf-tool-inline-group pmt-advanced-only" hidden>
            <label class="pmf-tool-check">
              <input type="checkbox" id="pmt-icon-border-enable">
              Bordure
            </label>
            <input type="text" id="pmt-icon-border" class="pmf-tool-text" placeholder="1px solid #2b2118" disabled>
          </span>
        </div>
      </section>

      <section class="pmt-panel">
        <h2>Ta barre d'outils</h2>
        <p class="pmf-tool-hint">Glisse un bouton pour le deplacer dans son groupe,
           ou vers la reserve pour le masquer. Un clic fait pareil, en plus rapide.</p>
        <div id="pmt-preview" class="pmt-preview"></div>
      </section>

      <section class="pmt-panel">
        <h2>Reserve (boutons masques)</h2>
        <p class="pmf-tool-hint">Glisse un bouton d'ici vers la barre pour le remettre.</p>
        <div id="pmt-reserve" class="pmt-reserve"></div>
      </section>

      <section class="pmt-panel">
        <h2>Boutons personnalises</h2>
        <p class="pmf-tool-hint">Un bouton qui n'existe pas nativement : encadre la
           selection avec le texte "avant" et "apres" donnes.</p>

        <div id="pmt-custom-list" class="pmt-custom-list"></div>

        <div class="pmf-tool-row">
          <label>Libelle
            <input type="text" id="pmt-custom-label" placeholder="Spoiler">
          </label>
        </div>
        <div class="pmf-tool-field">
          <span class="pmf-tool-field-label">Icone</span>
          <div id="pmt-custom-icon-grid" class="pmt-icon-grid" role="listbox" aria-label="Icone"></div>
          <input type="text" id="pmt-custom-icon-glyph" class="pmf-tool-text" placeholder="nom du glyphe (ex: add_circle)" hidden>
          <input type="text" id="pmt-custom-icon-url" class="pmf-tool-text" placeholder="https://.../icone.svg" hidden>
        </div>
        <div class="pmf-tool-row">
          <label>Avant (ouverture)
            <input type="text" id="pmt-custom-open" placeholder="[spoiler]">
          </label>
          <label>Apres (fermeture)
            <input type="text" id="pmt-custom-close" placeholder="[/spoiler]">
          </label>
        </div>
        <button type="button" id="pmt-custom-add" class="pmt-btn">Ajouter le bouton</button>
      </section>

      <section class="pmt-panel">
        <button id="pmt-generate" class="pmt-btn">Afficher le code</button>
      </section>

      <section class="pmt-panel" id="pmt-output" hidden>
        <h2>CSS a coller</h2>
        <p class="pmf-tool-hint">Administration &gt; Affichage &gt; Images et Couleurs &gt; CSS principal.
           Colle ce bloc en haut de ta feuille (il commence par un @import).</p>
        <textarea id="pmt-css" class="pmf-tool-code" rows="14" readonly></textarea>

        <h2>JS a coller</h2>
        <p class="pmf-tool-hint">Modules &gt; HTML &amp; JAVASCRIPT &gt; Gestion des codes Javascript
           (placement : toutes les pages). Uniquement si tu as des boutons personnalises.</p>
        <textarea id="pmt-js" class="pmf-tool-code" rows="12" readonly></textarea>
      </section>
    </div>
  `;

  const packSelect = root.querySelector("#pmt-pack");
  Object.values(PACKS).forEach((p) => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name;
    packSelect.appendChild(o);
  });

  return {
    preview: root.querySelector("#pmt-preview"),
    reserve: root.querySelector("#pmt-reserve"),
    packSelect,
    applyPack: root.querySelector("#pmt-apply-pack"),
    advancedMode: root.querySelector("#pmt-advanced-mode"),
    gapRange: root.querySelector("#pmt-gap"),
    gapNum: root.querySelector("#pmt-gap-num"),
    iconSizeRange: root.querySelector("#pmt-icon-size"),
    iconSizeNum: root.querySelector("#pmt-icon-size-num"),
    colorEnable: root.querySelector("#pmt-color-enable"),
    colorInput: root.querySelector("#pmt-color"),
    toolbarDirection: root.querySelector("#pmt-toolbar-direction"),
    wrapToggle: root.querySelector("#pmt-wrap"),
    stickyToggle: root.querySelector("#pmt-sticky"),
    maxWidthEnable: root.querySelector("#pmt-maxwidth-enable"),
    maxWidthRange: root.querySelector("#pmt-maxwidth-range"),
    maxWidthInput: root.querySelector("#pmt-maxwidth"),
    toolbarGapEnable: root.querySelector("#pmt-toolbar-gap-enable"),
    toolbarGapRange: root.querySelector("#pmt-toolbar-gap-range"),
    toolbarGapNum: root.querySelector("#pmt-toolbar-gap"),
    groupWidthEnable: root.querySelector("#pmt-group-width-enable"),
    groupWidthRange: root.querySelector("#pmt-group-width-range"),
    groupWidthNum: root.querySelector("#pmt-group-width"),
    alignButtons: [...root.querySelectorAll(".pmt-align-btn")],
    toolbarBgEnable: root.querySelector("#pmt-toolbar-bg-enable"),
    toolbarBgInput: root.querySelector("#pmt-toolbar-bg"),
    groupBgEnable: root.querySelector("#pmt-group-bg-enable"),
    groupBgInput: root.querySelector("#pmt-group-bg"),
    iconBgEnable: root.querySelector("#pmt-icon-bg-enable"),
    iconBgInput: root.querySelector("#pmt-icon-bg"),
    toolbarRadiusEnable: root.querySelector("#pmt-toolbar-radius-enable"),
    toolbarRadiusRange: root.querySelector("#pmt-toolbar-radius-range"),
    toolbarRadiusNum: root.querySelector("#pmt-toolbar-radius"),
    groupRadiusEnable: root.querySelector("#pmt-group-radius-enable"),
    groupRadiusRange: root.querySelector("#pmt-group-radius-range"),
    groupRadiusNum: root.querySelector("#pmt-group-radius"),
    iconRadiusRange: root.querySelector("#pmt-icon-radius"),
    iconRadiusNum: root.querySelector("#pmt-icon-radius-num"),
    toolbarPaddingEnable: root.querySelector("#pmt-toolbar-padding-enable"),
    toolbarPaddingRange: root.querySelector("#pmt-toolbar-padding-range"),
    toolbarPaddingNum: root.querySelector("#pmt-toolbar-padding"),
    groupPaddingEnable: root.querySelector("#pmt-group-padding-enable"),
    groupPaddingRange: root.querySelector("#pmt-group-padding-range"),
    groupPaddingNum: root.querySelector("#pmt-group-padding"),
    iconPaddingEnable: root.querySelector("#pmt-icon-padding-enable"),
    iconPaddingRange: root.querySelector("#pmt-icon-padding-range"),
    iconPaddingNum: root.querySelector("#pmt-icon-padding"),
    toolbarBorderEnable: root.querySelector("#pmt-toolbar-border-enable"),
    toolbarBorderInput: root.querySelector("#pmt-toolbar-border"),
    groupBorderEnable: root.querySelector("#pmt-group-border-enable"),
    groupBorderInput: root.querySelector("#pmt-group-border"),
    iconBorderEnable: root.querySelector("#pmt-icon-border-enable"),
    iconBorderInput: root.querySelector("#pmt-icon-border"),
    customList: root.querySelector("#pmt-custom-list"),
    customLabel: root.querySelector("#pmt-custom-label"),
    customIconGrid: root.querySelector("#pmt-custom-icon-grid"),
    customIconGlyph: root.querySelector("#pmt-custom-icon-glyph"),
    customIconUrl: root.querySelector("#pmt-custom-icon-url"),
    customOpen: root.querySelector("#pmt-custom-open"),
    customClose: root.querySelector("#pmt-custom-close"),
    customAdd: root.querySelector("#pmt-custom-add"),
    generateBtn: root.querySelector("#pmt-generate"),
    output: root.querySelector("#pmt-output"),
    cssOut: root.querySelector("#pmt-css"),
    jsOut: root.querySelector("#pmt-js")
  };
}
