import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Encontra declaração de componente React
  const lines = content.split('\n');
  
  let inComponent = false;
  let componentName = '';
  let earlyReturnFound = false;
  let earlyReturnLine = 0;
  let earlyReturnText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Início de componente: export function / export const / function Nome(
    const compMatch = line.match(/(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][A-Za-z0-9_]+)\s*(?:=|:\s*React\.FC|\()/);
    if (compMatch) {
      inComponent = true;
      componentName = compMatch[1];
      earlyReturnFound = false;
      continue;
    }

    if (!inComponent) continue;

    // Detecta early return no corpo do componente (ex: if (!isOpen) return null;)
    if (
      !earlyReturnFound &&
      (trimmed.startsWith('if (') || trimmed.startsWith('if(')) &&
      (trimmed.includes('return null') || trimmed.includes('return false') || trimmed.includes('return;')) &&
      !trimmed.includes('=>')
    ) {
      // Checa indentação de 2 ou 4 espaços (nível raiz da função do componente)
      const indent = line.search(/\S/);
      if (indent === 2 || indent === 4) {
        earlyReturnFound = true;
        earlyReturnLine = i + 1;
        earlyReturnText = trimmed;
      }
    }

    // Se já encontrou early return no nível do componente, procura hooks depois
    if (earlyReturnFound) {
      if (/\b(useState|useEffect|useMemo|useCallback|useRef|useContext)\s*\(/.test(line)) {
        console.log(`🚨 VIOLAÇÃO DAS REGRAS DOS HOOKS ENCONTRADA:`);
        console.log(`   Arquivo: ${filePath}`);
        console.log(`   Componente: ${componentName}`);
        console.log(`   Linha ${earlyReturnLine}: ${earlyReturnText}`);
        console.log(`   Linha ${i + 1}: ${trimmed}`);
        console.log('----------------------------------------------------');
      }
    }

    // Fim de componente
    if (line.startsWith('}') || line.startsWith('export default')) {
      inComponent = false;
      earlyReturnFound = false;
    }
  }
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(res);
      }
    } else if (res.endsWith('.tsx')) {
      checkFile(res);
    }
  }
}

console.log('Escaneando todos os componentes .tsx do projeto...\n');
scanDir('src');
console.log('Escaneamento concluído.');

