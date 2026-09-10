# pimp-my-module

Générateur de modules pour Forumactif. Un module se publie **en HTML pur**,
dans un message ou une page HTML, sous la forme de quelques balises `<pmf-*>`.
Un unique script, installé une fois sur le forum, les transforme en un
générateur : démo live, formulaire de réglage construit à partir des tokens
`%%nom%%`, et onglet **Installer** qui donne le CSS, le JS et le HTML finaux
avec les valeurs choisies.

```html
<pmf-module id="infobulle">
  <pmf-init>
    @name Infobulle
    [Apparence]
    (Couleurs)
    fond  = color[#2b2118]  # Fond
    texte = color[#ffffff]  # Texte
    (Forme)
    arrondi = range[6]px(0..20)  # Arrondi
  </pmf-init>
  <pmf-style>
    .tip { background: %%fond%%; color: %%texte%%; border-radius: %%arrondi%%; }
  </pmf-style>
  <pmf-js><textarea>
    /* du JavaScript, avec des %%tokens%% aussi */
  </textarea></pmf-js>
  <pmf-demo>
    <span class="tip">Bonjour</span>
  </pmf-demo>
</pmf-module>
```

## Installation sur le forum

1. Administration > Modules > HTML & JAVASCRIPT > **Gestion des codes
   Javascript** > *Créer un nouveau code JavaScript*.
2. Placement **« Dans toutes les pages »**.
3. Coller le contenu de **`dist/pmf.paste.js`** — le fichier entier, pas de
   balise `<script>` : ce champ attend du JavaScript brut.
4. Activer, enregistrer.
5. Facultatif mais recommandé, dans la feuille de style du forum, pour éviter
   que le code source n'apparaisse un instant avant l'exécution du script :

   ```css
   pmf-style, pmf-js, pmf-init, pmf-demo { display: none; }
   ```

Si vous préférez héberger le fichier (GitHub Pages, jsDelivr…), utilisez
`dist/pmf.min.js` et mettez `<script src="https://…/pmf.min.js"></script>`
dans le code JavaScript à la place.

| Fichier | Usage |
| --- | --- |
| `dist/pmf.paste.js` | **à coller** dans le champ d'administration. Le code est encodé en base64 : aucun antislash, aucun caractère que le champ pourrait réécrire, et le loader vérifie sa propre longueur avant de s'exécuter. |
| `dist/pmf.min.js` | à héberger et charger par `<script src>`. |
| `dist/pmf.js` | lisible, pour le développement. |

Le loader ne contient nulle part la séquence `</script>` (le forum l'injecte
inline) ; le build échoue si elle réapparaît.

## Les balises

| Balise | Rôle |
| --- | --- |
| `<pmf-module id="…">` | Regroupe un module. L'`id` sert de clé pour mémoriser les réglages dans le navigateur. |
| `<pmf-init>` | Déclaration des tokens, onglets et containers (voir plus bas). |
| `<pmf-style>` | Le CSS du module. |
| `<pmf-js>` | Le JavaScript du module. |
| `<pmf-demo>` | Le HTML de démonstration, affiché dans la démo et fourni dans Installer. Attributs : `bg` (fond de la démo), `height` (hauteur fixe, sinon auto), `deps` (scripts tiers : `jquery`, ou des URL séparées par des espaces), `body-class`. |

Chaque balise est répétable ; les contenus se concatènent. Si l'éditeur du
forum filtre les balises inconnues, les équivalents en attributs marchent
aussi : `<div data-pmf="module">`, `<div data-pmf="style">`, etc.

Le générateur s'affiche **à la place** des balises, dans le message.

### Le piège du `<` en JavaScript

Le contenu de `<pmf-style>` et `<pmf-init>` est lu tel quel ; le loader
rattrape les `<br>` et `&nbsp;` que l'éditeur ajoute. Mais un `<` suivi d'une
lettre dans du JavaScript (`i < n`) est pris pour une balise par le navigateur
avant même que le script n'y ait accès. Deux solutions :

```html
<!-- 1. un <textarea> : son contenu est du texte brut, rien à échapper -->
<pmf-js><textarea>
for (var i = 0; i < 3; i++) { … }
</textarea></pmf-js>

<!-- 2. écrire &lt; -->
<pmf-js>for (var i = 0; i &lt; 3; i++) { … }</pmf-js>
```

## Tokens

Dans les trois sources, un token s'écrit `%%nom%%`. Un filtre peut suivre :
`%%libelle|json%%` donne une chaîne JavaScript valide (`"Voir la fiche"`).
Filtres : `json` (alias `quote`), `upper`, `lower`, `trim`.

Un token présent dans les sources mais non déclaré est **laissé intact** et
signalé dans un bandeau ; un token déclaré mais jamais utilisé est signalé
aussi.

## `<pmf-init>`

