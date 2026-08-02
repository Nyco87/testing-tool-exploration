<p align="center">
  <img src="https://github.com/Nyco87/testing-tool-exploration/actions/workflows/playwright.yml/badge.svg" alt="CI">
  <img src="https://github.com/Nyco87/testing-tool-exploration/actions/workflows/e2e.yml/badge.svg" alt="E2E">
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/Nyco87/testing-tool-exploration" alt="GitHub license">
</p>


# testing-tool-exploration

## 🎯 Présentation

Ce repository est mon espace d'exploration personnelle en tant qu'expert qualité senior. L'objectif est d'expérimenter et d'approfondir de nouvelles compétences : outils de test modernes, TypeScript, intégration de l'IA dans les pratiques QA, et pipelines CI/CD.

Le sujet d'étude choisi est l'**API publique Deezer**. Ce choix est délibéré : je travaille chez Deezer, je connais bien le domaine métier, et l'API est publique et [bien documentée](https://developers.deezer.com/api) — ce qui me permet de me concentrer sur les pratiques de test plutôt que sur la découverte fonctionnelle.

---

## 🛠️ Stack technique

| Outil | Rôle |
|---|---|
| **TypeScript** | Typage strict, interfaces, schémas |
| **Playwright** | Framework de test API et E2E browser |
| **k6** | Tests de performance et de montée en charge |
| **Zod** | Validation de schéma des réponses API |
| **GitHub Actions** | Pipelines CI/CD (API automatique + E2E manuel) |
| **Allure** | Rapports de test publiés sur GitHub Pages |
| **Pitwall** | Rapport HTML + historique pour les tests k6 |
| **ts-node** | Exécution des scripts TypeScript sans compilation |

---

## 📁 Structure du repo

```
testing-tool-exploration/
├── .github/
│   └── workflows/
│       ├── playwright.yml       # Pipeline CI/CD API (automatique)
│       └── e2e.yml              # Pipeline E2E (déclenchement manuel)
├── auth/
│   └── .gitkeep                 # Dossier pour session.json (ignoré par git)
├── docs/
│   └── e2e-test-prompt-template.md  # Prompt standard création test E2E
├── fixtures/
│   ├── search-cases.json                  # Cas de test manuels
│   └── ai-generated-search-cases.json     # Cas générés par IA
├── helpers/
│   ├── types.ts                 # Interfaces TypeScript (Track, Artist, Album...)
│   └── schemas.ts               # Schémas Zod pour validation des réponses
├── pages/
│   ├── base-page.ts              # Navigation commune, héritée par toutes les pages
│   ├── home-page.ts              # Flow par défaut + accès création playlist
│   ├── search-page.ts            # Recherche, résultats artiste et tracks
│   ├── artist-page.ts            # Fiche artiste
│   ├── playlist-creation-modal.ts # Choix type playlist, cover, nom, confirmation
│   ├── playlist-page.ts          # Titre, URL, vérification contenu playlist
│   └── track-context-menu.ts     # Ajout d'une track à une playlist
├── scripts/
│   ├── generate-fixtures.ts     # Script de génération de fixtures via LLM
│   └── analyze-specs.ts         # Détection et insertion automatique des allure.id()
└── tests/
    ├── api/
    │   ├── search.spec.ts               # Tests endpoint /search
    │   ├── artist.spec.ts               # Tests endpoint /artist
    │   ├── album.spec.ts                # Tests endpoint /album
    │   ├── chart.spec.ts                # Tests endpoint /chart
    │   ├── track.spec.ts                # Tests endpoint /track
    │   ├── response-time.spec.ts        # Tests temps de réponse
    │   └── search-data-driven.spec.ts   # Tests data-driven (fixtures JSON)
    ├── e2e/
    |   ├── auth.setup.ts                # Login + session (storageState)
    |   ├── flow.spec.ts                 # Scénario : jouer le Flow depuis la home
    |   ├── search-artist.spec.ts        # Scénario : rechercher un artiste
    |   └── create-playlist-add-track.spec.ts  # Scénario : créer une playlist et ajouter une track
    └── performance/
        ├── search.js             # Charge nominale endpoint /search
        ├── artist.js             # Charge nominale endpoint /artist
        ├── charts.js             # Charge nominale endpoint /chart
        └── traffic-spike.js      # Ramp-up 1→50 VUs, distingue vraies erreurs et rate limit
```

---

## 🚀 Lancer les tests

```bash
# Installer les dépendances
npm ci

# Générer les fixtures IA (mock par défaut, brancher ANTHROPIC_API_KEY pour le mode réel)
npm run generate:fixtures

# Lancer les tests API
npm test

# Lancer les tests E2E (nécessite DEEZER_EMAIL et DEEZER_PASSWORD)
DEEZER_EMAIL=xxx DEEZER_PASSWORD=xxx npx playwright test --project=setup --project=e2e
```

---

## ⚙️ Pipelines CI/CD

### Pipeline API — automatique

Déclenché sur chaque push et pull request sur `main`.

```
enforce-allure-ids → generate-fixtures → playwright-test → publish-report
```

