// Demo live : une iframe about:blank, same-origin, dans laquelle on ecrit un
// vrai document. Le module y a son propre `document`, son propre `window` et,
// au besoin, son propre jQuery ; son CSS n'atteint pas le forum et inversement.
import { el } from './util.js';

const DEPS = {
  jquery: 'https://code.jquery.com/jquery-3.7.1.min.js',
  jquery3: 'https://code.jquery.com/jquery-3.7.1.min.js',
  jquery1: 'https://code.jquery.com/jquery-1.12.4.min.js',
};

// Une balise fermante dans une source casserait le document ecrit.
const safe = (code) => code.replace(/<\/(script|style)/gi, '<\\/$1');
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
// Le loader lui-meme est injecte inline par le forum : il ne doit contenir
// nulle part la sequence litterale d'une balise script fermante.
const close = (tag) => '</' + tag + '>';

export function createSandbox(opts) {
  const frame = el('iframe', { class: 'pmf-frame', scrolling: 'no' });
  if (opts.height) frame.style.height = /^\d+$/.test(opts.height) ? `${opts.height}px` : opts.height;
  const deps = (opts.deps || []).map((d) => DEPS[d.toLowerCase()] || d);

  let onError = () => {};
  let observer = null;

  // Hauteur du contenu, pas du viewport : scrollHeight ne redescendrait
  // jamais sous la hauteur courante de l'iframe.
  function fit() {
    const doc = frame.contentDocument;
    if (doc && doc.documentElement) frame.style.height = `${doc.documentElement.offsetHeight}px`;
  }

  return {
    frame,
    onError(fn) { onError = fn; },

    // Reecrit tout le document : CSS, HTML de demo et script.
    render({ css, js, html }) {
      const doc = frame.contentDocument;
      if (!doc) return;
      if (observer) { observer.disconnect(); observer = null; }

      const head = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0}body{padding:12px;background:${opts.bg || 'transparent'};font:14px/1.5 sans-serif;overflow:hidden}${close('style')}
<style id="pmf-style">${safe(css)}${close('style')}
<script>window.onerror=function(m,s,l){try{frameElement.pmfError(m,l)}catch(e){}};${close('script')}
${deps.map((u) => `<script src="${escAttr(u)}">${close('script')}`).join('\n')}
</head><body${opts.bodyClass ? ` class="${escAttr(opts.bodyClass)}"` : ''}>${html}
<script>`;
      // Numero de la premiere ligne du script dans le document, pour que les
      // erreurs remontent avec une ligne relative a la source.
      const offset = head.split('\n').length - 1;
      frame.pmfError = (msg, line) => onError(msg, line ? line - offset : null);

      doc.open();
      doc.write(`${head}${safe(js)}\n${close('script')}${close('body')}${close('html')}`);
      doc.close();

      if (!opts.height) {
        fit();
        const win = frame.contentWindow;
        if (win.ResizeObserver) {
          observer = new win.ResizeObserver(fit);
          observer.observe(doc.documentElement);
        }
        win.addEventListener('load', fit);
      }
    },

    // Remplace seulement la feuille de style : l'etat du module est conserve.
    patchCss(css) {
      const doc = frame.contentDocument;
      const style = doc && doc.getElementById('pmf-style');
      if (!style) return false;
      style.textContent = css;
      return true;
    },
  };
}
