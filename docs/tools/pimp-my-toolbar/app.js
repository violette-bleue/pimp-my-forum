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

import { createInitialState, setHidden, setPack } from "./core/state.js";
import { generate } from "./core/generator.js";
import { renderPreview, renderReserve, applyGeneratedCss } from "./ui/preview.js";
import { PACKS } from "./data/packs.js";

export function mount(root) {
  if (!root) return;

  const state = createInitialState();
  const ui = buildLayout(root);

  // Rafraichit apercu + reserve depuis l'etat, et applique le CSS courant a l'apercu.
  function refresh() {
    renderPreview(ui.preview, state);
    renderReserve(ui.reserve, state);
    // L'apercu se restyle en direct avec le CSS qui serait genere (hors blocs non visuels).
    applyGeneratedCss(generate(state, { applyPack: ui.applyPack.checked }).css);
    bindButtonClicks();
  }

  // Interaction minimale en attendant le drag & drop : clic sur un bouton = masquer/reafficher.
  function bindButtonClicks() {
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
        <h2>Ta barre d'outils</h2>
        <p class="pmt-hint">Clique un bouton pour le mettre en reserve.</p>
        <div id="pmt-preview" class="pmt-preview"></div>
      </section>

      <section class="pmt-panel">
        <h2>Reserve (boutons masques)</h2>
        <p class="pmt-hint">Clique un bouton pour le remettre dans la barre.</p>
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
    generateBtn: root.querySelector("#pmt-generate"),
    output: root.querySelector("#pmt-output"),
    cssOut: root.querySelector("#pmt-css"),
    jsOut: root.querySelector("#pmt-js")
  };
}
