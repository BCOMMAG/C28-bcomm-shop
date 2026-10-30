import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles('src');
console.log(`Auditing ${files.length} TypeScript/React files for Hooks Rules violations...\n`);

const hookRegex = /\b(useState|useEffect|useMemo|useCallback|useRef|useContext|useReducer|useId|useTransition|useDeferredValue)\s*\(/g;
const earlyReturnRegex = /^\s*if\s*\(.*\)\s*return\b/gm;

let violationsCount = 0;

files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let firstReturnLine = -1;
  let firstReturnText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignora returns dentro de callbacks ou funções aninhadas simples
    const trimmed = line.trim();
    if (
      (trimmed.startsWith('if (') || trimmed.startsWith('if(')) &&
      (trimmed.includes('return null') || trimmed.includes('return <') || trimmed.includes('return false') || trimmed.includes('return;')) &&
      !trimmed.includes('=>') &&
      !trimmed.includes('useMemo') &&
      !trimmed.includes('useEffect') &&
      !trimmed.includes('useCallback')
    ) {
      // Verifica indentação típica de nível superior de componente (geralmente 2 ou 4 espaços)
      const indent = line.search(/\S/);
      if (indent >= 2 && indent <= 4) {
        firstReturnLine = i + 1;
        firstReturnText = trimmed;
        break;
      }
    }
  }

  if (firstReturnLine !== -1) {
    // Procura hooks depois de firstReturnLine
    for (let i = firstReturnLine; i < lines.length; i++) {
      const line = lines[i];
      if (hookRegex.test(line)) {
        // Ignora hooks definidos em outro componente mais abaixo
        if (line.includes('function ') || line.includes('const ') && line.includes(' = (')) {
          break;
        }
        console.log(`🚨 VIOLAÇÃO DETECTADA em: ${filePath}`);
        console.log(`   Linha ${firstReturnLine} (Early Return): ${firstReturnText}`);
        console.log(`   Linha ${i + 1} (Hook depois do return): ${line.trim()}`);
        console.log('-------------------------------------------------------------');
        violationsCount++;
      }
    }
  }
});

console.log(`Auditoria concluída. Total de potenciais violações encontradas: ${violationsCount}`);

