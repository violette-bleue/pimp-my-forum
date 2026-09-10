// Mini-langage de <pmf-init>.
//
//   @name Infobulle                     metadonnee (@name, @description, @id)
//   [Apparence]                         onglet
//   (Couleurs)                          container : une carte dans l'onglet courant
//   fond = color[#fff] # Fond | aide    declaration de token
//   // remarque                         commentaire
//
// Ligne de declaration :
//   nom = type[defaut]unite(parametres) @css @js @html  # Libelle | aide
// Tout est optionnel sauf nom, type et la valeur entre crochets.

const TYPES = {
  color: 'color', couleur: 'color',
  range: 'range', slider: 'range', curseur: 'range',
  number: 'number', nombre: 'number',
  text: 'text', texte: 'text',
  textarea: 'textarea', zone: 'textarea',
  select: 'select', liste: 'select',
  bool: 'bool', boolean: 'bool', check: 'bool', switch: 'bool',
  font: 'font', police: 'font',
  url: 'url', lien: 'url',
};

const DECL = /^([A-Za-z_][\w-]*)\s*=\s*([a-zA-Z]+)\s*\[(.*?)\]\s*([a-zA-Z%]*)\s*(?:\((.*?)\))?\s*((?:@\w+\s*)*)(?:#\s*(.*))?$/;

export function parseInit(text) {
  const spec = { meta: {}, tabs: [], tokens: {}, errors: [] };
  let tab = null;
  let group = null;

  const openTab = (label) => {
    tab = { label, groups: [] };
    group = null;
    spec.tabs.push(tab);
  };
  const openGroup = (label) => {
    if (!tab) openTab('Reglages');
    group = { label, tokens: [] };
    tab.groups.push(group);
  };

  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    const n = i + 1;
    if (!line || line.startsWith('//') || line.startsWith('#')) return;
    let m;
    if ((m = line.match(/^@(\w+)\s*(.*)$/))) { spec.meta[m[1].toLowerCase()] = m[2].trim(); return; }
    if ((m = line.match(/^\[(.+)\]$/))) { openTab(m[1].trim()); return; }
    if ((m = line.match(/^\((.+)\)$/))) { openGroup(m[1].trim()); return; }
    if ((m = line.match(DECL))) {
      const def = buildToken(m, spec.errors, n);
      if (!def) return;
      if (spec.tokens[def.name]) spec.errors.push(`Ligne ${n} : le token « ${def.name} » est declare deux fois, la derniere declaration l'emporte.`);
      spec.tokens[def.name] = def;
      if (!group) openGroup('General');
      group.tokens = group.tokens.filter((t) => t.name !== def.name);
      group.tokens.push(def);
      return;
    }
    spec.errors.push(`Ligne ${n} incomprise : « ${line} »`);
  });

  return spec;
}

function buildToken([, name, rawType, def, unit, params, targets, comment], errors, n) {
  const type = TYPES[rawType.toLowerCase()];
  if (!type) { errors.push(`Ligne ${n} : type inconnu « ${rawType} »`); return null; }

  const [label, help] = (comment || '').split('|').map((s) => s.trim());
  const t = {
    name, type,
    default: def.trim(),
    unit: unit || '',
    label: label || name,
    help: help || '',
    targets: [...(targets || '').matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase()),
  };
  const p = (params || '').trim();
  const list = (sep) => p.split(sep).map((s) => s.trim()).filter(Boolean);

  switch (type) {
    case 'color':
      t.palette = list(',');
      break;
    case 'range':
    case 'number': {
      const m = p.match(/^(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*(?::\s*(-?[\d.]+))?$/);
      if (p && !m) errors.push(`Ligne ${n} : bornes illisibles « (${p}) », attendu (min..max:pas)`);
      t.min = m ? +m[1] : 0;
      t.max = m ? +m[2] : 100;
      t.step = m && m[3] ? +m[3] : 1;
      break;
    }
    case 'select':
      t.options = list(',').map((s) => {
        const i = s.indexOf('=');
        return i < 0 ? { value: s, label: s } : { value: s.slice(0, i).trim(), label: s.slice(i + 1).trim() };
      });
      if (!t.options.length) errors.push(`Ligne ${n} : la liste « ${name} » n'a aucune option`);
      break;
    case 'bool': {
      const [on, off] = p ? p.split('|') : ['true', 'false'];
      t.on = on.trim();
      t.off = (off || '').trim();
      t.default = /^(on|true|1|oui|yes|vrai)$/i.test(t.default) ? 'on' : 'off';
      break;
    }
    case 'font':
      t.stacks = list(';');
      if (t.stacks.length && !t.stacks.includes(t.default)) t.stacks.unshift(t.default);
      break;
    default:
      break;
  }
  return t;
}
