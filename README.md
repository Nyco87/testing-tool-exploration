![CI](https://github.com/Nyco87/testing-tool-exploration/actions/workflows/playwright.yml/badge.svg)
![E2E](https://github.com/Nyco87/testing-tool-exploration/actions/workflows/e2e.yml/badge.svg)

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
| **Zod** | Validation de schéma des réponses API |
| **GitHub Actions** | Pipelines CI/CD (API automatique + E2E manuel) |
| **Allure** | Rapports de test publiés sur GitHub Pages |
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
    └── e2e/
        ├── auth.setup.ts                # Login + session (storageState)
        ├── flow.spec.ts                 # Scénario : jouer le Flow depuis la home
        ├── search-artist.spec.ts        # Scénario : rechercher un artiste
        └── create-playlist-add-track.spec.ts  # Scénario : créer une playlist et ajouter une track
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

## 📊 Rapports de test

| Suite | Lien |
|---|---|
| **API** | [Rapport Allure API](https://nyco87.github.io/testing-tool-exploration/) |
| **E2E** | [Rapport Allure E2E](https://nyco87.github.io/testing-tool-exploration/e2e/) |

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

## 📈 Métriques

Les métriques du projet (couverture d'endpoints, temps de réponse, fixtures générées) sont suivies dans [METRICS.md](./METRICS.md).

> Stack IA utilisée :
> - Claude (Anthropic) — modèle Sonnet
> - Cursor AI — modèle Composer 2.5
> - Copilot (Microsoft) — modèle Smart