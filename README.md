![CI](https://github.com/Nyco87/testing-tool-exploration/actions/workflows/playwright.yml/badge.svg)

# testing-tool-exploration

## 🎯 Présentation

Ce repository est mon espace d'exploration personnelle en tant qu'expert qualité senior. L'objectif est d'expérimenter et d'approfondir de nouvelles compétences : outils de test modernes, TypeScript, intégration de l'IA dans les pratiques QA, et pipelines CI/CD.

Le sujet d'étude choisi est l'**API publique Deezer**. Ce choix est délibéré : je travaille chez Deezer, je connais bien le domaine métier, et l'API est publique et [bien documentée](https://developers.deezer.com/api) — ce qui me permet de me concentrer sur les pratiques de test plutôt que sur la découverte fonctionnelle.

---

## 🛠️ Stack technique

| Outil | Rôle |
|---|---|
| **TypeScript** | Typage strict, interfaces, schémas |
| **Playwright** | Framework de test API (`request` fixture) |
| **Zod** | Validation de schéma des réponses API |
| **GitHub Actions** | Pipeline CI/CD en 3 jobs chaînés |
| **Allure** | Rapport de test publié sur GitHub Pages |
| **ts-node** | Exécution des scripts TypeScript sans compilation |

---

## 📁 Structure du repo

```
testing-tool-exploration/
├── .github/
│   └── workflows/
│       └── playwright.yml       # Pipeline CI/CD (3 jobs)
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
    └── api/
        ├── search.spec.ts               # Tests endpoint /search
        ├── artist.spec.ts               # Tests endpoint /artist
        ├── album.spec.ts                # Tests endpoint /album
        └── search-data-driven.spec.ts   # Tests data-driven (fixtures JSON)
```

---

## 🚀 Lancer les tests

```bash
# Installer les dépendances
npm ci

# Générer les fixtures IA (mock par défaut, brancher ANTHROPIC_API_KEY pour le mode réel)
npm run generate:fixtures

# Lancer les tests
npm test
```

---

## ⚙️ Pipeline CI/CD

Le pipeline GitHub Actions est composé de 4 jobs chaînés :

```
enforce-allure-ids → generate-fixtures → playwright-test → publish-report
```

1. **enforce-allure-ids** — analyse les fichiers spec, insère automatiquement les `allure.id()` manquants et commite les modifications
2. **generate-fixtures** — génère les cas de test via LLM et les passe au job suivant via artifact
3. **playwright-test** — récupère les fixtures et exécute la suite de tests Playwright
4. **publish-report** — génère le rapport Allure et le déploie sur GitHub Pages

## 📊 Rapport de test

[Voir le rapport Allure](https://nyco87.github.io/testing-tool-exploration/)

---

## 🤖 AI-Assisted Testing

Ce projet intègre l'IA générative comme outil d'assistance tout au long du processus de test, dans trois cas d'usage distincts.

### 1. Génération de scripts de test

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

### 2. Assistance itérative au code

L'IA a été utilisée en mode pair programming pour valider des choix d'implémentation : review de code, debugging TypeScript, conception du workflow GitHub Actions. L'approche privilégiée est de soumettre le code existant à l'IA pour critique plutôt que de lui demander de générer from scratch — ce qui permet de garder la maîtrise des décisions techniques.

### 3. Génération de fixtures de test

Un script `scripts/generate-fixtures.ts` appelle un LLM pour générer des cas de recherche variés (multilingues, caractères spéciaux, edge cases, zero results...) à partir des schémas Zod existants.

Prompt utilisé :

```
A partir des schémas dans schemas.ts et de la fixture search-cases.json,
génère un script documenté qui permet de générer des cas de tests variés
pour la search. Tu peux en proposer des nouveaux.
```

La réponse du LLM est systématiquement validée par Zod avant écriture sur disque — l'IA génère, le schéma valide. Le script est intégré en premier job du pipeline CI, avant l'exécution des tests.

## 📈 Métriques

Les métriques du projet (couverture d'endpoints, temps de réponse, fixtures générées) sont suivies dans [METRICS.md](./METRICS.md).

> Stack IA utilisée :
> Claude (Anthropic) — modèle Sonnet
> Cursor AI — modèle Composer 2.5
> Copilot (Microsoft) — modèle Smart