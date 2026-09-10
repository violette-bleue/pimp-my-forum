// Mise en forme des sources, pour que le code produit soit lisible meme si
// l'editeur du forum a mange l'indentation.

const TAB = '  ';

// CSS : une declaration par ligne, blocs indentes, ligne vide entre les
// regles de premier niveau. Les commentaires sont gardes sur leur ligne.
export function formatCss(src) {
  let out = '';
  let depth = 0;
  let paren = 0;
  let lineStart = true;
  const n = src.length;

  const trimEnd = () => { out = out.replace(/\s+$/, ''); };
  const newline = () => { trimEnd(); if (out) out += '\n'; lineStart = true; };
  const put = (s) => {
    if (lineStart) { out += TAB.repeat(depth); lineStart = false; }
    out += s;
  };

  let i = 0;
  while (i < n) {
    const c = src[i];

    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const comment = src.slice(i, end < 0 ? n : end + 2);
      if (!lineStart) newline();
      put(comment);
      newline();
      i += comment.length;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      put(src.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === '(') paren++;
    if (c === ')') paren = Math.max(0, paren - 1);

    if (paren === 0) {
      if (c === '{') { trimEnd(); out += ' {'; depth++; newline(); i++; continue; }
      if (c === '}') {
        depth = Math.max(0, depth - 1);
        newline();
        put('}');
        newline();
        if (depth === 0) out += '\n';
        i++;
        continue;
      }
      if (c === ';') { trimEnd(); out += ';'; newline(); i++; continue; }
    }
    if (/\s/.test(c)) {
      if (!lineStart && !/\s$/.test(out)) out += ' ';
      i++;
      continue;
    }
    put(c);
    i++;
  }
  return out
    .split('\n')
    .map(tidyDeclaration)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

// « color:red » devient « color: red; », « a,b » devient « a, b » hors
// parentheses. Les selecteurs et les commentaires ne sont pas touches.
function tidyDeclaration(line) {
  const m = line.match(/^(\s*)([\w-]+)\s*:\s*(.*)$/);
  if (!m || /[{}]\s*$/.test(line) || /^\s*\/\*/.test(line)) return line;
  let value = '';
  let paren = 0;
  let str = null;
  for (const c of m[3]) {
    if (str) { value += c; if (c === str) str = null; continue; }
    if (c === '"' || c === "'") { str = c; value += c; continue; }
    if (c === '(') paren++;
    if (c === ')') paren = Math.max(0, paren - 1);
    value += c;
    if (c === ',' && paren === 0) value += ' ';
  }
  value = value.replace(/\s+/g, ' ').trim();
  if (!value.endsWith(';')) value += ';';
  return `${m[1]}${m[2]}: ${value}`;
}

// JavaScript : les retours a la ligne sont conserves, seule l'indentation est
// recalculee d'apres la profondeur des { ( [ — une ligne ne compte que pour
// un niveau, quel que soit le nombre de crochets ouverts. Si la source etait deja
// indentee, le retrait supplementaire d'une ligne de continuation (par
// rapport a la premiere ligne de son bloc) est garde.
export function reindentJs(src) {
  const lines = src.split('\n');
  const out = [];
  let depth = 0;
  let inBlockComment = false;
  const base = [];   // retrait d'origine de la premiere ligne vue a chaque niveau
  let entered = true;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { out.push(''); continue; }
    const origIndent = raw.match(/^[ \t]*/)[0].replace(/\t/g, TAB).length;
    const startsInComment = inBlockComment;

    let open = 0;
    let close = 0;
    let leadClose = 0;
    let seenCode = false;
    let str = null;
    let i = 0;
    while (i < line.length) {
      const c = line[i];
      const d = line[i + 1];
      if (inBlockComment) {
        if (c === '*' && d === '/') { inBlockComment = false; i += 2; } else i++;
        continue;
      }
      if (str) {
        if (c === '\\') { i += 2; continue; }
        if (c === str) str = null;
        i++;
        continue;
      }
      if (c === '/' && d === '/') break;
      if (c === '/' && d === '*') { inBlockComment = true; i += 2; continue; }
      if (c === '"' || c === "'" || c === '`') { str = c; seenCode = true; i++; continue; }
      if (c === '{' || c === '(' || c === '[') { open++; seenCode = true; }
      else if (c === '}' || c === ')' || c === ']') { close++; if (!seenCode) leadClose++; }
      else if (!/\s/.test(c)) seenCode = true;
      i++;
    }

    const level = Math.max(0, depth - (leadClose ? 1 : 0));
    if (entered || base[level] == null) base[level] = origIndent;
    const extra = Math.max(0, origIndent - base[level]);
    const prefix = startsInComment && line.startsWith('*') ? ' ' : '';
    out.push(TAB.repeat(level) + ' '.repeat(extra) + prefix + line);

    const next = Math.max(0, depth + Math.sign(open - close));
    entered = next > depth;
    depth = next;
  }
  return out.join('\n');
}
