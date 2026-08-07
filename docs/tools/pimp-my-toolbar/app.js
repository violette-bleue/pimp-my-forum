/* pimp-my-toolbar/app.js
   Point d'entree de l'outil. Assemble le cycle :

     INTERFACE  --edite-->  ETAT  --serialise-->  CSS + JS
         |                    |
         +---- apercu <-------+

   L'etat est la source de verite unique : l'apercu le lit, le generateur le serialise.
   Aucune divergence possible entre ce que l'utilisateur voit et le code produit.

   Utilisation depuis la page HTML (ForumActif ou autre) :
     <div id="pmt-app"></div>
     <script type="module">
       import { mount } from "<base>/tools/pimp-my-toolbar/app.js";
       mount(document.getElementById("pmt-app"));
     </script>
*/

import { createInitialState, setHidden, setPack, setStyle } from "./core/state.js";
import { generate } from "./core/generator.js";
import { renderPreview, renderReserve, applyGeneratedCss } from "./ui/preview.js";
import { bindDnd } from "./ui/dnd.js";
import { PACKS } from "./data/packs.js";

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

export function mount(root) {
  if (!root) return;

  const state = createInitialState();
  const ui = buildLayout(root);

  // Rafraichit apercu + reserve depuis l'etat, applique le CSS courant, rebranche les
  // interactions. Le DOM etant reconstruit a chaque passage, les ecouteurs doivent l'etre
  // aussi : c'est le prix de "l'apercu est une vue pure de l'etat", et il est modique.
  function refresh() {
    renderPreview(ui.preview, state);
    renderReserve(ui.reserve, state);
    applyGeneratedCss(generate(state, { applyPack: ui.applyPack.checked }).css);

    bindDnd({
      previewHost: ui.preview,
      reserveHost: ui.reserve,
      state,
      onChange: refresh
    });
    bindClickShortcut();
  }

  // Raccourci d'appoint : un clic fait la meme chose qu'un glisser vers/depuis la reserve.
  // Pratique au clavier/tactile, et sans conflit avec le drag (qui n'emet pas de click).
  function bindClickShortcut() {
    ui.preview.querySelectorAll(".sceditor-button").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        setHidden(state, el.getAttribute("data-sceditor-command"), true);
        refresh();
      });
    });
    ui.reserve.querySelectorAll(".sceditor-button").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        setHidden(state, el.getAttribute("data-sceditor-command"), false);
        refresh();
      });
    });
  }

  // Choix du pack.
  ui.packSelect.addEventListener("change", () => {
    setPack(state, ui.packSelect.value);
    refresh();
  });

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

  ui.colorEnable.addEventListener("change", () => {
    ui.colorInput.disabled = !ui.colorEnable.checked;
    setStyle(state, "button", "color", ui.colorEnable.checked ? ui.colorInput.value : null);
    refresh();
  });

  ui.colorInput.addEventListener("input", () => {
    if (!ui.colorEnable.checked) return;
    setStyle(state, "button", "color", ui.colorInput.value);
    refresh();
  });

  // Disposition de la toolbar : sens (ligne/colonne) et largeur max facultative. Le repli
  // multi-lignes (flex-wrap) est lui toujours actif, genere sans reglage associe.
  ui.toolbarDirection.addEventListener("change", () => {
    const v = ui.toolbarDirection.value;
    setStyle(state, "toolbar", "direction", v === "row" ? null : v); // "row" = defaut, rien a ecrire
    refresh();
  });

  ui.maxWidthEnable.addEventListener("change", () => {
    const on = ui.maxWidthEnable.checked;
    ui.maxWidthRange.disabled = !on;
    ui.maxWidthInput.disabled = !on;
    setStyle(state, "toolbar", "maxWidth", on ? ui.maxWidthInput.value + "px" : null);
    refresh();
  });

  syncRangeNumber(ui.maxWidthRange, ui.maxWidthInput, (v) => {
    if (!ui.maxWidthEnable.checked) return;
    setStyle(state, "toolbar", "maxWidth", v + "px");
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

  // Generation explicite (bouton) : remplit les deux zones de code.
  ui.generateBtn.addEventListener("click", () => {
    const out = generate(state, { applyPack: ui.applyPack.checked });
    ui.cssOut.value = out.css;
    ui.jsOut.value = out.js || "/* Aucun bouton personnalise : pas de JS necessaire. */";
    ui.output.hidden = false;
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
        <p class="pmt-sub">Compose ta barre d'outils, recupere le code pret a coller.</p>
      </header>

      <section class="pmt-panel">
        <div class="pmt-row">
          <label>Pack d'icones
            <select id="pmt-pack"></select>
          </label>
          <label class="pmt-check">
            <input type="checkbox" id="pmt-apply-pack" checked>
            Appliquer le pack (sinon icones natives conservees)
          </label>
        </div>
      </section>

      <section class="pmt-panel">
        <h2>Reglages</h2>
        <p class="pmt-hint">Espacement et taille des boutons. Les valeurs par defaut
           collent a la toolbar native.</p>
        <div class="pmt-row">
          <label>Espacement
            <input type="range" id="pmt-gap" min="0" max="20" step="1" value="5">
            <input type="number" id="pmt-gap-num" class="pmt-num" min="0" max="20" step="1" value="5"> px
          </label>
          <label>Taille des icones
            <input type="range" id="pmt-icon-size" min="12" max="32" step="1" value="18">
            <input type="number" id="pmt-icon-size-num" class="pmt-num" min="12" max="32" step="1" value="18"> px
          </label>
          <label class="pmt-check">
            <input type="checkbox" id="pmt-color-enable">
            Couleur des icones
          </label>
          <input type="color" id="pmt-color" value="#2b2118" disabled>
        </div>
        <div class="pmt-row">
          <label>Disposition
            <select id="pmt-toolbar-direction">
              <option value="row">Ligne</option>
              <option value="column">Colonne</option>
            </select>
          </label>
          <label class="pmt-check">
            <input type="checkbox" id="pmt-maxwidth-enable">
            Largeur max
          </label>
          <input type="range" id="pmt-maxwidth-range" min="100" max="1200" step="10" value="400" disabled>
          <input type="number" id="pmt-maxwidth" class="pmt-num" min="100" max="1200" step="10" value="400" disabled> px
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
      </section>

      <section class="pmt-panel">
        <h2>Ta barre d'outils</h2>
        <p class="pmt-hint">Glisse un bouton pour le deplacer dans son groupe,
           ou vers la reserve pour le masquer. Un clic fait pareil, en plus rapide.</p>
        <div id="pmt-preview" class="pmt-preview"></div>
      </section>

      <section class="pmt-panel">
        <h2>Reserve (boutons masques)</h2>
        <p class="pmt-hint">Glisse un bouton d'ici vers la barre pour le remettre.</p>
        <div id="pmt-reserve" class="pmt-reserve"></div>
      </section>

      <section class="pmt-panel">
        <button id="pmt-generate" class="pmt-btn">Generer le code</button>
      </section>

      <section class="pmt-panel" id="pmt-output" hidden>
        <h2>CSS a coller</h2>
        <p class="pmt-hint">Administration &gt; Affichage &gt; Images et Couleurs &gt; CSS principal.
           Colle ce bloc en haut de ta feuille (il commence par un @import).</p>
        <textarea id="pmt-css" class="pmt-code" rows="14" readonly></textarea>

        <h2>JS a coller</h2>
        <p class="pmt-hint">Modules &gt; HTML &amp; JAVASCRIPT &gt; Gestion des codes Javascript
           (placement : toutes les pages). Uniquement si tu as des boutons personnalises.</p>
        <textarea id="pmt-js" class="pmt-code" rows="12" readonly></textarea>
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
    gapRange: root.querySelector("#pmt-gap"),
    gapNum: root.querySelector("#pmt-gap-num"),
    iconSizeRange: root.querySelector("#pmt-icon-size"),
    iconSizeNum: root.querySelector("#pmt-icon-size-num"),
    colorEnable: root.querySelector("#pmt-color-enable"),
    colorInput: root.querySelector("#pmt-color"),
    toolbarDirection: root.querySelector("#pmt-toolbar-direction"),
    maxWidthEnable: root.querySelector("#pmt-maxwidth-enable"),
    maxWidthRange: root.querySelector("#pmt-maxwidth-range"),
    maxWidthInput: root.querySelector("#pmt-maxwidth"),
    alignButtons: [...root.querySelectorAll(".pmt-align-btn")],
    generateBtn: root.querySelector("#pmt-generate"),
    output: root.querySelector("#pmt-output"),
    cssOut: root.querySelector("#pmt-css"),
    jsOut: root.querySelector("#pmt-js")
  };
}
