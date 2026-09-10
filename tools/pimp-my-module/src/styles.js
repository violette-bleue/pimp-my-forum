// Feuille de style du generateur, injectee une fois par page. Tout est
// prefixe .pmf- et pilote par des variables CSS : le forum peut les
// redefinir sur .pmf-app sans toucher au script.
const CSS = `
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
.pmf-text,.pmf-num,.pmf-select,.pmf-textarea,.pmf-code{padding:4px 7px;border:1px solid var(--pmf-border);border-radius:5px;background:var(--pmf-bg);font-size:13px}
.pmf-text{flex:1 1 120px;min-width:0}
.pmf-text--short{flex:0 1 96px;font-family:ui-monospace,Consolas,monospace;font-size:12px}
.pmf-num{width:64px;font-size:12px}
.pmf-select{flex:1 1 120px;min-width:0}
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

export function injectStyles() {
  if (document.querySelector('style[data-pmf-styles]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-pmf-styles', '');
  style.textContent = CSS;
  (document.head || document.documentElement).append(style);
}
