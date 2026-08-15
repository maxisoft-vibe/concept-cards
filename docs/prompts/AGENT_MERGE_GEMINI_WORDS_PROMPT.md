# 🎯 PROMPT DE FUSION ET CURATION : NOUVELLES ENTRÉES GEMINI (POUR SOUS-AGENT)

Vous êtes un lexicographe expert de la langue française, de la culture générale francophone et un game designer spécialisé dans le jeu de société **Concept** (Repos Production).

Votre mission est de traiter, nettoyer, filtrer, catégoriser et intégrer l'ensemble des **nouvelles entrées** issues des dossiers `res/words/gemini3-7/`, `res/words/gemini3-7-expr/` et `res/words/gemini3-7-hard/` (préparées dans `res/words/staging_gemini/` sous forme de fichiers `staging_001.json` à `staging_006.json`).

Vous produirez les nouveaux chunks finaux (ex: `chunk_035.json` à `chunk_040.json`) directement dans `res/words/temp_chunks/`, parfaitement conformes aux standards de qualité des chunks 1 à 34.

---

## 1. ENVIRONNEMENT & FICHIERS DU PROJET

- **Chunks existants déjà nettoyés (Passe 3 terminée)** : [`res/words/temp_chunks/chunk_001.json`](file:///d:/maxisoft/PycharmProjects/Concept/res/words/temp_chunks/chunk_001.json) à `chunk_034.json` (~5 115 entrées).
- **Liste des mots rejetés / supprimés** : [`res/words/deleted_words.txt`](file:///d:/maxisoft/PycharmProjects/Concept/res/words/deleted_words.txt).
- **Fichiers sources à traiter** : [`res/words/staging_gemini/staging_001.json`](file:///d:/maxisoft/PycharmProjects/Concept/res/words/staging_gemini/staging_001.json) à `staging_006.json` (1 293 candidats uniques pré-filtrés).
- **Destination finale des nouveaux chunks** : `res/words/temp_chunks/chunk_035.json`, `chunk_036.json`, etc.

---

## 2. FORMAT JSON STANDARD DE SORTIE (STRICT)

Chaque nouveau chunk dans `res/words/temp_chunks/` doit respecter scrupuleusement la structure suivante :

```json
{
  "chunk_id": 35,
  "total_chunks": 40,
  "count": 210,
  "words": [
    {
      "word": "Il y a anguille sous roche",
      "query_indices": [118, 6, 31, 62],
      "y": null,
      "c": 0.4,
      "cc": 0.85,
      "d": 1
    },
    {
      "word": "Panurgisme",
      "query_indices": [13, 9, 1, 6],
      "y": 1552,
      "c": 0.7,
      "cc": 0.6,
      "d": 2
    }
  ]
}
```

### Règles sur les champs :
- **`word`** *(string)* : Terme ou expression en français, propre, sans parenthèses.
- **`query_indices`** *(list[int])* : Liste **ordonnée sémantiquement selon la hiérarchie en 4 niveaux** (voir section 3).
- **`y`** *(int | null)* : Année de création / publication pour les œuvres, inventions ou faits historiques datés (ex: `1998`, `1534`), sinon `null` (⚠️ **les `y: 0` des fichiers bruts doivent obligatoirement être convertis en `null`**).
- **`c`** *(float : 0.0 à 1.0)* : Complexité pour faire deviner le concept sur le plateau Concept (0.0 = très direct/visuel, 1.0 = très abstrait).
- **`cc`** *(float : 0.0 à 1.0)* : Score de notoriété / familiarité publique (1.0 = archi-connu de tous, 0.0 = confidentiel).
- **`d`** *(int : 0, 1 ou 2)* : Difficulté du jeu Concept :
  - **`0` : Facile (🙂)** — Objets du quotidien, animaux, métiers concrets.
  - **`1` : Moyen (😐)** — Personnages célèbres, lieux, œuvres, expressions courantes.
  - **`2` : Difficile (🙁)** — Proverbes complexes, figures de style, mots soutenus/rares, abstractions.

---

## 3. HIÉRARCHIE SÉMANTIQUE STRICTE DE `query_indices` (MÉTHODOLOGIE PASSE 3)

Pour chaque entrée, l'ordre des indices dans `query_indices` **NE DOIT PAS être un tri numérique**, mais un **tri d'importance sémantique décroissante** en 4 niveaux :

```
[ NIVEAU 1 : Concept Racine ] ➔ [ NIVEAU 2 : Contexte / Action ] ➔ [ NIVEAU 3 : Matière / Forme ] ➔ [ NIVEAU 4 : Taille / Couleur ]
```

### 🥇 Niveau 1 — Entité Principale / Catégorie Racine (Obligatoirement en 1ère position)
- **Expressions & Proverbes** : `118` (Général), `114` (Animaux), `115` (Corps), `116` (Nourriture), `117` (Météo), `132-140` (Régionales/Francophonie), `125` (Clichés/Tropes).
- **Jeux, Jouets & Esport** : `124` (Jeu vidéo), `21` (Jeux/Jouets).
- **Médias, Arts & Fictions** : `8` (Musique), `9` (Littérature), `10` (Art visuel/BD), `11` (Cinéma), `12` (Séries/TV), `25` (Fiction/Imaginaire).
- **Humains, Métiers & Rôles** : `1` (Famille/Société), `2` (Femme), `3` (Homme), `4` (Métier/Travail), `40` (Pouvoir/Politique), `41` (Religion/Mythe), `119` (IA/Robot).
- **Faune & Flore** : `6` (Animal), `7` (Plante/Arbre).
- **Lieux & Bâtiments** : `14` (Lieu/Pays), `23` (Maison/Habitat).
- **Objets & Transports** : `0` (Objet), `16` (Marin), `17` (Aérien), `18` (Voiture/Route), `19` (Outils), `20` (Vêtements), `22` (Nourriture).
- **Histoire & Événements** : `24` (Réel/Histoire), `15` (Temps historique/Fête).

### 🥈 Niveau 2 — Contexte / Domaine d'Action / Thématique Secondaire
- Combat/Guerre (`30`), Défense/Protection (`31`), Mort/Tragédie (`32`), Amour/Cœur (`33`), Joie/Fête (`34`), Tristesse (`35`).
- Argent/Richesse (`38`), Temps/Sablier (`39`), Sciences (`42`), Médecine/Soin (`43`), Électronique/Informatique (`37`), Mécanique (`36`).
- Anatomie (`46-53`), Action/Verbe (`101`).

### 🥉 Niveau 3 — Matières, Éléments physiques & Formes géométriques
- **Éléments & Matières** : Feu (`58`), Eau (`59`), Air (`60`), Terre (`61`), Roche (`62`), Bois (`63`), Métal (`64`), Tissus (`65`), Plastique (`66`), Papier (`67`).
- **Formes & Géométrie** : Ligne droite (`76`), Courbe (`77`), Croix (`78`), Zigzag/Pointu (`79`), Spirale (`80`), Cercle (`82`), Étoile (`83`), Triangle (`84`), Plat (`85`), Cube (`88`), Sphère (`87`), Pyramide (`89`), Cylindre (`90`), Cône (`91`), Trou (`92`), Tourner (`100`).

### 🏅 Niveau 4 — Modificateurs, Tailles, Positions & Couleurs (En fin de liste)
- **Tailles & Positions** : Grand (`93`), Petit (`94`), Large (`95`), Étroit/Court (`96`), Monter/Haut (`97`), Descendre/Bas (`98`).
- **Couleurs & Transparence** : Rouge (`102`), Orange (`103`), Jaune (`104`), Vert (`105`), Bleu (`106`), Mauve/Violet (`107`), Rose (`108`), Brun (`109`), Noir (`110`), Gris (`111`), Blanc (`112`), Transparent (`113`).

---

## 4. RÈGLES DE CURATION & EXEMPLES CONCRETS

### 🚫 1. Filtrage strict (DELETE)
- **Hallucinations & Calques** : Supprimez les expressions inexistantes en français ou inventées par l'IA.
- **Micro-détails ultra-spécifiques** : Supprimez les objets mineurs d'un seul épisode ou accessoires anecdotiques.
- **Termes polémiques / haineux / religieux sensibles** : Supprimez.
- 👉 *Tout mot supprimé doit être consigné dans `res/words/deleted_words.txt`.*

### ✂️ 2. Nettoyage des titres (CLEAN)
- **Supprimer les parenthèses** :
  - `Le miroir aux alouettes (expression)` ➡️ **`Le miroir aux alouettes`**
  - `Panurgisme (littérature)` ➡️ **`Panurgisme`**
  - `Tartufferie (théâtre)` ➡️ **`Tartufferie`**
- **Supprimer l'article pour les noms communs et objets** :
  - `La coccinelle` ➡️ **`Coccinelle`**
  - `Le bilboquet` ➡️ **`Bilboquet`**
- **Conserver l'article pour les expressions idiomatiques, proverbes, monuments et œuvres réelles** :
  - ✔️ `Il y a anguille sous roche`
  - ✔️ `Le miroir aux alouettes`
  - ✔️ `Ne pas casser trois pattes à un canard`
  - ✔️ `Le Roi Lion`
  - ✔️ `La Vénus de Milo`

---

## 5. RÉFÉRENTIEL DES 170 THÈMES (`0` à `169`)

| Index | Thème | Index | Thème |
| :---: | :--- | :---: | :--- |
| **0** | Objets, paquets et conteneurs | **85** | Flatness, flat surfaces, smoothness |
| **1** | Famille, société, groupes | **86** | Squares, rectangles and grids |
| **2** | Femmes, féminité et genre féminin | **87** | Spheres, balls and globes |
| **3** | Masculinité et références masculines | **88** | Cube, block and paving stone references |
| **4** | Travail, métiers et professions | **89** | Pyramides et structures pyramidales |
| **5** | Sports & Loisirs | **90** | Cylindre, tube, rouleaux |
| **6** | Faune, monde animal et créatures | **91** | Cône, entonnoir et formes coniques |
| **7** | Flore, plantes et nature végétale | **92** | Creux, trou, perforation, cavité |
| **8** | Musique, chansons et sonorités | **93** | Grandeur et hauteur |
| **9** | Littérature, écriture et livres | **94** | Petitesse, nain, miniature |
| **10** | Art visuel, peinture, sculpture, BD | **95** | Largeur, grosseur, étalement |
| **11** | Cinéma et films | **96** | Finesse, minceur, étroit, court |
| **12** | Télévision, séries et émissions | **97** | Hauteur, élévation, monter |
| **13** | Idées, pensée, création, concept | **98** | Bassesse, bas, descendre |
| **14** | Géographie et culture mondiale | **99** | Latéralité et temporalité |
| **15** | Temps historique, dates, fêtes | **100** | Rotation, cycles, tours |
| **16** | Mer et navigation | **101** | Action et verbe |
| **17** | Ciel, aviation, vol | **102** | Rouge |
| **18** | Automobile et route | **103** | Éléments liés à la couleur orange |
| **19** | Outils, bricolage et construction | **104** | Couleur jaune |
| **20** | Mode, vêtements et costumes | **105** | Couleur verte |
| **21** | Jeux, jouets et ludique | **106** | Bleu |
| **22** | Nourriture et gastronomie | **107** | Éléments mauves et violets |
| **23** | Maison, habitat, foyer | **108** | Couleur rose |
| **24** | Réel et Histoire | **109** | Couleur brune/marron |
| **25** | Fiction, imaginaire, fantastique | **110** | Couleur noire |
| **26** | Enfance, jeunesse, nouveauté | **111** | Gris |
| **27** | Old age, adults, past, antiquity | **112** | Couleur blanche |
| **28** | Lenteur, patience et tortue | **113** | Transparence invisibilité verre |
| **29** | Vitesse et rapidité | **114** | Expressions et proverbes avec animaux |
| **30** | Conflit, guerre, armes, combat | **115** | Expressions & métaphores avec le corps |
| **31** | Défense et protection | **116** | Expressions et proverbes culinaires |
| **32** | Mort, Mal, Maladie et Tragédie | **117** | Expressions météo et éléments |
| **33** | Vie, Amour, Cœur, Affection | **118** | Proverbes et adages |
| **34** | Joie, bonheur, sourire, positivité | **119** | IA, Robots, Automates |
| **35** | Tristesse et mélancolie | **120** | Réseaux sociaux, culture web, viralité |
| **36** | Mechanics, Industry and Gears | **121** | Cyberespace, cybersécurité, piratage |
| **37** | Informatique, électronique, techno | **122** | Conquête spatiale moderne & New Space |
| **38** | Money & Wealth | **123** | Véhicules écologiques & mobilité |
| **39** | Temps et horlogerie | **124** | Jeu vidéo, e-sport, streaming |
| **40** | Pouvoir, politique, royauté | **125** | Clichés et tropes cinéma/séries |
| **41** | Religion, mythes, spiritualité | **126** | Mèmes Internet et culture web |
| **42** | Sciences, chimie, physique, maths | **127** | Objets & gadgets nostalgiques 90-2000 |
| **43** | Médecine, santé, guérison et soins | **128** | Super-pouvoirs, mutations |
| **44** | Titres, marques, noms, notoriété | **129** | Mythes, légendes urbaines |
| **45** | Dialogue, parole, expression | **130** | Voyage temporel / boucles temporelles |
| **46** | Tête et visage | **131** | Véhicules fantastiques de fiction |
| **47** | Mains, Bras, Toucher | **132** | Belgicismes et expressions belges |
| **48** | Corps, torse, ventre, anatomie | **133** | Expressions québécoises |
| **49** | Legs/feet/walking | **134** | Expressions africaines et nouchi |
| **50** | Oreille, son, écoute, ouïe | **135** | Expressions québécoises sur le froid |
| **51** | Nez, odeurs, parfums, olfaction | **136** | Expressions belges festives & culinaires |
| **52** | L'œil, le regard, la vue | **137** | Expressions africaines (relations/fête) |
| **53** | Mouth, lips, taste and tasting | **138** | Expressions maghrébines en français |
| **54** | Météo et froid | **139** | Interjections et jurons doux |
| **55** | Éclair, tempête, électricité | **140** | Faux-amis francophones |
| **56** | Nuit, soir, lune, obscurité | **141** | Œuvres cultes boucle temporelle |
| **57** | Sun, heat, light, day | **142** | Amour homme-machine |
| **58** | Feu et flamme | **143** | Nourriture mortelle et historique |
| **59** | Eau, liquides, monde aquatique | **144** | Sports et loisirs absurdes |
| **60** | Air, Vent, Souffle, Atmosphère | **145** | Super-héros culinaires humoristiques |
| **61** | Terre, sol, monde souterrain | **146** | Expressions animalières culinaires |
| **62** | Roche, minéraux, pierres, dureté | **147** | Morts absurdes de dirigeants |
| **63** | Bois, arbres et forêt | **148** | Objets inanimés qui prennent vie |
| **64** | Métal, métallurgie, alliages | **149** | Créatures marines & vaisseaux fantômes |
| **65** | Tissus, textile et couture | **150** | Clips cultes avec pluie & mélancolie |
| **66** | Plastique, caoutchouc, synthétique | **151** | Disparitions aériennes mystérieuses |
| **67** | Papier, feuilles, imprimerie | **152** | Gadgets vestimentaires fictifs |
| **68** | Opposition, contraire, contraste | **153** | Lieux fictifs effrayants / sorcellerie |
| **69** | Couper, séparer, diviser | **154** | Animaux venimeux couleurs vives |
| **70** | Fragments, multitude, poudre | **155** | Jeux vidéo de guerre historiques |
| **71** | Parties et morceaux | **156** | Remèdes et potions magiques |
| **72** | Intérieur, contenu, inclusion | **157** | Épisodes séries comédie musicale |
| **73** | Prison, grilles, enfermement | **158** | Braquages et évasions réels |
| **74** | Zéro, néant, vide, absence | **159** | Expressions de bug et redémarrage |
| **75** | Unité et singularité | **160** | Phrases anodines à double sens |
| **76** | Ligne droite, droiture, rectitude | **161** | Rituels de la vie en communauté |
| **77** | Courbe, arc, rondeur, flexion | **162** | Métaphores de chimie & potions |
| **78** | Croix, croisement, intersection | **163** | Expressions bricolage pour état mental |
| **79** | Lignes brisées, pointu, accidenté | **164** | Expressions repos forcé & calme |
| **80** | Spirale, folie, ivresse, vertige | **165** | Expressions météo émotionnelle |
| **81** | Vagues, ondulations, sinusoïde | **166** | Déconnexion et isolement |
| **82** | Cercle, rond, ring, anneau | **167** | Jargon de bureau & management |
| **83** | Étoiles, astronomie, célébrité | **168** | Extreme zen / humorous apathy |
| **84** | Triangle, Trinité, Trois | **169** | Métaphores de la vie réelle |

---

## 6. INSTRUCTIONS D'EXÉCUTION PAS À PAS

1. **Prendre chaque fichier** de `res/words/staging_gemini/` (`staging_001.json` à `staging_006.json`).
2. **Pour chaque mot** :
   - Évaluer la validité (supprimer les hallucinations et noter dans `deleted_words.txt`).
   - Nettoyer le titre (`word`), retirer les parenthèses, ajuster l'article initial.
   - Ordonner `query_indices` selon la hiérarchie en 4 niveaux (Niveau 1 racine en tête).
   - Calibrer `y` (convertir `0` en `null` ou année réelle), `c`, `cc` et `d` (0, 1 ou 2).
3. **Écrire les chunks finaux** directement dans `res/words/temp_chunks/chunk_035.json` à `chunk_040.json`.
4. **Lancer la validation** : `python scripts/split_and_manage_words.py validate` pour vérifier la parfaite conformité de tous les chunks.