```
@name Infobulle
@description Une bulle au survol.

[Apparence]                  ← ouvre un onglet

(Couleurs)                   ← ouvre un container (une carte) dans l'onglet
fond  = color[#2b2118](#2b2118, #3b6ef5, #e2574c)  # Fond
texte = color[#ffffff]                             # Texte

(Forme)
arrondi = range[6]px(0..20)                        # Arrondi
ombre   = bool[on](0 4px 12px rgba(0,0,0,.25) | none)  # Ombre portée

[Comportement]

(Animation)
position = select[top](top=Au-dessus, bottom=En dessous)  # Position
delai    = range[100]ms(0..1000:50)  # Délai | Avant que la bulle apparaisse

// une remarque
```

Un token hors de tout container va dans une carte « General » ; hors de tout
onglet, dans un onglet « Reglages ». L'onglet **Installer** est toujours ajouté
en dernier.

### La ligne de déclaration

```
nom = type[valeur par défaut]unité(paramètres) @cible   # Libellé | aide
```

Seuls `nom`, `type` et la valeur entre crochets sont obligatoires.

| Type | Exemple | Paramètres |
| --- | --- | --- |
| `color` | `accent = color[#3b6ef5](#3b6ef5, #e2574c)` | palette de raccourcis. Le champ texte accepte aussi `rgba()`, `var()`, un mot-clé. |
| `range` | `arrondi = range[10]px(0..30:2)` | `min..max:pas` ; l'unité est ajoutée à la valeur produite (`10px`) |
| `number` | `colonnes = number[3](1..6)` | `min..max:pas` |
| `select` | `forme = select[50%](50%=Rond, 0=Carré)` | `valeur=Libellé`, séparés par des virgules |
| `bool` | `ombre = bool[on](0 2px 4px #0003 \| none)` | valeur si coché `\|` valeur si décoché (`true`/`false` par défaut) |
| `text` | `titre = text[Bienvenue]` | — |
| `textarea` | `intro = textarea[…]` | — |
| `font` | `police = font[Arial, sans-serif](Georgia, serif; monospace)` | piles alternatives séparées par des **points-virgules** ; sans paramètres, un champ texte |
| `url` | `image = url[https://…]` | — |

Alias acceptés : `couleur`, `slider`/`curseur`, `nombre`, `liste`,
`boolean`/`check`/`switch`, `texte`, `zone`, `police`, `lien`.

`@css`, `@js`, `@html` limitent les sources où le token est remplacé.

Métadonnées : `@name`, `@description`, `@id` (à défaut, l'`id` de
`<pmf-module>`).

Toute ligne que le parseur ne comprend pas est signalée dans un bandeau avec
son numéro : rien n'est ignoré en silence.

## Ce que fait le générateur

- **Démo live** dans une iframe : le module a son propre `document`, son
  CSS n'atteint pas le forum et inversement. Un token qui ne touche que le
  CSS est appliqué à chaud (le curseur reste fluide, l'état du module est
  gardé) ; un token utilisé dans le JS ou le HTML rejoue le module.
- Les erreurs JavaScript de la démo remontent dans un bandeau avec leur
  ligne, sans polluer la console du forum.
- Les réglages modifiés sont **mémorisés dans le navigateur** (`localStorage`,
  par `id` de module). Le bouton `↺` d'une ligne, ou « Tout réinitialiser »,
  revient aux valeurs par défaut.
- L'onglet **Installer** donne le CSS, le JavaScript et le HTML avec les
  tokens remplacés par les valeurs en cours, chacun avec un bouton Copier et
  un rappel de l'endroit où le coller.

## Habillage

Le script injecte une feuille de style préfixée `.pmf-` et pilotée par des
variables CSS. Pour l'accorder au forum, il suffit de les redéfinir :

```css
.pmf-app {
  --pmf-accent: #c2185b;
  --pmf-bg: #fff;
  --pmf-bg-2: #faf5f7;
  --pmf-border: #e8d7de;
  --pmf-text: #222;
  --pmf-muted: #777;
  --pmf-radius: 6px;
}
```

## Développement

```bash
npm install
npm run build      # dist/pmf.js, pmf.min.js, pmf.paste.js
npm run watch
npm run serve      # http://localhost:5173/demo/
```

| Fichier | Rôle |
| --- | --- |
| `src/main.js` | Amorçage, lecture des balises, montage |
| `src/dsl.js` | Mini-langage de `<pmf-init>` |
| `src/tokens.js` | Substitution des tokens et filtres |
| `src/panel.js` | État, onglets, onglet Installer, mémoire locale |
| `src/controls.js` | Un contrôle par type de token |
| `src/sandbox.js` | Iframe de démo, patch CSS à chaud, hauteur auto |
| `src/styles.js` | Feuille de style injectée |
| `demo/index.html` | Sujet Forumactif simulé, deux modules d'exemple |
| `demo/paste.html` | Même page chargée avec `pmf.paste.js` |

## Limites connues

- Le JavaScript du module est exécuté dans la démo : ne publiez que des
  modules de confiance.
- Si l'éditeur du forum enveloppe le message dans un `<p>`, un `<div>` dans
  `<pmf-demo>` ferme ce `<p>` et casse la structure : préférer des balises
  inline dans la démo, ou poster en mode HTML.
- Une valeur par défaut ne peut pas contenir `]`, un libellé ne peut pas
  contenir `|`.