1. **enforce-allure-ids** — analyse les fichiers spec, insère automatiquement les `allure.id()` manquants et commite les modifications
2. **generate-fixtures** — génère les cas de test via LLM et les passe au job suivant via artifact
3. **playwright-test** — récupère les fixtures et exécute la suite de tests API Playwright
4. **publish-report** — génère le rapport Allure et le déploie sur GitHub Pages

### Pipeline E2E — manuel

Déclenché manuellement via `workflow_dispatch` (Actions → E2E Tests → Run workflow).

```
e2e-test → publish-e2e-report
```

1. **e2e-test** — login Deezer via storageState, exécute les 3 scénarios E2E
2. **publish-e2e-report** — génère et déploie le rapport Allure E2E

> Les tests E2E sont déclenchés manuellement pour éviter les faux positifs liés aux mécanismes anti-bot de Deezer (security check, détection d'IP).

---

### Pipeline complet — manuel

Déclenché manuellement via `workflow_dispatch` (Actions → Full Suite → Run workflow). Lance API, E2E et Performance dans le même run, chacun sur sa propre branche de jobs indépendante.

```
enforce-allure-ids ─┬─→ generate-fixtures → playwright-test → publish-report
                     └─→ e2e-test → publish-e2e-report

performance-test (indépendant, démarre en parallèle des deux branches ci-dessus)
```

1. **enforce-allure-ids** — prérequis partagé par les branches API et E2E
2. **performance-test** — exécute les 4 scripts k6 **séquentiellement** (pas en parallèle) pour éviter que les charges cumulées ne se contaminent (rate limit prématuré, p95 faussé) ; génère un rapport [Pitwall](https://github.com/florin-stefan/pitwall-k6) par script, avec historique persistant sur GitHub Pages sous `/performance/`

> Ce workflow est un troisième fichier autonome (`full-suite.yml`), distinct de `playwright.yml` et `e2e.yml` qui continuent de fonctionner indépendamment selon leurs déclenchements habituels (push automatique / manuel séparé).
---

## 🏗️ Architecture E2E — Page Object Model

Les tests E2E suivent le pattern **Page Object Model (POM) classique** : chaque page ou composant de l'interface Deezer est représenté par une classe TypeScript qui encapsule ses locators et les actions/vérifications associées. Les fichiers de test (`*.spec.ts`) ne contiennent aucun sélecteur brut — ils orchestrent des appels de méthodes métier (`searchPage.searchFor(query)`, `playlistPage.expectTrackPresent(title)`).

**Bénéfices concrets sur ce projet :**
- Un changement de sélecteur côté Deezer se corrige à un seul endroit, pas dans chaque spec qui l'utilise
- Les tests se lisent comme une séquence d'actions métier, indépendamment du détail d'implémentation
- Chaque Page Object peut être réutilisé dans plusieurs scénarios (`SearchPage` est consommé par 2 des 3 specs E2E)

**Choix d'architecture assumé :** le POM classique (locators + actions + assertions dans la même classe) a été préféré au Screenplay Pattern, plus adapté à des suites de tests volumineuses avec réutilisation de locators entre rôles utilisateurs — un cas d'usage qui ne se justifie pas encore à cette échelle de projet.

**Dette technique documentée :** trois méthodes liées aux résultats de recherche (`getFirstTrackTitle()`, `openFirstTrackContextMenu()`, `scrollToSearchResultsSection()`) vivent temporairement dans `SearchPage`, en attendant une future `DataGridPage` dédiée à la grille de résultats — un refactoring identifié mais volontairement reporté.

---

## 📊 Rapports de test

| Suite | Lien |
|---|---|
| **API** | [Rapport Allure API](https://nyco87.github.io/testing-tool-exploration/api/) |
| **E2E** | [Rapport Allure E2E](https://nyco87.github.io/testing-tool-exploration/e2e/) |
| **Performance — search** | [Rapport Pitwall](https://nyco87.github.io/testing-tool-exploration/performance/search/) |
| **Performance — artist** | [Rapport Pitwall](https://nyco87.github.io/testing-tool-exploration/performance/artist/) |
| **Performance — charts** | [Rapport Pitwall](https://nyco87.github.io/testing-tool-exploration/performance/charts/) |
| **Performance — traffic spike** | [Rapport Pitwall](https://nyco87.github.io/testing-tool-exploration/performance/traffic-spike/) |

---

## 🤖 AI-Assisted Testing

Ce projet intègre l'IA générative comme outil d'assistance tout au long du processus de test, dans quatre cas d'usage distincts.

### 1. Génération de scripts de test API

Les specs de base ont été scaffoldées via prompt, en partant de la documentation de l'API Deezer. Exemple de prompt utilisé :

```
Je construis une suite de tests API en TypeScript avec Playwright pour tester
l'API publique Deezer (https://developers.deezer.com/api).
Dans le dossier tests/api, crée un fichier search.spec.ts avec 3 tests :
1. GET /search?q=daftpunk retourne un status 200 et un tableau data non vide
2. GET /search?q=daftpunk retourne des objets avec les champs id, title, artist
3. GET /search?q=zzzzinexistant retourne un status 200 avec un tableau data vide
Utiliser request fixture de Playwright, pas fetch natif.
Ajouter un expect sur le Content-Type application/json.
```

Le code généré a ensuite été revu, adapté et enrichi manuellement — typage TypeScript strict, validation Zod, organisation en helpers réutilisables.

### 2. Génération de scripts de test E2E

Les scénarios E2E ont été générés via un prompt standard reproductible, documenté dans [`docs/e2e-test-prompt-template.md`](./docs/e2e-test-prompt-template.md). Le process combine :

- Conception des steps en format `[Action] / [Result]`
- Inspection du DOM via Playwright Codegen et DevTools
- Génération IA avec le prompt standard + screenshots
- Review et validation manuelle

Exemple de prompt pour le scénario "Access to an Artist via the Search Best Result" :

```
You are a Playwright TypeScript automation expert.
I am building an E2E test suite on deezer.com.
The user session is already loaded via storageState.

Title: Access to an Artist via the Search Best Result

Step 1 - [Pre-requisit] User is logged in and home page is displayed
Step 2 - [Action] Search for artist "${artistName}"
Step 3 - [Result] Search result page is displayed and artist is found as Best Result
Step 4 - [Action] Click on Artist Best Result
Step 5 - [Result] The right artist page is displayed
```
**Retour d'expérience sur le refactoring POM :** la migration des specs E2E vers le pattern Page Object Model a été menée par prompting itératif, en fournissant à l'IA un Page Object déjà validé comme référence de style. Cette approche s'est révélée nettement plus fiable que le prompting par screenshots utilisé initialement pour la génération de `create-playlist-add-track.spec.ts` — sur ce scénario complexe (gestion conditionnelle d'une modale, recherche dans un sous-menu), les captures d'écran seules produisaient une instabilité importante dans le choix des sélecteurs, nécessitant de nombreuses retouches manuelles.

### 3. Assistance itérative au code

L'IA a été utilisée en mode pair programming pour valider des choix d'implémentation : review de code, debugging TypeScript, conception des workflows GitHub Actions. L'approche privilégiée est de soumettre le code existant à l'IA pour critique plutôt que de lui demander de générer from scratch.

### 4. Génération de fixtures de test

Un script `scripts/generate-fixtures.ts` appelle un LLM pour générer des cas de recherche variés (multilingues, caractères spéciaux, edge cases, zero results...) à partir des schémas Zod existants.

```
A partir des schémas dans schemas.ts et de la fixture search-cases.json,
génère un script documenté qui permet de générer des cas de tests variés
pour la search. Tu peux en proposer des nouveaux.
```

La réponse du LLM est systématiquement validée par Zod avant écriture sur disque — l'IA génère, le schéma valide.

---

## ⚡ Performance Testing — k6

Trois scripts couvrent la charge nominale sur les endpoints clés (`search`, `artist`, `chart`), avec des thresholds calibrés sur l'observation réelle plutôt que sur des valeurs génériques — par exemple un seuil p95 à 500ms sur `search`/`artist` alors que le p95 observé tourne autour de 250ms : une marge confortable mais pas arbitrairement large.

### Découverte : le rate limit Deezer ne renvoie pas de 429

L'API publique Deezer applique un rate limit non documenté qui répond en **HTTP 200** avec un corps JSON d'erreur (`{"error":{"type":"Exception","message":"Quota limit exceeded","code":4}}`), plutôt qu'un statut 429 classique. Un check basé uniquement sur le status code passe donc à côté de cette limite — il faut parser le body pour la détecter.

### Scénario de pic de trafic (`traffic-spike.js`)

Ramp-up progressif de 1 à 50 VUs sur 2 minutes, avec une distinction explicite entre trois cas à chaque requête :
- **Vraie erreur** : statut 5xx, JSON invalide, ou erreur applicative autre que le rate limit
- **Rate limit propre** : statut 200 avec `error.code === 4` — comptabilisé séparément, non pénalisant
- **Succès nominal**

Le threshold CI ne porte que sur le taux de vraies erreurs (`rate<1%`), pas sur le rate limit lui-même — l'objectif est de vérifier que l'API **dégrade proprement** sous forte charge plutôt que de casser.

**Résultat observé** : jusqu'à 58% de requêtes rate-limitées sous 50 VUs, pour 0% de vraies erreurs — confirmant que Deezer absorbe le pic sans panne, uniquement en throttlant.

> Les scripts k6 s'exécutent indépendamment de la suite Playwright et ne génèrent pas de rapport Allure — leur reporting est prévu via Grafana Cloud (à venir).

---

## 📈 Métriques

Les métriques du projet (couverture d'endpoints, temps de réponse, fixtures générées) sont suivies dans [METRICS.md](./METRICS.md).

> Stack IA utilisée :
> - Claude (Anthropic) — modèle Sonnet (4.6, 5)
> - Cursor AI — modèle Composer 2.5
> - Copilot (Microsoft) — modèle Smart