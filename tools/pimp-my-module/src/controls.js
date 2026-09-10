// Un controle de formulaire par type de token.
// Chaque fabrique rend { root, set(valeur) } et appelle onChange(valeur)
// des que l'utilisateur touche au controle. Les valeurs sont des chaines.
import { el } from './util.js';

export function makeControl(def, value, onChange) {
  switch (def.type) {
    case 'color': return colorControl(def, value, onChange);
    case 'range': return rangeControl(def, value, onChange);
    case 'number': return numberControl(def, value, onChange);
    case 'select': return selectControl(def.options, value, onChange);
    case 'bool': return boolControl(def, value, onChange);
    case 'textarea': return textareaControl(value, onChange);
    case 'font':
      return def.stacks.length
        ? selectControl(def.stacks.map((s) => ({ value: s, label: s.split(',')[0].replace(/["']/g, '') })), value, onChange, true)
        : textControl(value, onChange);
    default: return textControl(value, onChange);
  }
}

function toHex(v) {
  const m = String(v).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1];
  return '#' + (h.length === 3 ? h.replace(/./g, '$&$&') : h).toLowerCase();
}

function colorControl(def, value, onChange) {
  const picker = el('input', { type: 'color', class: 'pmf-color', title: 'Choisir une couleur' });
  const text = el('input', { type: 'text', class: 'pmf-text pmf-text--short', spellcheck: 'false' });
  const swatches = def.palette.map((c) =>
    el('button', { type: 'button', class: 'pmf-swatch', title: c, style: `background:${c}`, onclick: () => onChange(c) }));

  picker.addEventListener('input', () => onChange(picker.value));
  text.addEventListener('change', () => onChange(text.value.trim()));

  const set = (v) => {
    text.value = v;
    picker.value = toHex(v) || '#000000';
    swatches.forEach((s) => s.classList.toggle('is-active', s.title === v));
  };
  set(value);
  return {
    root: el('div', { class: 'pmf-control' }, picker, text, swatches.length ? el('span', { class: 'pmf-swatches' }, swatches) : null),
    set,
  };
}

function rangeControl(def, value, onChange) {
  const slider = el('input', { type: 'range', class: 'pmf-range', min: def.min, max: def.max, step: def.step });
  const num = el('input', { type: 'number', class: 'pmf-num', min: def.min, max: def.max, step: def.step });
  slider.addEventListener('input', () => { num.value = slider.value; onChange(slider.value); });
  num.addEventListener('change', () => {
    const v = Math.min(def.max, Math.max(def.min, Number(num.value) || 0));
    onChange(String(v));
  });
  const set = (v) => { slider.value = v; num.value = v; };
  set(value);
  return {
    root: el('div', { class: 'pmf-control' }, slider, num, def.unit ? el('span', { class: 'pmf-unit', text: def.unit }) : null),
    set,
  };
}

function numberControl(def, value, onChange) {
  const num = el('input', { type: 'number', class: 'pmf-num', min: def.min, max: def.max, step: def.step });
  num.addEventListener('change', () => onChange(String(Number(num.value) || 0)));
  const set = (v) => { num.value = v; };
  set(value);
  return {
    root: el('div', { class: 'pmf-control' }, num, def.unit ? el('span', { class: 'pmf-unit', text: def.unit }) : null),
    set,
  };
}

// Jusqu'a TOGGLE_MAX options, une rangee de boutons plutot qu'un menu
// deroulant : rien ne se deploie, donc rien ne peut etre coupe par un
// overflow du forum. Au-dela, un <select> reste plus lisible.
const TOGGLE_MAX = 5;

function selectControl(options, value, onChange, fontPreview) {
  if (options.length <= TOGGLE_MAX) return toggleControl(options, value, onChange, fontPreview);
  const select = el('select', { class: 'pmf-select' },
    options.map((o) => el('option', { value: o.value, text: o.label })));
  select.addEventListener('change', () => onChange(select.value));
  const set = (v) => {
    // Une valeur inconnue (ancienne sauvegarde) est ajoutee plutot que perdue.
    if (![...select.options].some((o) => o.value === v)) select.append(el('option', { value: v, text: v }));
    select.value = v;
  };
  set(value);
  return { root: el('div', { class: 'pmf-control' }, select), set };
}

function toggleControl(options, value, onChange, fontPreview) {
  const buttons = options.map((o) => el('button', {
    type: 'button',
    class: 'pmf-toggle',
    text: o.label,
    title: o.value,
    style: fontPreview ? `font-family:${o.value}` : null,
    onclick: () => onChange(o.value),
  }));
  const set = (v) => buttons.forEach((b) => b.classList.toggle('is-active', b.title === v));
  set(value);
  return { root: el('div', { class: 'pmf-control pmf-toggles' }, buttons), set };
}

function boolControl(def, value, onChange) {
  const box = el('input', { type: 'checkbox', class: 'pmf-check' });
  box.addEventListener('change', () => onChange(box.checked ? 'on' : 'off'));
  const set = (v) => { box.checked = v === 'on'; };
  set(value);
  return { root: el('div', { class: 'pmf-control' }, box), set };
}

function textControl(value, onChange) {
  const input = el('input', { type: 'text', class: 'pmf-text', spellcheck: 'false' });
  input.addEventListener('input', () => onChange(input.value));
  const set = (v) => { input.value = v; };
  set(value);
  return { root: el('div', { class: 'pmf-control' }, input), set };
}

function textareaControl(value, onChange) {
  const area = el('textarea', { class: 'pmf-textarea', rows: 3, spellcheck: 'false' });
  area.addEventListener('input', () => onChange(area.value));
  const set = (v) => { area.value = v; };
  set(value);
  return { root: el('div', { class: 'pmf-control' }, area), set };
}
