// Construit dist/ a partir de src/main.js :
//   pmf.js        lisible, pour le developpement et l'hebergement
//   pmf.min.js    minifie, a heberger et charger par <script src>
//   pmf.paste.js  encode en base64, a coller dans « Gestion des codes Javascript »
//                 (le champ d'administration abime parfois les antislashs ;
//                 le base64 n'en contient aucun et verifie sa propre longueur)
import { build, context } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const common = {
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['es2018'],
  charset: 'utf8',
  legalComments: 'none',
};

function writePaste() {
  const min = readFileSync('dist/pmf.min.js', 'utf8');
  const b64 = Buffer.from(min, 'utf8').toString('base64');
  const lines = b64.match(/.{1,200}/g).map((l) => `'${l}'`).join(',\n');
  const out = `/* pimp-my-module ${pkgVersion()} - loader encode en base64.
   A coller tel quel dans Administration > Modules > HTML & JAVASCRIPT >
   Gestion des codes Javascript, placement « Dans toutes les pages ». */
(function(){var s=[
${lines}
].join('');if(s.length!==${b64.length}){console.error('[pmf] loader tronque : '+s.length+' caracteres sur ${b64.length}');return;}
var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
(0,eval)(new TextDecoder().decode(u));})();
`;
  writeFileSync('dist/pmf.paste.js', out);
}

function pkgVersion() {
  return JSON.parse(readFileSync('package.json', 'utf8')).version;
}

function report() {
  for (const f of ['pmf.js', 'pmf.min.js', 'pmf.paste.js']) {
    const s = readFileSync(`dist/${f}`, 'utf8');
    // Le forum injecte ce code inline dans une balise script : une balise
    // fermante litterale couperait le loader en deux.
    if (/<\/script/i.test(s)) throw new Error(`dist/${f} contient une balise script fermante litterale`);
    console.log(`dist/${f.padEnd(13)} ${(s.length / 1024).toFixed(1).padStart(6)} ko  ${s.split('\n').length} lignes`);
  }
}

mkdirSync('dist', { recursive: true });

if (watch) {
  const dev = await context({ ...common, outfile: 'dist/pmf.js' });
  const min = await context({
    ...common,
    outfile: 'dist/pmf.min.js',
    minify: true,
    plugins: [{ name: 'paste', setup(b) { b.onEnd(() => { writePaste(); report(); }); } }],
  });
  await Promise.all([dev.watch(), min.watch()]);
  console.log('watch…');
} else {
  await build({ ...common, outfile: 'dist/pmf.js' });
  await build({ ...common, outfile: 'dist/pmf.min.js', minify: true });
  writePaste();
  report();
}
