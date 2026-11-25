import type { Product } from '../types';
import type { CategoriaNode } from '../types/database';
import { CATEGORIES_ACESSORIOS } from '../data/products';

/**
 * Normaliza strings de categoria/subcategoria removendo acentos, espaços extras e diferenciando apenas conteúdo semântico.
 */
export function normalizeCatString(str?: string | null): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Retorna todos os IDs descendentes de um nó na árvore de categorias (com proteção anti-ciclo).
 */
export function getDescendantCategoryIdsLocal(nodeId: string, tree: CategoriaNode[]): string[] {
  const ids: string[] = [nodeId];
  const visited = new Set<string>([nodeId]);

  const walk = (currentId: string) => {
    for (const node of tree) {
      if (node.parent_id === currentId && !visited.has(node.id)) {
        visited.add(node.id);
        ids.push(node.id);
        walk(node.id);
      }
    }
  };

  walk(nodeId);
  return ids;
}

function findMatchingTreeNodes(term: string, categoryTree: CategoriaNode[]): CategoriaNode[] {
  const termLower = (term || '').trim().toLowerCase();
  const termNorm = normalizeCatString(term);
  if (!termLower && !termNorm) return [];

  return categoryTree.filter(
    (n) =>
      n.id === term ||
      (n.slug || '').toLowerCase() === termLower ||
      (n.nome || '').toLowerCase() === termLower ||
      (termNorm !== '' && normalizeCatString(n.slug) === termNorm) ||
      (termNorm !== '' && normalizeCatString(n.nome) === termNorm)
  );
}

/**
 * Verifica se um produto pertence a uma categoria (ou a qualquer descendente dela na árvore).
 */
export function matchesCategoryFilter(
  product: Product,
  categoryTerm: string,
  categoryTree: CategoriaNode[] = []
): boolean {
  const catLower = (categoryTerm || '').trim().toLowerCase();
  const catNorm = normalizeCatString(categoryTerm);
  if (!catLower && !catNorm) return true;

  // 1. Resolução Recursiva via Árvore de Categorias
  if (categoryTree.length > 0) {
    const matchedNodes = findMatchingTreeNodes(categoryTerm, categoryTree);
    for (const matchedNode of matchedNodes) {
      const allowedIds = getDescendantCategoryIdsLocal(matchedNode.id, categoryTree);
      const allowedNodes = categoryTree.filter((n) => allowedIds.includes(n.id));
      const allowedNames = allowedNodes.map((n) => n.nome.toLowerCase());
      const allowedNamesNorm = allowedNodes.map((n) => normalizeCatString(n.nome));
      const allowedSlugsNorm = allowedNodes.map((n) => normalizeCatString(n.slug));

      if (product.categoryId && allowedIds.includes(product.categoryId)) return true;

      if (product.category) {
        const pCatLower = product.category.toLowerCase();
        const pCatNorm = normalizeCatString(product.category);
        if (
          allowedNames.includes(pCatLower) ||
          allowedNamesNorm.includes(pCatNorm) ||
          allowedSlugsNorm.includes(pCatNorm)
        ) {
          return true;
        }
      }

      if (product.subcategory) {
        const pSubLower = product.subcategory.toLowerCase();
        const pSubNorm = normalizeCatString(product.subcategory);
        if (
          allowedNames.includes(pSubLower) ||
          allowedNamesNorm.includes(pSubNorm) ||
          allowedSlugsNorm.includes(pSubNorm)
        ) {
          return true;
        }
      }
    }
  }

  const pCatNorm = normalizeCatString(product.category);
  const pSubNorm = normalizeCatString(product.subcategory);

  // 2. Fallbacks de Compatibilidade com links antigos do menu / tags legadas
  if (catLower === 'acessórios' || catLower === 'acessorios' || catNorm === 'acessorios') {
    return (
      pCatNorm === 'acessorios' ||
      CATEGORIES_ACESSORIOS.some((ac) => normalizeCatString(ac) === pCatNorm) ||
      Boolean(product.subcategory && CATEGORIES_ACESSORIOS.some((ac) => normalizeCatString(ac) === pSubNorm))
    );
  }
  if (catNorm === 'tricots' || catNorm === 'tricot') {
    return (
      pCatNorm.includes('tricot') ||
      pSubNorm.includes('tricot') ||
      Boolean(product.fabric && normalizeCatString(product.fabric).includes('tricot'))
    );
  }
  if (catNorm === 'alfaiataria') {
    return (
      pCatNorm.includes('alfaiataria') ||
      pSubNorm.includes('alfaiataria') ||
      Boolean(product.fit && normalizeCatString(product.fit).includes('alfaiataria')) ||
      pCatNorm.includes('blazer') ||
      pSubNorm.includes('blazer')
    );
  }
  if (catNorm.includes('casaco') || catNorm.includes('jaqueta')) {
    return (
      pCatNorm.includes('casaco') ||
      pCatNorm.includes('jaqueta') ||
      pSubNorm.includes('casaco') ||
      pSubNorm.includes('jaqueta')
    );
  }
  if (catNorm.includes('saia') || catNorm.includes('short')) {
    return (
      pCatNorm.includes('saia') ||
      pCatNorm.includes('short') ||
      pCatNorm.includes('bermuda') ||
      pSubNorm.includes('saia') ||
      pSubNorm.includes('short') ||
      pSubNorm.includes('bermuda')
    );
  }
  if (catNorm.includes('vestido') || catNorm.includes('macacao')) {
    return (
      pCatNorm.includes('vestido') ||
      pCatNorm.includes('macacao') ||
      pSubNorm.includes('vestido') ||
      pSubNorm.includes('macacao')
    );
  }
  if (catNorm === 'vestidos' || catNorm === 'vestido') {
    return pCatNorm.includes('vestido') || pSubNorm.includes('vestido');
  }
  if (catNorm === 'blusas' || catNorm === 'blusa') {
    return (
      pCatNorm.includes('blusa') ||
      pCatNorm.includes('camisa') ||
      pCatNorm.includes('top') ||
      pSubNorm.includes('blusa') ||
      pSubNorm.includes('camisa') ||
      pSubNorm.includes('top')
    );
  }
  if (catNorm === 'calcas' || catNorm === 'calca') {
    return pCatNorm.includes('calca') || pSubNorm.includes('calca');
  }

  return (
    (product.category || '').toLowerCase() === catLower ||
    pCatNorm === catNorm ||
    Boolean(product.subcategory && (product.subcategory.toLowerCase() === catLower || pSubNorm === catNorm)) ||
    Boolean(pCatNorm && catNorm && (pCatNorm.includes(catNorm) || catNorm.includes(pCatNorm))) ||
    Boolean(pSubNorm && catNorm && (pSubNorm.includes(catNorm) || catNorm.includes(pSubNorm)))
  );
}

