/**
 * analyze-specs.ts
 *
 * Analyse les fichiers *.spec.ts et détecte les tests sans allure.id()
 * Génère et insère automatiquement les allure.id() manquants.
 *
 * Usage:
 *   npx ts-node scripts/analyze-specs.ts
 */

import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import ts from 'typescript';

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

const ENDPOINT_MAP: Record<string, string> = {
  'search': 'SCH',
  'artist': 'ART',
  'album': 'ALB',
  'chart': 'CHT',
  'track': 'TRK',
};

const TYPE_MAP: Record<string, string> = {
  'api': 'API',
  'performance': 'PERF',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FoundTest {
  file: string;
  name: string;
  line: number;
  hasAllureId: boolean;
  insideForEach: boolean;
  endpoint?: string;
}

// ---------------------------------------------------------------------------
// Liste récursive des fichiers *.spec.ts (sous-dossiers uniquement)
// ---------------------------------------------------------------------------

export async function listSpecFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listSpecFiles(fullPath);
      }
      if (entry.isFile() && fullPath.endsWith('.spec.ts')) {
        const relativePath = path.relative('tests', fullPath);
        const isInSubfolder = relativePath.includes(path.sep);
        if (isInSubfolder) {
          return [fullPath];
        }
        return [];
      }
      return [];
    })
  );
  return files.flat();
}

// ---------------------------------------------------------------------------
// Analyse AST d'un fichier spec
// ---------------------------------------------------------------------------

export function analyzeSpecFile(filePath: string): FoundTest[] {
  const source = fsSync.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const results: FoundTest[] = [];

  function visit(node: ts.Node, insideForEach = false) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'test'
    ) {
      const testName =
        node.arguments[0] && ts.isStringLiteral(node.arguments[0])
          ? node.arguments[0].text
          : '<unknown>';

      const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const line = pos.line + 1;
      const hasAllureId = findAllureId(node);
      const endpoint = findEndpoint(node);

      results.push({
        file: filePath,
        name: testName,
        line,
        hasAllureId,
        insideForEach,
        endpoint,
      });
    }

    const isForEach =
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'forEach';

    ts.forEachChild(node, (child) => visit(child, insideForEach || isForEach));
  }

  visit(sourceFile);
  return results;
}

// ---------------------------------------------------------------------------
// Détection allure.id()
// ---------------------------------------------------------------------------

function findAllureId(testNode: ts.CallExpression): boolean {
  let found = false;

  function search(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'label'
    ) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg) && firstArg.text === 'AS_ID') {
        found = true;
      }
    }
    // garder aussi la détection allure.id() pour les fichiers déjà migrés
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText() === 'allure' &&
      node.expression.name.text === 'id'
    ) {
      found = true;
    }
    ts.forEachChild(node, search);
  }

  search(testNode);
  return found;
}

// ---------------------------------------------------------------------------
// Détection de l'endpoint (request.get('/search') → 'search')
// ---------------------------------------------------------------------------

function findEndpoint(testNode: ts.CallExpression): string | undefined {
  let endpoint: string | undefined;

  function search(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ['get', 'post', 'put', 'delete', 'patch'].includes(node.expression.name.text)
    ) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        const parts = firstArg.text.split('/').filter(Boolean);
        if (parts.length > 0) {
          endpoint = parts[0];
        }
      }
    }
    ts.forEachChild(node, search);
  }

  search(testNode);
  return endpoint;
}

// ---------------------------------------------------------------------------
// Helpers ID
// ---------------------------------------------------------------------------

function getEndpointCode(endpoint?: string): string {
  if (!endpoint) throw new Error(`Endpoint non détecté — vérifier le test`);
  if (!ENDPOINT_MAP[endpoint]) throw new Error(`Endpoint "${endpoint}" non référencé dans ENDPOINT_MAP`);
  return ENDPOINT_MAP[endpoint];
}

function getTypeCode(filePath: string): string {
  const parts = filePath.split(path.sep);
  const testsIndex = parts.indexOf('tests');
  const subfolder = parts[testsIndex + 1];
  if (!TYPE_MAP[subfolder]) throw new Error(`Type "${subfolder}" non référencé dans TYPE_MAP`);
  return TYPE_MAP[subfolder];
}

