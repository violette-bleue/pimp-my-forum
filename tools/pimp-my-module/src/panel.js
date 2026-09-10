// Le generateur d'un module : etat des tokens, onglets de reglage generes
// depuis <pmf-init>, onglet Installer, demo live et memoire locale.
import { el, debounce, copyText } from './util.js';
import { makeControl } from './controls.js';
import { render, tokensIn } from './tokens.js';
import { createSandbox } from './sandbox.js';

const KINDS = ['css', 'js', 'html'];

const INSTALL = {
  css: {
    title: 'CSS',
    where: 'Administration > Affichage > Images et couleurs > CSS.',
  },
  js: {
    title: 'JavaScript',
    where: 'Administration > Modules > HTML & JAVASCRIPT > Gestion des codes Javascript, placement au choix.',
  },
  html: {
    title: 'HTML',
    where: 'Dans un message, une page HTML ou un template, la ou le module doit apparaitre.',
  },
};

export function mount(host, { id, spec, sources, demo }) {
  const defs = spec.tokens;
  const storageKey = `pmf:${id}`;
  const usage = { css: tokensIn(sources.css), js: tokensIn(sources.js), html: tokensIn(sources.html) };
  const rows = {};
  const outputs = {};
  const values = {};
  const unknown = new Set();

  // --- etat ---------------------------------------------------------------

  const stored = load();
  for (const [name, def] of Object.entries(defs)) {
    values[name] = stored[name] != null ? String(stored[name]) : def.default;
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch (e) { return {}; }
  }
  function save() {
    const changed = {};
    for (const [name, def] of Object.entries(defs)) if (values[name] !== def.default) changed[name] = values[name];
    try {
      if (Object.keys(changed).length) localStorage.setItem(storageKey, JSON.stringify(changed));
      else localStorage.removeItem(storageKey);
    } catch (e) { /* stockage indisponible : on continue sans memoire */ }
  }

  function output(kind) {
    return render(sources[kind], kind, defs, values, unknown);
  }

  // --- interface ----------------------------------------------------------

  const app = el('div', { class: 'pmf-app', 'data-pmf-app': id });
  const name = spec.meta.name || id;
  app.append(el('div', { class: 'pmf-head' },
    el('h2', { text: name }),
    spec.meta.description ? el('p', { text: spec.meta.description }) : null));

  const sandbox = createSandbox(demo);
  app.append(el('div', { class: 'pmf-stage' }, sandbox.frame));

  const alerts = el('div');
  app.append(alerts);
  const demoError = el('div', { class: 'pmf-alert --error', hidden: true });
  alerts.append(demoError);
  sandbox.onError((msg, line) => {
    demoError.textContent = `Erreur dans le JavaScript du module${line ? ` (ligne ${line})` : ''} : ${msg}`;
    demoError.hidden = false;
  });

  // Onglets : ceux de <pmf-init>, puis Installer.
  const tabs = el('div', { class: 'pmf-tabs', role: 'tablist' });
  const panels = [];
  const addTab = (label, panel) => {
    const btn = el('button', { type: 'button', class: 'pmf-tab', role: 'tab', text: label, onclick: () => select(btn) });
    btn.pmfPanel = panel;
    panel.hidden = true;
    tabs.append(btn);
    panels.push(panel);
    return btn;
  };
  const select = (btn) => {
    for (const b of tabs.children) {
      b.classList.toggle('is-active', b === btn);
      b.pmfPanel.hidden = b !== btn;
    }
    if (btn.pmfPanel.classList.contains('pmf-install')) refreshInstall();
  };

  for (const tab of spec.tabs) {
    const panel = el('div', { class: 'pmf-panel', role: 'tabpanel' });
    for (const group of tab.groups) {
      panel.append(el('div', { class: 'pmf-card' },
        el('h3', { text: group.label }),
        group.tokens.map(row)));
    }
    addTab(tab.label, panel);
  }

  const install = el('div', { class: 'pmf-panel pmf-install', role: 'tabpanel' });
  for (const kind of KINDS) {
    if (!sources[kind].trim()) continue;
    const code = el('textarea', { class: 'pmf-code', readonly: true, spellcheck: 'false' });
    const copy = el('button', { type: 'button', class: 'pmf-btn', text: 'Copier' });
    copy.addEventListener('click', () => {
      copyText(code.value, code).then(() => {
        copy.textContent = 'Copie !';
        setTimeout(() => { copy.textContent = 'Copier'; }, 1500);
      });
    });
    outputs[kind] = code;
    install.append(el('div', { class: 'pmf-card' },
      el('h3', {}, INSTALL[kind].title, copy),
      el('p', { text: INSTALL[kind].where }),
      code));
  }
  addTab('Installer', install);

  app.append(tabs, ...panels);

  const count = el('span');
  app.append(el('div', { class: 'pmf-foot' },
    count,
    el('button', { type: 'button', class: 'pmf-btn', text: 'Tout reinitialiser', onclick: resetAll })));

  host.append(app);
  select(tabs.firstElementChild);

  // --- lignes de reglage --------------------------------------------------

  function row(def) {
    const control = makeControl(def, values[def.name], (v) => update(def.name, v));
    const wide = def.type === 'textarea';
    const node = el('div', { class: `pmf-row${wide ? ' --wide' : ''}`, 'data-token': def.name },
      el('label', { class: 'pmf-label' }, def.label, def.help ? el('span', { class: 'pmf-hint', text: def.help }) : null),
      control.root,
      el('button', { type: 'button', class: 'pmf-reset', title: `Revenir a la valeur par defaut (${def.default || 'vide'})`, text: '↺', onclick: () => update(def.name, def.default) }));
    rows[def.name] = { node, control };
    refreshRow(def.name);
    return node;
  }

  function refreshRow(name) {
    const r = rows[name];
    if (r) r.node.classList.toggle('is-default', values[name] === defs[name].default);
  }

  function refreshCount() {
    const n = Object.keys(defs).filter((k) => values[k] !== defs[k].default).length;
    count.textContent = n ? `${n} reglage${n > 1 ? 's' : ''} modifie${n > 1 ? 's' : ''}` : 'Valeurs par defaut';
  }

  // --- mise a jour --------------------------------------------------------

  const rebuild = () => {
    demoError.hidden = true;
    sandbox.render({ css: output('css'), js: output('js'), html: output('html') });
  };
  const rebuildSoon = debounce(rebuild, 250);

  function update(name, value) {
    if (values[name] === value) return;
    values[name] = value;
    rows[name].control.set(value);
    refreshRow(name);
    refreshCount();
    save();
    // Un token qui ne touche que le CSS se patche a chaud ; sinon on rejoue.
    if (!usage.js.has(name) && !usage.html.has(name) && sandbox.patchCss(output('css'))) return;
    rebuildSoon();
  }

  function resetAll() {
    for (const [name, def] of Object.entries(defs)) {
      values[name] = def.default;
      rows[name].control.set(def.default);
      refreshRow(name);
    }
    refreshCount();
    save();
    rebuild();
  }

  function refreshInstall() {
    for (const kind of Object.keys(outputs)) outputs[kind].value = output(kind);
  }

  // --- premier rendu ------------------------------------------------------

  refreshCount();
  rebuild();

  // Les avertissements ne sont connus qu'apres un premier passage.
  const messages = [...spec.errors];
  if (unknown.size) {
    messages.push(`Tokens utilises dans les sources mais absents de <pmf-init>, laisses tels quels : ${[...unknown].map((t) => `%%${t}%%`).join(', ')}`);
  }
  const unused = Object.keys(defs).filter((k) => !KINDS.some((kind) => usage[kind].has(k)));
  if (unused.length) messages.push(`Tokens declares mais jamais utilises : ${unused.join(', ')}`);
  if (!Object.keys(defs).length) messages.push('Aucun token declare dans <pmf-init> : rien a regler.');
  if (messages.length) alerts.prepend(el('div', { class: 'pmf-alert', text: messages.join('\n') }));
}
