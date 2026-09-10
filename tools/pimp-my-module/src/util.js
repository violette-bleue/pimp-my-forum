// Petites fonctions partagees.

// el('div', { class: 'x', onclick: fn }, enfant, enfant...)
export function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Texte brut d'une balise source, en rattrapant ce que l'editeur du forum a
// pu y ajouter. Un <textarea> enfant est pris tel quel : son contenu est du
// texte pour le parseur HTML, rien n'y a ete transforme.
export function readSource(node) {
  if (!node) return '';
  const ta = node.querySelector('textarea');
  if (ta) {
    // Si l'editeur a aplati le textarea, ses retours a la ligne sont devenus
    // des « <br /> » litteraux.
    return trimLines(ta.value.replace(/<br\s*\/?>/gi, '\n'));
  }
  const clone = node.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  clone.querySelectorAll('div, p, li').forEach((b) => b.append('\n'));
  return trimLines(
    clone.textContent
      .replace(/ /g, ' ')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'"),
  );
}

function trimLines(s) {
  return s.replace(/\r\n?/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '');
}

// Copie dans le presse-papiers, avec repli sur la selection du champ.
export function copyText(text, field) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  field.focus();
  field.select();
  try { document.execCommand('copy'); } catch (e) { /* tant pis */ }
  return Promise.resolve();
}