function getClassName(filePath: string): string {
  return path.basename(filePath, '.spec.ts');
}

function generateId(test: FoundTest, counter: number): string {
  const type = getTypeCode(test.file);
  const endpoint = getEndpointCode(test.endpoint);
  const className = getClassName(test.file);

  if (test.insideForEach) {
    // L'ID est partiellement statique — le ${category} est résolu au runtime
    return `${type}-${className}-${endpoint}-\${category}`;
  }

  const num = String(counter).padStart(3, '0');
  return `${type}-${className}-${endpoint}-${num}`;
}

function getNextCounter(source: string, type: string, className: string): number {
  const regex = new RegExp(`${type}-${className}-[A-Z]+-([0-9]{3})`, 'g');
  const matches = [...source.matchAll(regex)];
  if (matches.length === 0) return 1;
  const max = Math.max(...matches.map(m => parseInt(m[1])));
  return max + 1;
}

// ---------------------------------------------------------------------------
// Insertion de allure.id() dans le fichier source
// ---------------------------------------------------------------------------

async function insertAllureIds(filePath: string, tests: FoundTest[]): Promise<void> {
  let source = fsSync.readFileSync(filePath, 'utf8');
  const lines = source.split('\n');

  // Vérifier que allure est importé
  const allureImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]allure-js-commons['"]/;
  const hasAllureImport = allureImportRegex.test(source);
  
  if (!hasAllureImport) {
    lines.unshift(`import { label } from 'allure-js-commons';`);
  } else {
    // Ajouter label aux imports existants si absent
    const updatedSource = source.replace(allureImportRegex, (match, imports) => {
      if (imports.includes('label')) return match;
      return match.replace(imports, `${imports.trim()}, label`);
    });
    source = updatedSource;
    lines.splice(0, lines.length, ...updatedSource.split('\n'));
  }

  // Compteur par fichier
  const type = getTypeCode(filePath);
  const className = getClassName(filePath);
  let counter = getNextCounter(source, type, className);

  // Trier par ligne décroissante pour ne pas décaler les indices
  const missing = tests
    .filter((t) => !t.hasAllureId)
    .sort((a, b) => b.line - a.line);

  for (const test of missing) {
    const id = generateId(test, counter++);

    // Trouver la ligne du test et insérer allure.id() après l'ouverture du bloc async
    const testLine = test.line - 1; // 0-indexed
    let insertLine = testLine;

    // Chercher la ligne avec '=> {' ou 'async ({' pour insérer après
    for (let i = testLine; i < Math.min(testLine + 5, lines.length); i++) {
      if (lines[i].includes('=>') && lines[i].includes('{')) {
        insertLine = i + 1;
        break;
      }
    }

    // Détecter l'indentation de la ligne suivante
    const indentation = lines[insertLine].match(/^(\s*)/)?.[1] ?? '        ';

    if (test.insideForEach) {
      lines.splice(insertLine, 0, `${indentation}await label('AS_ID', \`${id}\`);`);
    } else {
      lines.splice(insertLine, 0, `${indentation}await label('AS_ID', '${id}');`);
    }
  }

  const updated = lines.join('\n');
  await fs.writeFile(filePath, updated, 'utf8');
  console.log(`   ✏️  allure.id() insérés dans ${filePath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const specs = await listSpecFiles('tests');
  console.log(`\n🔍 ${specs.length} fichier(s) spec trouvé(s)\n`);

  for (const spec of specs) {
    const tests = analyzeSpecFile(spec);
    const missing = tests.filter((t) => !t.hasAllureId);

    if (missing.length === 0) {
      console.log(`✅ ${spec} — tous les tests ont un allure.id`);
      continue;
    }

    console.log(`⚠️  ${spec} — ${missing.length} test(s) sans allure.id`);
    await insertAllureIds(spec, tests);
  }

  console.log('\n✅ Terminé\n');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});