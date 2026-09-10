// Point d'entree : a chaque <pmf-module> de la page, lit ses balises sources
// et monte un generateur a sa place.
//
//   <pmf-module id="infobulle">
//     <pmf-init>  ... declarations des tokens ...  </pmf-init>
//     <pmf-style> ... CSS avec %%tokens%% ...       </pmf-style>
//     <pmf-js>    ... JS avec %%tokens%% ...        </pmf-js>
//     <pmf-demo>  ... HTML de demonstration ...     </pmf-demo>
//   </pmf-module>
//
// Si l'editeur du forum filtre les balises inconnues, les equivalents en
// attributs fonctionnent : <div data-pmf="style">...</div>.
import { injectStyles } from './styles.js';
import { parseInit } from './dsl.js';
import { readSource } from './util.js';
import { formatCss, reindentJs } from './format.js';
import { mount } from './panel.js';

const FLAG = '__pimpMyModule';

if (!window[FLAG]) {
  window[FLAG] = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

function boot() {
  injectStyles();
  document.querySelectorAll('pmf-module, [data-pmf="module"]').forEach(mountModule);
}

let counter = 0;

function mountModule(node) {
  if (node.pmfMounted) return;
  node.pmfMounted = true;

  // L'editeur du forum seme des <br> entre les balises sources : ils
  // laisseraient des lignes vides au-dessus du generateur.
  node.querySelectorAll(':scope > br').forEach((br) => br.remove());

  const all = (kind) => [...node.querySelectorAll(`pmf-${kind}, [data-pmf="${kind}"]`)];
  const text = (kind) => all(kind).map(readSource).join('\n');

  const spec = parseInit(text('init'));
  const demoNodes = all('demo');
  const demoNode = demoNodes[0];
  const id = node.id || spec.meta.id || `module-${++counter}`;

  try {
    mount(node, {
      id,
      spec,
      sources: {
        css: formatCss(text('style')),
        js: reindentJs(text('js')),
        // Le HTML de demo est pris tel quel, balises comprises.
        html: demoNodes.map((d) => d.innerHTML.trim()).join('\n'),
      },
      demo: {
        bg: attr(demoNode, 'bg'),
        height: attr(demoNode, 'height'),
        bodyClass: attr(demoNode, 'body-class'),
        deps: (attr(demoNode, 'deps') || '').split(/[\s,]+/).filter(Boolean),
      },
    });
  } catch (e) {
    console.error('[pmf] impossible de monter le module', id, e);
    node.append(Object.assign(document.createElement('div'), {
      className: 'pmf-alert --error',
      textContent: `[pmf] Le module « ${id} » n'a pas pu etre monte : ${e.message}`,
    }));
  }
}

function attr(node, name) {
  return node ? node.getAttribute(name) || node.getAttribute(`data-${name}`) : null;
}
