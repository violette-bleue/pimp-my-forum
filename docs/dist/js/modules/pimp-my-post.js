/* modules/pimp-my-post.js — "Pimp My Post" : formulaire assiste au-dessus de l'editeur.
   Lit/ecrit le HTML via l'instance CodeMirror du module sceditor-highlight (source de verite
   unique : CM sync deja vers le champ POST). Bascule code <-> formulaire.

   Convention (declaree par l'auteur du template) :
     data-input="href target text"  -> liste des cibles editables ; "text" = textContent
     fillable                       -> sucre pour data-input="text"
     data-label="..."               -> en-tete humain du groupe (l'element)
     data-label-text="..."          -> intitule du champ texte (defaut "Contenu")

   NOTE : ce squelette pose la detection, la passerelle CM et la bascule. Le parsing
   data-input / la generation des champs arrivent dans une 2e etape. */

export function init() {
  const orig = document.getElementById("text_editor_textarea");
  if (!orig) return;
  const container = orig.nextElementSibling;
  if (!container || !container.classList.contains("sceditor-container")) return;

  // Attend que le module sceditor-highlight ait monte son instance CM (chargement parallele).
  let tries = 0;
  const timer = setInterval(() => {
    if (container._pnpCM) {
      clearInterval(timer);
      setup(container, container._pnpCM);
    } else if (++tries > 60) {
      clearInterval(timer); // ~18s : le module 1 n'est pas la, on abandonne
    }
  }, 300);
}

function setup(container, cm) {
  if (container._pnpPmpDone) return;
  container._pnpPmpDone = true;

  const host = cm.getWrapperElement().closest(".pnp-cm-host") || cm.getWrapperElement().parentNode;

  // Panneau formulaire (vide pour l'instant), masque par defaut.
  const panel = document.createElement("div");
  panel.className = "pnp-pmp-panel";
  panel.style.display = "none";
  host.parentNode.insertBefore(panel, host.nextSibling);

  // Bouton bascule code <-> formulaire.
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pnp-pmp-toggle button2";
  toggle.textContent = "Pimp My Post";
  host.parentNode.insertBefore(toggle, host);

  let formMode = false;
  toggle.addEventListener("click", () => {
    formMode = !formMode;
    if (formMode) {
      buildForm(panel, cm);
      host.style.display = "none";
      panel.style.display = "";
      toggle.textContent = "← Revenir au code";
    } else {
      host.style.display = "";
      panel.style.display = "none";
      cm.refresh();
      toggle.textContent = "Pimp My Post";
    }
  });
}

// Etape 2 : parsera cm.getValue() pour les data-input/fillable et generera les champs.
function buildForm(panel, cm) {
  panel.innerHTML = "";
  const info = document.createElement("p");
  info.className = "pnp-pmp-empty";
  info.textContent = "(squelette) Les champs generes a partir des data-input apparaitront ici.";
  panel.appendChild(info);
}
