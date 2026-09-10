(() => {
  // src/styles.js
  var CSS = `
pmf-module,[data-pmf="module"]{display:block}
pmf-style,pmf-js,pmf-init,pmf-demo,[data-pmf="style"],[data-pmf="js"],[data-pmf="init"],[data-pmf="demo"]{display:none!important}

.pmf-app{
  --pmf-accent:#7c5cbf;--pmf-accent-soft:#efe9fb;
  --pmf-bg:#fff;--pmf-bg-2:#f6f4fa;--pmf-border:#e2ddeb;
  --pmf-text:#2b2530;--pmf-muted:#7d7589;--pmf-radius:8px;
  font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  color:var(--pmf-text);background:var(--pmf-bg);border:1px solid var(--pmf-border);
  border-radius:var(--pmf-radius);margin:16px 0;text-align:left;box-sizing:border-box}
.pmf-app *,.pmf-app *::before,.pmf-app *::after{box-sizing:inherit}
.pmf-app [hidden]{display:none!important}

.pmf-head{display:flex;align-items:baseline;gap:6px 14px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid var(--pmf-border)}
.pmf-head h2{margin:0;font-size:17px;font-weight:600;line-height:1.3}
.pmf-head p{margin:0;flex:1 1 200px;color:var(--pmf-muted);font-size:13px}

.pmf-stage{padding:12px 18px;background:var(--pmf-bg-2)}
.pmf-frame{display:block;width:100%;min-height:40px;border:0;background:transparent}

.pmf-alert{margin:12px 18px 0;padding:9px 12px;border:1px solid #f0d9a8;border-radius:6px;background:#fff7e6;color:#6f4a00;font-size:13px;white-space:pre-line}
.pmf-alert.--error{border-color:#f2b8b8;background:#fdeded;color:#8a1c1c}

.pmf-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:12px 18px 0;border-bottom:1px solid var(--pmf-border)}
.pmf-tab{appearance:none;margin:0 0 -1px;padding:8px 14px;border:1px solid transparent;border-bottom:0;border-radius:6px 6px 0 0;
  background:transparent;color:var(--pmf-muted);font:inherit;font-weight:600;cursor:pointer}
.pmf-tab:hover{color:var(--pmf-text)}
.pmf-tab.is-active{background:var(--pmf-bg);color:var(--pmf-accent);border-color:var(--pmf-border)}

.pmf-panel{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px;padding:16px 18px}
.pmf-card{padding:12px 14px;border:1px solid var(--pmf-border);border-radius:var(--pmf-radius);background:var(--pmf-bg-2)}
.pmf-card h3{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--pmf-accent)}

.pmf-row{display:grid;grid-template-columns:minmax(80px,130px) minmax(0,1fr) 22px;gap:4px 10px;align-items:center;padding:5px 0}
.pmf-row.is-default .pmf-label{color:var(--pmf-muted)}
.pmf-row.--wide{grid-template-columns:1fr 22px}
.pmf-row.--wide .pmf-control{grid-column:1/-1}
.pmf-label{font-size:13px;line-height:1.3}
.pmf-hint{display:block;font-size:11px;color:var(--pmf-muted);font-weight:400}
.pmf-control{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
.pmf-unit{font-size:12px;color:var(--pmf-muted)}

.pmf-app input,.pmf-app select,.pmf-app textarea,.pmf-app button{font:inherit;color:inherit}
.pmf-text,.pmf-num,.pmf-textarea,.pmf-code{padding:4px 7px;border:1px solid var(--pmf-border);border-radius:5px;background:var(--pmf-bg);font-size:13px}
.pmf-text{flex:1 1 120px;min-width:0}
.pmf-text--short{flex:0 1 96px;font-family:ui-monospace,Consolas,monospace;font-size:12px}
.pmf-num{width:64px;font-size:12px}
.pmf-textarea{width:100%;resize:vertical;font-family:ui-monospace,Consolas,monospace;font-size:12px}
.pmf-range{flex:1 1 90px;min-width:60px;accent-color:var(--pmf-accent)}
.pmf-check{width:16px;height:16px;margin:0;accent-color:var(--pmf-accent)}
.pmf-color{width:34px;height:28px;padding:1px;border:1px solid var(--pmf-border);border-radius:5px;background:var(--pmf-bg);cursor:pointer}
.pmf-toggles{gap:4px}
.pmf-toggle{padding:4px 10px;border:1px solid var(--pmf-border);border-radius:5px;background:var(--pmf-bg);color:var(--pmf-muted);font-size:12px;line-height:1.3;cursor:pointer}
.pmf-toggle:hover{color:var(--pmf-text);border-color:var(--pmf-accent)}
.pmf-toggle.is-active{background:var(--pmf-accent);border-color:var(--pmf-accent);color:#fff}
.pmf-swatches{display:inline-flex;gap:4px}
.pmf-swatch{width:18px;height:18px;padding:0;border:2px solid var(--pmf-bg);border-radius:50%;box-shadow:0 0 0 1px var(--pmf-border);cursor:pointer}
.pmf-swatch.is-active{box-shadow:0 0 0 2px var(--pmf-accent)}

.pmf-reset{width:22px;height:22px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--pmf-muted);cursor:pointer;font-size:15px;line-height:1}
.pmf-reset:hover{background:var(--pmf-accent-soft);color:var(--pmf-accent)}
.pmf-row.is-default .pmf-reset{visibility:hidden}

.pmf-btn{padding:6px 12px;border:1px solid var(--pmf-border);border-radius:6px;background:var(--pmf-bg);cursor:pointer;font-size:13px;font-weight:600}
.pmf-btn:hover{border-color:var(--pmf-accent);color:var(--pmf-accent)}
.pmf-btn.--primary{background:var(--pmf-accent);border-color:var(--pmf-accent);color:#fff}
.pmf-btn.--primary:hover{filter:brightness(1.08);color:#fff}

.pmf-install .pmf-card{grid-column:1/-1}
.pmf-install .pmf-card h3{display:flex;align-items:center;gap:10px}
.pmf-install .pmf-card h3 .pmf-btn{margin-left:auto;text-transform:none;letter-spacing:0}
.pmf-install p{margin:0 0 8px;font-size:12px;color:var(--pmf-muted)}
.pmf-code{display:block;width:100%;min-height:110px;max-height:340px;resize:vertical;white-space:pre;overflow:auto;font:12px/1.45 ui-monospace,Consolas,monospace;tab-size:2}

.pmf-foot{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:10px 18px;border-top:1px solid var(--pmf-border);font-size:12px;color:var(--pmf-muted)}
.pmf-foot span{margin-right:auto}
`;
  function injectStyles() {
    if (document.querySelector("style[data-pmf-styles]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-pmf-styles", "");
    style.textContent = CSS;
    (document.head || document.documentElement).append(style);
  }

  // src/dsl.js
  var TYPES = {
    color: "color",
    couleur: "color",
    range: "range",
    slider: "range",
    curseur: "range",
    number: "number",
    nombre: "number",
    text: "text",
    texte: "text",
    textarea: "textarea",
    zone: "textarea",
    select: "select",
    liste: "select",
    bool: "bool",
    boolean: "bool",
    check: "bool",
    switch: "bool",
    font: "font",
    police: "font",
    url: "url",
    lien: "url"
  };
  var DECL = /^([A-Za-z_][\w-]*)\s*=\s*([a-zA-Z]+)\s*\[(.*?)\]\s*([a-zA-Z%]*)\s*(?:\((.*?)\))?\s*((?:@\w+\s*)*)(?:#\s*(.*))?$/;
  function parseInit(text) {
    const spec = { meta: {}, tabs: [], tokens: {}, errors: [] };
    let tab = null;
    let group = null;
    const openTab = (label) => {
      tab = { label, groups: [] };
      group = null;
      spec.tabs.push(tab);
    };
    const openGroup = (label) => {
      if (!tab) openTab("Reglages");
      group = { label, tokens: [] };
      tab.groups.push(group);
    };
    text.split("\n").forEach((raw, i) => {
      const line = raw.trim();
      const n = i + 1;
      if (!line || line.startsWith("//") || line.startsWith("#")) return;
      let m;
      if (m = line.match(/^@(\w+)\s*(.*)$/)) {
        spec.meta[m[1].toLowerCase()] = m[2].trim();
        return;
      }
      if (m = line.match(/^\[(.+)\]$/)) {
        openTab(m[1].trim());
        return;
      }
      if (m = line.match(/^\((.+)\)$/)) {
        openGroup(m[1].trim());
        return;
      }
      if (m = line.match(DECL)) {
        const def = buildToken(m, spec.errors, n);
        if (!def) return;
        if (spec.tokens[def.name]) spec.errors.push(`Ligne ${n} : le token « ${def.name} » est declare deux fois, la derniere declaration l'emporte.`);
        spec.tokens[def.name] = def;
        if (!group) openGroup("General");
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
    if (!type) {
      errors.push(`Ligne ${n} : type inconnu « ${rawType} »`);
      return null;
    }
    const [label, help] = (comment || "").split("|").map((s) => s.trim());
    const t = {
      name,
      type,
      default: def.trim(),
      unit: unit || "",
      label: label || name,
      help: help || "",
      targets: [...(targets || "").matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase())
    };
    const p = (params || "").trim();
    const list = (sep) => p.split(sep).map((s) => s.trim()).filter(Boolean);
    switch (type) {
      case "color":
        t.palette = list(",");
        break;
      case "range":
      case "number": {
        const m = p.match(/^(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*(?::\s*(-?[\d.]+))?$/);
        if (p && !m) errors.push(`Ligne ${n} : bornes illisibles « (${p}) », attendu (min..max:pas)`);
        t.min = m ? +m[1] : 0;
        t.max = m ? +m[2] : 100;
        t.step = m && m[3] ? +m[3] : 1;
        break;
      }
      case "select":
        t.options = list(",").map((s) => {
          const i = s.indexOf("=");
          return i < 0 ? { value: s, label: s } : { value: s.slice(0, i).trim(), label: s.slice(i + 1).trim() };
        });
        if (!t.options.length) errors.push(`Ligne ${n} : la liste « ${name} » n'a aucune option`);
        break;
      case "bool": {
        const [on, off] = p ? p.split("|") : ["true", "false"];
        t.on = on.trim();
        t.off = (off || "").trim();
        t.default = /^(on|true|1|oui|yes|vrai)$/i.test(t.default) ? "on" : "off";
        break;
      }
      case "font":
        t.stacks = list(";");
        if (t.stacks.length && !t.stacks.includes(t.default)) t.stacks.unshift(t.default);
        break;
      default:
        break;
    }
    return t;
  }

  // src/util.js
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, "");
        else node.setAttribute(k, v);
      }
    }
    for (const c of children.flat()) if (c != null && c !== false) node.append(c);
    return node;
  }
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }
  function readSource(node) {
    if (!node) return "";
    const ta = node.querySelector("textarea");
    if (ta) {
      return trimLines(ta.value.replace(/<br\s*\/?>/gi, "\n"));
    }
    const clone = node.cloneNode(true);
    clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
    clone.querySelectorAll("div, p, li").forEach((b) => b.append("\n"));
    return trimLines(
      clone.textContent.replace(/ /g, " ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    );
  }
  function trimLines(s) {
    return s.replace(/\r\n?/g, "\n").replace(/^\n+/, "").replace(/\s+$/, "");
  }
  function copyText(text, field) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    field.focus();
    field.select();
    try {
      document.execCommand("copy");
    } catch (e) {
    }
    return Promise.resolve();
  }

  // src/format.js
  var TAB = "  ";
  function formatCss(src) {
    let out = "";
    let depth = 0;
    let paren = 0;
    let lineStart = true;
    const n = src.length;
    const trimEnd = () => {
      out = out.replace(/\s+$/, "");
    };
    const newline = () => {
      trimEnd();
      if (out) out += "\n";
      lineStart = true;
    };
    const put = (s) => {
      if (lineStart) {
        out += TAB.repeat(depth);
        lineStart = false;
      }
      out += s;
    };
    let i = 0;
    while (i < n) {
      const c = src[i];
      if (c === "/" && src[i + 1] === "*") {
        const end = src.indexOf("*/", i + 2);
        const comment = src.slice(i, end < 0 ? n : end + 2);
        if (!lineStart) newline();
        put(comment);
        newline();
        i += comment.length;
        continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < n && src[j] !== c) {
          if (src[j] === "\\") j++;
          j++;
        }
        put(src.slice(i, j + 1));
        i = j + 1;
        continue;
      }
      if (c === "(") paren++;
      if (c === ")") paren = Math.max(0, paren - 1);
      if (paren === 0) {
        if (c === "{") {
          trimEnd();
          out += " {";
          depth++;
          newline();
          i++;
          continue;
        }
        if (c === "}") {
          depth = Math.max(0, depth - 1);
          newline();
          put("}");
          newline();
          if (depth === 0) out += "\n";
          i++;
          continue;
        }
        if (c === ";") {
          trimEnd();
          out += ";";
          newline();
          i++;
          continue;
        }
      }
      if (/\s/.test(c)) {
        if (!lineStart && !/\s$/.test(out)) out += " ";
        i++;
        continue;
      }
      put(c);
      i++;
    }
    return out.split("\n").map(tidyDeclaration).join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }
  function tidyDeclaration(line) {
    const m = line.match(/^(\s*)([\w-]+)\s*:\s*(.*)$/);
    if (!m || /[{}]\s*$/.test(line) || /^\s*\/\*/.test(line)) return line;
    let value = "";
    let paren = 0;
    let str = null;
    for (const c of m[3]) {
      if (str) {
        value += c;
        if (c === str) str = null;
        continue;
      }
      if (c === '"' || c === "'") {
        str = c;
        value += c;
        continue;
      }
      if (c === "(") paren++;
      if (c === ")") paren = Math.max(0, paren - 1);
      value += c;
      if (c === "," && paren === 0) value += " ";
    }
    value = value.replace(/\s+/g, " ").trim();
    if (!value.endsWith(";")) value += ";";
    return `${m[1]}${m[2]}: ${value}`;
  }
  function reindentJs(src) {
    const lines = src.split("\n");
    const out = [];
    let depth = 0;
    let inBlockComment = false;
    const base = [];
    let entered = true;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        out.push("");
        continue;
      }
      const origIndent = raw.match(/^[ \t]*/)[0].replace(/\t/g, TAB).length;
      const startsInComment = inBlockComment;
      let open = 0;
      let close2 = 0;
      let leadClose = 0;
      let seenCode = false;
      let str = null;
      let i = 0;
      while (i < line.length) {
        const c = line[i];
        const d = line[i + 1];
        if (inBlockComment) {
          if (c === "*" && d === "/") {
            inBlockComment = false;
            i += 2;
          } else i++;
          continue;
        }
        if (str) {
          if (c === "\\") {
            i += 2;
            continue;
          }
          if (c === str) str = null;
          i++;
          continue;
        }
        if (c === "/" && d === "/") break;
        if (c === "/" && d === "*") {
          inBlockComment = true;
          i += 2;
          continue;
        }
        if (c === '"' || c === "'" || c === "`") {
          str = c;
          seenCode = true;
          i++;
          continue;
        }
        if (c === "{" || c === "(" || c === "[") {
          open++;
          seenCode = true;
        } else if (c === "}" || c === ")" || c === "]") {
          close2++;
          if (!seenCode) leadClose++;
        } else if (!/\s/.test(c)) seenCode = true;
        i++;
      }
      const level = Math.max(0, depth - (leadClose ? 1 : 0));
      if (entered || base[level] == null) base[level] = origIndent;
      const extra = Math.max(0, origIndent - base[level]);
      const prefix = startsInComment && line.startsWith("*") ? " " : "";
      out.push(TAB.repeat(level) + " ".repeat(extra) + prefix + line);
      const next = Math.max(0, depth + Math.sign(open - close2));
      entered = next > depth;
      depth = next;
    }
    return out.join("\n");
  }

  // src/controls.js
  function makeControl(def, value, onChange) {
    switch (def.type) {
      case "color":
        return colorControl(def, value, onChange);
      case "range":
        return rangeControl(def, value, onChange);
      case "number":
        return numberControl(def, value, onChange);
      case "select":
        return selectControl(def.options, value, onChange);
      case "bool":
        return boolControl(def, value, onChange);
      case "textarea":
        return textareaControl(value, onChange);
      case "font":
        return def.stacks.length ? selectControl(def.stacks.map((s) => ({ value: s, label: s.split(",")[0].replace(/["']/g, "") })), value, onChange, true) : textControl(value, onChange);
      default:
        return textControl(value, onChange);
    }
  }
  function toHex(v) {
    const m = String(v).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    const h = m[1];
    return "#" + (h.length === 3 ? h.replace(/./g, "$&$&") : h).toLowerCase();
  }
  function colorControl(def, value, onChange) {
    const picker = el("input", { type: "color", class: "pmf-color", title: "Choisir une couleur" });
    const text = el("input", { type: "text", class: "pmf-text pmf-text--short", spellcheck: "false" });
    const swatches = def.palette.map((c) => el("button", { type: "button", class: "pmf-swatch", title: c, style: `background:${c}`, onclick: () => onChange(c) }));
    picker.addEventListener("input", () => onChange(picker.value));
    text.addEventListener("change", () => onChange(text.value.trim()));
    const set = (v) => {
      text.value = v;
      picker.value = toHex(v) || "#000000";
      swatches.forEach((s) => s.classList.toggle("is-active", s.title === v));
    };
    set(value);
    return {
      root: el("div", { class: "pmf-control" }, picker, text, swatches.length ? el("span", { class: "pmf-swatches" }, swatches) : null),
      set
    };
  }
  function rangeControl(def, value, onChange) {
    const slider = el("input", { type: "range", class: "pmf-range", min: def.min, max: def.max, step: def.step });
    const num = el("input", { type: "number", class: "pmf-num", min: def.min, max: def.max, step: def.step });
    slider.addEventListener("input", () => {
      num.value = slider.value;
      onChange(slider.value);
    });
    num.addEventListener("change", () => {
      const v = Math.min(def.max, Math.max(def.min, Number(num.value) || 0));
      onChange(String(v));
    });
    const set = (v) => {
      slider.value = v;
      num.value = v;
    };
    set(value);
    return {
      root: el("div", { class: "pmf-control" }, slider, num, def.unit ? el("span", { class: "pmf-unit", text: def.unit }) : null),
      set
    };
  }
  function numberControl(def, value, onChange) {
    const num = el("input", { type: "number", class: "pmf-num", min: def.min, max: def.max, step: def.step });
    num.addEventListener("change", () => onChange(String(Number(num.value) || 0)));
    const set = (v) => {
      num.value = v;
    };
    set(value);
    return {
      root: el("div", { class: "pmf-control" }, num, def.unit ? el("span", { class: "pmf-unit", text: def.unit }) : null),
      set
    };
  }
  var TOGGLE_MAX = 5;
  function selectControl(options, value, onChange, fontPreview) {
    if (options.length <= TOGGLE_MAX) return toggleControl(options, value, onChange, fontPreview);
    const select = el(
      "select",
      { class: "pmf-select" },
      options.map((o) => el("option", { value: o.value, text: o.label }))
    );
    select.addEventListener("change", () => onChange(select.value));
    const set = (v) => {
      if (![...select.options].some((o) => o.value === v)) select.append(el("option", { value: v, text: v }));
      select.value = v;
    };
    set(value);
    return { root: el("div", { class: "pmf-control" }, select), set };
  }
  function toggleControl(options, value, onChange, fontPreview) {
    const buttons = options.map((o) => el("button", {
      type: "button",
      class: "pmf-toggle",
      text: o.label,
      title: o.value,
      style: fontPreview ? `font-family:${o.value}` : null,
      onclick: () => onChange(o.value)
    }));
    const set = (v) => buttons.forEach((b) => b.classList.toggle("is-active", b.title === v));
    set(value);
    return { root: el("div", { class: "pmf-control pmf-toggles" }, buttons), set };
  }
  function boolControl(def, value, onChange) {
    const box = el("input", { type: "checkbox", class: "pmf-check" });
    box.addEventListener("change", () => onChange(box.checked ? "on" : "off"));
    const set = (v) => {
      box.checked = v === "on";
    };
    set(value);
    return { root: el("div", { class: "pmf-control" }, box), set };
  }
  function textControl(value, onChange) {
    const input = el("input", { type: "text", class: "pmf-text", spellcheck: "false" });
    input.addEventListener("input", () => onChange(input.value));
    const set = (v) => {
      input.value = v;
    };
    set(value);
    return { root: el("div", { class: "pmf-control" }, input), set };
  }
  function textareaControl(value, onChange) {
    const area = el("textarea", { class: "pmf-textarea", rows: 3, spellcheck: "false" });
    area.addEventListener("input", () => onChange(area.value));
    const set = (v) => {
      area.value = v;
    };
    set(value);
    return { root: el("div", { class: "pmf-control" }, area), set };
  }

  // src/tokens.js
  var TOKEN = /%%([A-Za-z_][\w-]*)(?:\|([a-z]+))?%%/g;
  var FILTERS = {
    json: (v) => JSON.stringify(v),
    quote: (v) => JSON.stringify(v),
    upper: (v) => v.toUpperCase(),
    lower: (v) => v.toLowerCase(),
    trim: (v) => v.trim(),
    raw: (v) => v
  };
  function outputValue(def, value) {
    switch (def.type) {
      case "range":
      case "number":
        return String(value) + def.unit;
      case "bool":
        return value === "on" ? def.on : def.off;
      default:
        return String(value);
    }
  }
  function render(source, kind, defs, values, unknown) {
    return source.replace(TOKEN, (all, name, filter) => {
      const def = defs[name];
      if (!def) {
        if (unknown) unknown.add(name);
        return all;
      }
      if (def.targets.length && !def.targets.includes(kind)) return all;
      const f = filter ? FILTERS[filter] : null;
      if (filter && !f) {
        if (unknown) unknown.add(`${name}|${filter}`);
        return all;
      }
      const v = outputValue(def, values[name] != null ? values[name] : def.default);
      return f ? f(v) : v;
    });
  }
  function tokensIn(source) {
    const s = /* @__PURE__ */ new Set();
    for (const m of source.matchAll(TOKEN)) s.add(m[1]);
    return s;
  }

  // src/sandbox.js
  var DEPS = {
    jquery: "https://code.jquery.com/jquery-3.7.1.min.js",
    jquery3: "https://code.jquery.com/jquery-3.7.1.min.js",
    jquery1: "https://code.jquery.com/jquery-1.12.4.min.js"
  };
  var safe = (code) => code.replace(/<\/(script|style)/gi, "<\\/$1");
  var escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  var close = (tag) => "</" + tag + ">";
  function createSandbox(opts) {
    const frame = el("iframe", { class: "pmf-frame", scrolling: "no" });
    if (opts.height) frame.style.height = /^\d+$/.test(opts.height) ? `${opts.height}px` : opts.height;
    const deps = (opts.deps || []).map((d) => DEPS[d.toLowerCase()] || d);
    let onError = () => {
    };
    let observer = null;
    function fit() {
      const doc = frame.contentDocument;
      if (doc && doc.documentElement) frame.style.height = `${doc.documentElement.offsetHeight}px`;
    }
    return {
      frame,
      onError(fn) {
        onError = fn;
      },
      // Reecrit tout le document : CSS, HTML de demo et script.
      render({ css, js, html }) {
        const doc = frame.contentDocument;
        if (!doc) return;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        const head = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0}body{padding:12px;background:${opts.bg || "transparent"};font:14px/1.5 sans-serif;overflow:hidden}${close("style")}
<style id="pmf-style">${safe(css)}${close("style")}
<script>window.onerror=function(m,s,l){try{frameElement.pmfError(m,l)}catch(e){}};${close("script")}
${deps.map((u) => `<script src="${escAttr(u)}">${close("script")}`).join("\n")}
</head><body${opts.bodyClass ? ` class="${escAttr(opts.bodyClass)}"` : ""}>${html}
<script>`;
        const offset = head.split("\n").length - 1;
        frame.pmfError = (msg, line) => onError(msg, line ? line - offset : null);
        doc.open();
        doc.write(`${head}${safe(js)}
${close("script")}${close("body")}${close("html")}`);
        doc.close();
        if (!opts.height) {
          fit();
          const win = frame.contentWindow;
          if (win.ResizeObserver) {
            observer = new win.ResizeObserver(fit);
            observer.observe(doc.documentElement);
          }
          win.addEventListener("load", fit);
        }
      },
      // Remplace seulement la feuille de style : l'etat du module est conserve.
      patchCss(css) {
        const doc = frame.contentDocument;
        const style = doc && doc.getElementById("pmf-style");
        if (!style) return false;
        style.textContent = css;
        return true;
      }
    };
  }

  // src/panel.js
  var KINDS = ["css", "js", "html"];
  var INSTALL = {
    css: {
      title: "CSS",
      where: "Administration > Affichage > Images et couleurs > CSS."
    },
    js: {
      title: "JavaScript",
      where: "Administration > Modules > HTML & JAVASCRIPT > Gestion des codes Javascript, placement au choix."
    },
    html: {
      title: "HTML",
      where: "Dans un message, une page HTML ou un template, la ou le module doit apparaitre."
    }
  };
  function mount(host, { id, spec, sources, demo }) {
    const defs = spec.tokens;
    const storageKey = `pmf:${id}`;
    const usage = { css: tokensIn(sources.css), js: tokensIn(sources.js), html: tokensIn(sources.html) };
    const rows = {};
    const outputs = {};
    const values = {};
    const unknown = /* @__PURE__ */ new Set();
    const stored = load();
    for (const [name2, def] of Object.entries(defs)) {
      values[name2] = stored[name2] != null ? String(stored[name2]) : def.default;
    }
    function load() {
      try {
        return JSON.parse(localStorage.getItem(storageKey)) || {};
      } catch (e) {
        return {};
      }
    }
    function save() {
      const changed = {};
      for (const [name2, def] of Object.entries(defs)) if (values[name2] !== def.default) changed[name2] = values[name2];
      try {
        if (Object.keys(changed).length) localStorage.setItem(storageKey, JSON.stringify(changed));
        else localStorage.removeItem(storageKey);
      } catch (e) {
      }
    }
    function output(kind) {
      return render(sources[kind], kind, defs, values, unknown);
    }
    const app = el("div", { class: "pmf-app", "data-pmf-app": id });
    const name = spec.meta.name || id;
    app.append(el(
      "div",
      { class: "pmf-head" },
      el("h2", { text: name }),
      spec.meta.description ? el("p", { text: spec.meta.description }) : null
    ));
    const sandbox = createSandbox(demo);
    app.append(el("div", { class: "pmf-stage" }, sandbox.frame));
    const alerts = el("div");
    app.append(alerts);
    const demoError = el("div", { class: "pmf-alert --error", hidden: true });
    alerts.append(demoError);
    sandbox.onError((msg, line) => {
      demoError.textContent = `Erreur dans le JavaScript du module${line ? ` (ligne ${line})` : ""} : ${msg}`;
      demoError.hidden = false;
    });
    const tabs = el("div", { class: "pmf-tabs", role: "tablist" });
    const panels = [];
    const addTab = (label, panel) => {
      const btn = el("button", { type: "button", class: "pmf-tab", role: "tab", text: label, onclick: () => select(btn) });
      btn.pmfPanel = panel;
      panel.hidden = true;
      tabs.append(btn);
      panels.push(panel);
      return btn;
    };
    const select = (btn) => {
      for (const b of tabs.children) {
        b.classList.toggle("is-active", b === btn);
        b.pmfPanel.hidden = b !== btn;
      }
      if (btn.pmfPanel.classList.contains("pmf-install")) refreshInstall();
    };
    for (const tab of spec.tabs) {
      const panel = el("div", { class: "pmf-panel", role: "tabpanel" });
      for (const group of tab.groups) {
        panel.append(el(
          "div",
          { class: "pmf-card" },
          el("h3", { text: group.label }),
          group.tokens.map(row)
        ));
      }
      addTab(tab.label, panel);
    }
    const install = el("div", { class: "pmf-panel pmf-install", role: "tabpanel" });
    for (const kind of KINDS) {
      if (!sources[kind].trim()) continue;
      const code = el("textarea", { class: "pmf-code", readonly: true, spellcheck: "false" });
      const copy = el("button", { type: "button", class: "pmf-btn", text: "Copier" });
      copy.addEventListener("click", () => {
        copyText(code.value, code).then(() => {
          copy.textContent = "Copie !";
          setTimeout(() => {
            copy.textContent = "Copier";
          }, 1500);
        });
      });
      outputs[kind] = code;
      install.append(el(
        "div",
        { class: "pmf-card" },
        el("h3", {}, INSTALL[kind].title, copy),
        el("p", { text: INSTALL[kind].where }),
        code
      ));
    }
    addTab("Installer", install);
    app.append(tabs, ...panels);
    const count = el("span");
    app.append(el(
      "div",
      { class: "pmf-foot" },
      count,
      el("button", { type: "button", class: "pmf-btn", text: "Tout reinitialiser", onclick: resetAll })
    ));
    host.append(app);
    select(tabs.firstElementChild);
    function row(def) {
      const control = makeControl(def, values[def.name], (v) => update(def.name, v));
      const wide = def.type === "textarea";
      const node = el(
        "div",
        { class: `pmf-row${wide ? " --wide" : ""}`, "data-token": def.name },
        el("label", { class: "pmf-label" }, def.label, def.help ? el("span", { class: "pmf-hint", text: def.help }) : null),
        control.root,
        el("button", { type: "button", class: "pmf-reset", title: `Revenir a la valeur par defaut (${def.default || "vide"})`, text: "↺", onclick: () => update(def.name, def.default) })
      );
      rows[def.name] = { node, control };
      refreshRow(def.name);
      return node;
    }
    function refreshRow(name2) {
      const r = rows[name2];
      if (r) r.node.classList.toggle("is-default", values[name2] === defs[name2].default);
    }
    function refreshCount() {
      const n = Object.keys(defs).filter((k) => values[k] !== defs[k].default).length;
      count.textContent = n ? `${n} reglage${n > 1 ? "s" : ""} modifie${n > 1 ? "s" : ""}` : "Valeurs par defaut";
    }
    const rebuild = () => {
      demoError.hidden = true;
      sandbox.render({ css: output("css"), js: output("js"), html: output("html") });
    };
    const rebuildSoon = debounce(rebuild, 250);
    function update(name2, value) {
      if (values[name2] === value) return;
      values[name2] = value;
      rows[name2].control.set(value);
      refreshRow(name2);
      refreshCount();
      save();
      if (!usage.js.has(name2) && !usage.html.has(name2) && sandbox.patchCss(output("css"))) return;
      rebuildSoon();
    }
    function resetAll() {
      for (const [name2, def] of Object.entries(defs)) {
        values[name2] = def.default;
        rows[name2].control.set(def.default);
        refreshRow(name2);
      }
      refreshCount();
      save();
      rebuild();
    }
    function refreshInstall() {
      for (const kind of Object.keys(outputs)) outputs[kind].value = output(kind);
    }
    refreshCount();
    rebuild();
    const messages = [...spec.errors];
    if (unknown.size) {
      messages.push(`Tokens utilises dans les sources mais absents de <pmf-init>, laisses tels quels : ${[...unknown].map((t) => `%%${t}%%`).join(", ")}`);
    }
    const unused = Object.keys(defs).filter((k) => !KINDS.some((kind) => usage[kind].has(k)));
    if (unused.length) messages.push(`Tokens declares mais jamais utilises : ${unused.join(", ")}`);
    if (!Object.keys(defs).length) messages.push("Aucun token declare dans <pmf-init> : rien a regler.");
    if (messages.length) alerts.prepend(el("div", { class: "pmf-alert", text: messages.join("\n") }));
  }

  // src/main.js
  var FLAG = "__pimpMyModule";
  if (!window[FLAG]) {
    window[FLAG] = true;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
  function boot() {
    injectStyles();
    document.querySelectorAll('pmf-module, [data-pmf="module"]').forEach(mountModule);
  }
  var counter = 0;
  function mountModule(node) {
    if (node.pmfMounted) return;
    node.pmfMounted = true;
    node.querySelectorAll(":scope > br").forEach((br) => br.remove());
    const all = (kind) => [...node.querySelectorAll(`pmf-${kind}, [data-pmf="${kind}"]`)];
    const text = (kind) => all(kind).map(readSource).join("\n");
    const spec = parseInit(text("init"));
    const demoNodes = all("demo");
    const demoNode = demoNodes[0];
    const id = node.id || spec.meta.id || `module-${++counter}`;
    try {
      mount(node, {
        id,
        spec,
        sources: {
          css: formatCss(text("style")),
          js: reindentJs(text("js")),
          // Le HTML de demo est pris tel quel, balises comprises.
          html: demoNodes.map((d) => d.innerHTML.trim()).join("\n")
        },
        demo: {
          bg: attr(demoNode, "bg"),
          height: attr(demoNode, "height"),
          bodyClass: attr(demoNode, "body-class"),
          deps: (attr(demoNode, "deps") || "").split(/[\s,]+/).filter(Boolean)
        }
      });
    } catch (e) {
      console.error("[pmf] impossible de monter le module", id, e);
      node.append(Object.assign(document.createElement("div"), {
        className: "pmf-alert --error",
        textContent: `[pmf] Le module « ${id} » n'a pas pu etre monte : ${e.message}`
      }));
    }
  }
  function attr(node, name) {
    return node ? node.getAttribute(name) || node.getAttribute(`data-${name}`) : null;
  }
})();
