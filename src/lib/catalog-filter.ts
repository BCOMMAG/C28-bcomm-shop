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

interface NormalizedProductBinding {
  categoryId?: string;
  category: string;
  subcategory?: string;
  nodeId?: string;
  subcategoriaPath?: string[];
  caminhoCompleto?: string;
}

/**
 * Extrai todos os vínculos de categoria/subcategoria de um produto
 * (categoria principal + categorias adicionais em `product.categories`, incluindo trilhas N-níveis).
 */
export function getProductCategoryBindings(product: Product): NormalizedProductBinding[] {
  const bindings: NormalizedProductBinding[] = [];
  const seen = new Set<string>();

  const pushBinding = (
    categoryId?: string,
    category?: string | null,
    subcategory?: string | null,
    nodeId?: string | null,
    subcategoriaPath?: string[] | null,
    caminhoCompleto?: string | null
  ) => {
    const id = (categoryId || '').trim();
    const cat = (category || '').trim();
    const cleanPath = Array.isArray(subcategoriaPath)
      ? subcategoriaPath.map((s) => String(s || '').trim()).filter(Boolean)
      : [];
    const sub = (subcategory || '').trim() || (cleanPath.length > 0 ? cleanPath[cleanPath.length - 1] : '');
    const nId = (nodeId || '').trim();
    const pathFull = (caminhoCompleto || '').trim();

    if (!id && !cat && !sub && !nId && cleanPath.length === 0) return;
    const pathKey = cleanPath.length > 0 ? cleanPath.map((s) => s.toLowerCase()).join('>') : sub.toLowerCase();
    const key = `${id}::${nId || pathKey}::${cat.toLowerCase()}::${sub.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    bindings.push({
      categoryId: id || undefined,
      category: cat,
      subcategory: sub || undefined,
      nodeId: nId || undefined,
      subcategoriaPath: cleanPath.length > 0 ? cleanPath : sub ? [sub] : undefined,
      caminhoCompleto: pathFull || undefined
    });
  };

  pushBinding(
    product.categoryId,
    product.category,
    product.subcategory,
    product.subcategoryNodeId,
    product.subcategoryPath,
    product.categoryPath
  );
  if (Array.isArray(product.categories)) {
    for (const extra of product.categories) {
      if (extra) {
        pushBinding(
          extra.categoria_id,
          extra.categoria_nome,
          extra.subcategoria,
          extra.node_id,
          extra.subcategoria_path,
          extra.caminho_completo
        );
      }
    }
  }

  return bindings;
}

function matchesSingleBindingCategory(
  binding: NormalizedProductBinding,
  productFabric: string | undefined,
  productFit: string | undefined,
  categoryTerm: string,
  categoryTree: CategoriaNode[]
): boolean {
  const catLower = (categoryTerm || '').trim().toLowerCase();
  const catNorm = normalizeCatString(categoryTerm);
  if (!catLower && !catNorm) return true;

  const hasKnownNodeInTree = Boolean(
    binding.nodeId && categoryTree.some((n) => n.id === binding.nodeId)
  );

  // 1. Resolução Recursiva via Árvore de Categorias (N1, N2, N3, N4...)
  if (categoryTree.length > 0) {
    const matchedNodes = findMatchingTreeNodes(categoryTerm, categoryTree);
    for (const matchedNode of matchedNodes) {
      const allowedIds = getDescendantCategoryIdsLocal(matchedNode.id, categoryTree);

      // Quando o vínculo possui nodeId exato presente na árvore, ele resolve sem ambiguidade entre ramificações irmãs
      if (hasKnownNodeInTree && binding.nodeId) {
        if (allowedIds.includes(binding.nodeId)) return true;
        continue;
      }

      if (binding.categoryId && allowedIds.includes(binding.categoryId)) return true;

      const allowedNodes = categoryTree.filter((n) => allowedIds.includes(n.id));
      const allowedNames = allowedNodes.map((n) => n.nome.toLowerCase());
      const allowedNamesNorm = allowedNodes.map((n) => normalizeCatString(n.nome));
      const allowedSlugsNorm = allowedNodes.map((n) => normalizeCatString(n.slug));

      if (binding.category) {
        const pCatLower = binding.category.toLowerCase();
        const pCatNorm = normalizeCatString(binding.category);
        if (
          allowedNames.includes(pCatLower) ||
          allowedNamesNorm.includes(pCatNorm) ||
          allowedSlugsNorm.includes(pCatNorm)
        ) {
          return true;
        }
      }

      if (binding.subcategoriaPath && binding.subcategoriaPath.length > 0) {
        const pathMatch = binding.subcategoriaPath.some((seg) => {
          const sLower = seg.toLowerCase();
          const sNorm = normalizeCatString(seg);
          return (
            allowedNames.includes(sLower) ||
            allowedNamesNorm.includes(sNorm) ||
            allowedSlugsNorm.includes(sNorm)
          );
        });
        if (pathMatch) return true;
      }

      if (binding.subcategory) {
        const pSubLower = binding.subcategory.toLowerCase();
        const pSubNorm = normalizeCatString(binding.subcategory);
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

  // Correspondência direta na trilha N-níveis quando a árvore não resolveu
  if (
    binding.subcategoriaPath &&
    binding.subcategoriaPath.some(
      (seg) => seg.toLowerCase() === catLower || normalizeCatString(seg) === catNorm
    )
  ) {
    return true;
  }

  const pCatNorm = normalizeCatString(binding.category);
  const pSubNorm = normalizeCatString(binding.subcategory);

  // 2. Fallbacks de Compatibilidade com links antigos do menu / tags legadas
  if (catLower === 'acessórios' || catLower === 'acessorios' || catNorm === 'acessorios') {
    return (
      pCatNorm === 'acessorios' ||
      CATEGORIES_ACESSORIOS.some((ac) => normalizeCatString(ac) === pCatNorm) ||
      Boolean(binding.subcategory && CATEGORIES_ACESSORIOS.some((ac) => normalizeCatString(ac) === pSubNorm))
    );
  }
  if (catNorm === 'tricots' || catNorm === 'tricot') {
    return (
      pCatNorm.includes('tricot') ||
      pSubNorm.includes('tricot') ||
      Boolean(productFabric && normalizeCatString(productFabric).includes('tricot'))
    );
  }
  if (catNorm === 'alfaiataria') {
    return (
      pCatNorm.includes('alfaiataria') ||
      pSubNorm.includes('alfaiataria') ||
      Boolean(productFit && normalizeCatString(productFit).includes('alfaiataria')) ||
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
    binding.category.toLowerCase() === catLower ||
    pCatNorm === catNorm ||
    Boolean(binding.subcategory && (binding.subcategory.toLowerCase() === catLower || pSubNorm === catNorm)) ||
    Boolean(pCatNorm && catNorm && (pCatNorm.includes(catNorm) || catNorm.includes(pCatNorm))) ||
    Boolean(pSubNorm && catNorm && (pSubNorm.includes(catNorm) || catNorm.includes(pSubNorm)))
  );
}

/**
 * Verifica se um produto pertence a uma categoria em qualquer um dos seus vínculos (principal ou adicionais).
 */
export function matchesCategoryFilter(
  product: Product,
  categoryTerm: string,
  categoryTree: CategoriaNode[] = []
): boolean {
  const catLower = (categoryTerm || '').trim().toLowerCase();
  const catNorm = normalizeCatString(categoryTerm);
  if (!catLower && !catNorm) return true;

  const bindings = getProductCategoryBindings(product);
  return bindings.some((b) =>
    matchesSingleBindingCategory(b, product.fabric, product.fit, categoryTerm, categoryTree)
  );
}

/**
 * Verifica se um produto corresponde a uma subcategoria em qualquer um dos seus vínculos.
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

  const bindings = getProductCategoryBindings(product);

  for (const binding of bindings) {
    const hasKnownNodeInTree = Boolean(
      binding.nodeId && categoryTree.some((n) => n.id === binding.nodeId)
    );

    if (categoryTree.length > 0) {
      const subNodes = findMatchingTreeNodes(subTerm, categoryTree);
      if (subNodes.length > 0) {
        let matchedByKnownNode = false;
        for (const subNode of subNodes) {
          const allowedIds = getDescendantCategoryIdsLocal(subNode.id, categoryTree);
          if (hasKnownNodeInTree && binding.nodeId) {
            if (allowedIds.includes(binding.nodeId)) return true;
            if (includeCategoryMatch && binding.categoryId && allowedIds.includes(binding.categoryId)) {
              return true;
            }
            matchedByKnownNode = true;
            continue;
          }

          if (binding.categoryId && allowedIds.includes(binding.categoryId)) return true;

          const allowedNodes = categoryTree.filter((n) => allowedIds.includes(n.id));
          const allowedNamesNorm = allowedNodes.map((n) => normalizeCatString(n.nome));
          if (
            binding.subcategoriaPath &&
            binding.subcategoriaPath.some((seg) => allowedNamesNorm.includes(normalizeCatString(seg)))
          ) {
            return true;
          }
          if (binding.subcategory && allowedNamesNorm.includes(normalizeCatString(binding.subcategory))) return true;
          if (includeCategoryMatch && binding.category && allowedNamesNorm.includes(normalizeCatString(binding.category))) {
            return true;
          }
        }
        if (matchedByKnownNode) {
          // O produto tem nodeId exato e NÃO pertence a esta ramificação específica; evita falso positivo por nome repetido
          continue;
        }
      }
    }

    // Verifica todos os níveis gravados na trilha da subcategoria (N2, N3, N4...)
    if (binding.subcategoriaPath && binding.subcategoriaPath.length > 0) {
      const pathMatch = binding.subcategoriaPath.some((seg) => {
        const sLower = seg.trim().toLowerCase();
        const sNorm = normalizeCatString(seg);
        return (
          sLower === subLower ||
          sNorm === subNorm ||
          Boolean(sNorm && subNorm && (sNorm.includes(subNorm) || subNorm.includes(sNorm)))
        );
      });
      if (pathMatch) return true;
    }

    if (binding.subcategory) {
      const pSubLower = binding.subcategory.trim().toLowerCase();
      const pSubNorm = normalizeCatString(binding.subcategory);
      if (
        pSubLower === subLower ||
        pSubNorm === subNorm ||
        Boolean(pSubNorm && subNorm && (pSubNorm.includes(subNorm) || subNorm.includes(pSubNorm)))
      ) {
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
 * Aplica a regra combinada de Categorias + Subcategorias respeitando multi-categorias e o modo escolhido pelo lojista:
 * - `isStrictMode = true` (Vínculo Estrito Ativo): o produto só aparece se pertencer à categoria pai E à subcategoria/categoria alvo.
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
      matchesSubcategoryFilter(product, sub, categoryTree, { includeCategoryMatch: true })
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