/**
 * Verifica se um produto corresponde a uma subcategoria (ou categoria vinculada quando em modo flexível).
 */
export function matchesSubcategoryFilter(
  product: Product,
  subTerm: string,
  categoryTree: CategoriaNode[] = [],
  options: { includeCategoryMatch?: boolean } = {}
): boolean {
  const { includeCategoryMatch = false } = options;
  const subLower = (subTerm || '').trim().toLowerCase();
  const subNorm = normalizeCatString(subTerm);
  if (!subLower && !subNorm) return true;

  if (product.subcategory) {
    const pSubLower = product.subcategory.trim().toLowerCase();
    const pSubNorm = normalizeCatString(product.subcategory);
    if (
      pSubLower === subLower ||
      pSubNorm === subNorm ||
      Boolean(pSubNorm && subNorm && (pSubNorm.includes(subNorm) || subNorm.includes(pSubNorm)))
    ) {
      return true;
    }
  }

  if (categoryTree.length > 0) {
    const subNodes = findMatchingTreeNodes(subTerm, categoryTree);
    for (const subNode of subNodes) {
      const allowedIds = getDescendantCategoryIdsLocal(subNode.id, categoryTree);
      if (product.categoryId && allowedIds.includes(product.categoryId)) return true;

      const allowedNodes = categoryTree.filter((n) => allowedIds.includes(n.id));
      const allowedNamesNorm = allowedNodes.map((n) => normalizeCatString(n.nome));
      if (product.subcategory && allowedNamesNorm.includes(normalizeCatString(product.subcategory))) return true;
      if (includeCategoryMatch && product.category && allowedNamesNorm.includes(normalizeCatString(product.category))) {
        return true;
      }
    }
  }

  if (includeCategoryMatch) {
    return matchesCategoryFilter(product, subTerm, categoryTree);
  }

  return false;
}

/**
 * Aplica a regra combinada de Categorias + Subcategorias respeitando o modo escolhido pelo lojista:
 * - `isStrictMode = true` (Vínculo Estrito Ativo): o produto só aparece se pertencer à categoria pai E à subcategoria.
 * - `isStrictMode = false` (Modo Flexível / Abrangente): ao navegar por um submenu (ex: Outono/Inverno -> Casacos & Jaquetas),
 *   produtos cuja categoria ou subcategoria corresponda a "Casacos & Jaquetas" aparecem mesmo sem vínculo direto com "Outono/Inverno".
 */
export function matchesCatalogCategoryAndSubcategory(
  product: Product,
  categories: string[],
  subcategories: string[],
  categoryTree: CategoriaNode[] = [],
  isStrictMode: boolean = false
): boolean {
  const hasCats = categories.length > 0;
  const hasSubs = subcategories.length > 0;

  if (!hasCats && !hasSubs) return true;

  if (hasCats && !hasSubs) {
    return categories.some((cat) => matchesCategoryFilter(product, cat, categoryTree));
  }

  if (!hasCats && hasSubs) {
    return subcategories.some((sub) =>
      matchesSubcategoryFilter(product, sub, categoryTree, { includeCategoryMatch: !isStrictMode })
    );
  }

  // Caso combinado: Categoria + Subcategoria
  if (isStrictMode) {
    const matchesParent = categories.some((cat) => matchesCategoryFilter(product, cat, categoryTree));
    if (!matchesParent) return false;
    return subcategories.some((sub) =>
      matchesSubcategoryFilter(product, sub, categoryTree, { includeCategoryMatch: false })
    );
  }

  // Modo Flexível (Inativo): exibe itens que atendem (Categoria + Sub) OU que pertencem diretamente à Sub/Categoria alvo
  const matchesParentAndSub =
    categories.some((cat) => matchesCategoryFilter(product, cat, categoryTree)) &&
    subcategories.some((sub) =>
      matchesSubcategoryFilter(product, sub, categoryTree, { includeCategoryMatch: true })
    );

  if (matchesParentAndSub) return true;

  return subcategories.some(
    (sub) =>
      matchesCategoryFilter(product, sub, categoryTree) ||
      matchesSubcategoryFilter(product, sub, categoryTree, { includeCategoryMatch: true })
  );
}
