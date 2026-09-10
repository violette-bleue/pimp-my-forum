// Substitution des tokens %%nom%% et %%nom|filtre%% dans les sources.

const TOKEN = /%%([A-Za-z_][\w-]*)(?:\|([a-z]+))?%%/g;

const FILTERS = {
  json: (v) => JSON.stringify(v),
  quote: (v) => JSON.stringify(v),
  upper: (v) => v.toUpperCase(),
  lower: (v) => v.toLowerCase(),
  trim: (v) => v.trim(),
  raw: (v) => v,
};

// Valeur telle qu'elle est ecrite dans le code produit.
export function outputValue(def, value) {
  switch (def.type) {
    case 'range':
    case 'number':
      return String(value) + def.unit;
    case 'bool':
      return value === 'on' ? def.on : def.off;
    default:
      return String(value);
  }
}

// Remplace les tokens de `source`. Un token inconnu, un filtre inconnu ou un
// token reserve a une autre cible (@css, @js, @html) reste en place ; les
// deux premiers sont ajoutes a `unknown`.
export function render(source, kind, defs, values, unknown) {
  return source.replace(TOKEN, (all, name, filter) => {
    const def = defs[name];
    if (!def) { if (unknown) unknown.add(name); return all; }
    if (def.targets.length && !def.targets.includes(kind)) return all;
    const f = filter ? FILTERS[filter] : null;
    if (filter && !f) { if (unknown) unknown.add(`${name}|${filter}`); return all; }
    const v = outputValue(def, values[name] != null ? values[name] : def.default);
    return f ? f(v) : v;
  });
}

// Noms des tokens presents dans une source.
export function tokensIn(source) {
  const s = new Set();
  for (const m of source.matchAll(TOKEN)) s.add(m[1]);
  return s;
}
