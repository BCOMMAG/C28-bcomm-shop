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
 * Avalia correspondência semântica entre nomes de categorias e termos (suporta compostos como "Blusas & Tops" com "Blusas").
 */
export function isSemanticCategoryMatch(nameA?: string | null, nameB?: string | null): boolean {
  if (!nameA || !nameB) return false;
  const normA = normalizeCatString(nameA);
  const normB = normalizeCatString(nameB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const tokensA = normA.split(/[\s&/]+/).filter((t) => t.length > 2);
  const tokensB = normB.split(/[\s&/]+/).filter((t) => t.length > 2);

  if (tokensA.includes(normB) || tokensB.includes(normA)) return true;
  return tokensA.some((ta) => tokensB.includes(ta));
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
      (termNorm !== '' && normalizeCatString(n.nome) === termNorm) ||
      (termNorm !== '' && isSemanticCategoryMatch(n.nome, term)) ||
      (termNorm !== '' && isSemanticCategoryMatch(n.slug, term))
  );
}

export interface NormalizedProductBinding {
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

/**
 * Encontra a categoria raiz ancestral de um nó na árvore.
 */
export function getRootCategoryNodeLocal(nodeId: string, tree: CategoriaNode[]): CategoriaNode | null {
  let curr = tree.find((n) => n.id === nodeId);
  if (!curr) return null;
  const visited = new Set<string>();
  while (curr.parent_id && !visited.has(curr.id)) {
    visited.add(curr.id);
    const parent = tree.find((n) => n.id === curr!.parent_id);
    if (!parent) break;
    curr = parent;
  }
  return curr;
}

/**
 * Avalia se um vínculo específico do produto pertence estritamente a um nó da árvore (raiz ou ramificação filha).
 * Elimina vazamento por homonímia entre ramificações irmãs e isola produtos legados sem nodeId.
 */
export function doesBindingBelongToCategoryNode(
  binding: NormalizedProductBinding,
  targetNode: CategoriaNode,
  categoryTree: CategoriaNode[]
): boolean {
  // 1. Resolução exata quando o vínculo possui nodeId cadastrado na árvore
  if (binding.nodeId && categoryTree.some((n) => n.id === binding.nodeId)) {
    const allowedIds = getDescendantCategoryIdsLocal(targetNode.id, categoryTree);
    return allowedIds.includes(binding.nodeId);
  }

  // 2. Localiza a raiz do nó alvo
  const targetRoot = getRootCategoryNodeLocal(targetNode.id, categoryTree) || targetNode;
  const targetRootNorm = normalizeCatString(targetRoot.nome);
  const targetRootSlug = normalizeCatString(targetRoot.slug);

  // 3. Localiza a raiz do produto na árvore
  let productRoot: CategoriaNode | null = null;
  if (binding.categoryId) {
    const nodeById = categoryTree.find((n) => n.id === binding.categoryId);
    if (nodeById) {
      productRoot = getRootCategoryNodeLocal(nodeById.id, categoryTree);
    }
  }
  if (!productRoot && binding.category) {
    const bCatNorm = normalizeCatString(binding.category);
    const nodeByName = categoryTree.find(
      (n) =>
        !n.parent_id &&
        (normalizeCatString(n.nome) === bCatNorm || normalizeCatString(n.slug) === bCatNorm)
    );
    if (nodeByName) {
      productRoot = nodeByName;
    }
  }

  // Se a raiz do produto é conhecida na árvore e NÃO coincide com a raiz do nó alvo, o vínculo é rejeitado
  if (productRoot && productRoot.id !== targetRoot.id) {
    return false;
  }

  // Se a raiz não pôde ser resolvida por nó, mas o nome da categoria do produto existe e difere da raiz do alvo
  if (!productRoot && binding.category) {
    const bCatNorm = normalizeCatString(binding.category);
    if (targetRootNorm && bCatNorm && bCatNorm !== targetRootNorm && bCatNorm !== targetRootSlug) {
      // Se bCatNorm é reconhecida como outra categoria raiz existente na árvore, não pertence a este alvo
      const otherRootExists = categoryTree.some(
        (n) =>
          !n.parent_id &&
          n.id !== targetRoot.id &&
          (normalizeCatString(n.nome) === bCatNorm || normalizeCatString(n.slug) === bCatNorm)
      );
      if (otherRootExists) {
        return false;
      }
    }
  }

  // Caso A: O nó alvo é a própria raiz (N1)
  const isTargetRoot = !targetNode.parent_id;
  if (isTargetRoot) {
    if (productRoot && productRoot.id === targetRoot.id) return true;
    if (binding.categoryId && binding.categoryId === targetRoot.id) return true;
    const bCatNorm = normalizeCatString(binding.category);
    return bCatNorm === targetRootNorm || bCatNorm === targetRootSlug;
  }

  // Caso B: O nó alvo é um nó filho (subcategoria N2, N3...)
  const targetNodeNorm = normalizeCatString(targetNode.nome);
  const targetNodeSlug = normalizeCatString(targetNode.slug);
  const allowedDescendantIds = getDescendantCategoryIdsLocal(targetNode.id, categoryTree);

  // Se o próprio nodeId ou categoryId do produto for o nó alvo ou descendente dele
  if (binding.nodeId && allowedDescendantIds.includes(binding.nodeId)) {
    return true;
  }
  if (binding.categoryId && allowedDescendantIds.includes(binding.categoryId)) {
    return true;
  }

  const allowedDescendants = categoryTree.filter((n) => allowedDescendantIds.includes(n.id));
  const allowedNorms = new Set(
    allowedDescendants.flatMap((n) => [normalizeCatString(n.nome), normalizeCatString(n.slug)])
  );

  // Se o produto foi classificado com a categoria tendo o nome deste nó filho
  if (binding.category && allowedNorms.has(normalizeCatString(binding.category))) {
    return true;
  }

  // Verifica na trilha N-níveis gravada
  if (binding.subcategoriaPath && binding.subcategoriaPath.length > 0) {
    const hasPathMatch = binding.subcategoriaPath.some((seg) => allowedNorms.has(normalizeCatString(seg)));
    if (hasPathMatch) return true;
  }

  // Verifica subcategoria simples
  if (binding.subcategory) {
    const pSubNorm = normalizeCatString(binding.subcategory);
    if (allowedNorms.has(pSubNorm)) {
      return true;
    }
  }

  return false;
}

function matchesSingleBindingCategory(
  binding: NormalizedProductBinding,
  categoryTerm: string,
  categoryTree: CategoriaNode[]
): boolean {
  const catLower = (categoryTerm || '').trim().toLowerCase();
  const catNorm = normalizeCatString(categoryTerm);
  if (!catLower && !catNorm) return true;

  // 1. Resolução via Árvore de Categorias (N1, N2, N3, N4...) com proteção de pertinência
  if (categoryTree.length > 0) {
    const matchedNodes = findMatchingTreeNodes(categoryTerm, categoryTree);
    if (matchedNodes.length > 0) {
      for (const matchedNode of matchedNodes) {
        if (doesBindingBelongToCategoryNode(binding, matchedNode, categoryTree)) {
          return true;
        }
      }
      return false;
    }
  }

  // 2. Correspondência direta na trilha N-níveis quando a árvore não resolveu
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

  // 3. Fallbacks controlados de taxonomia sem árvore (apenas categorias/subcategorias explícitas, NUNCA por tecido ou modelagem)
  if (catLower === 'acessórios' || catLower === 'acessorios' || catNorm === 'acessorios') {
    return (
      pCatNorm === 'acessorios' ||
      CATEGORIES_ACESSORIOS.some((ac) => normalizeCatString(ac) === pCatNorm) ||
      Boolean(binding.subcategory && CATEGORIES_ACESSORIOS.some((ac) => normalizeCatString(ac) === pSubNorm))
    );
  }
  if (catNorm === 'tricots' || catNorm === 'tricot') {
    return pCatNorm.includes('tricot') || pSubNorm.includes('tricot');
  }
  if (catNorm === 'alfaiataria') {
    return (
      pCatNorm.includes('alfaiataria') ||
      pSubNorm.includes('alfaiataria') ||
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
    Boolean(binding.subcategory && (binding.subcategory.toLowerCase() === catLower || pSubNorm === catNorm))
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
  return bindings.some((b) => matchesSingleBindingCategory(b, categoryTerm, categoryTree));
}

/**
 * Verifica se um produto corresponde a uma subcategoria em qualquer um dos seus vínculos.
 */
export function matchesSubcategoryFilter(
  product: Product,
  subTerm: string,
  categoryTree: CategoriaNode[] = [],
  options: { includeCategoryMatch?: boolean; parentCategoryTerm?: string } = {}
): boolean {
  const { includeCategoryMatch = false, parentCategoryTerm } = options;
  const subLower = (subTerm || '').trim().toLowerCase();
  const subNorm = normalizeCatString(subTerm);
  if (!subLower && !subNorm) return true;

  const bindings = getProductCategoryBindings(product);

  for (const binding of bindings) {
    if (categoryTree.length > 0) {
      let subNodes = findMatchingTreeNodes(subTerm, categoryTree);
      if (parentCategoryTerm) {
        const parentRoots = findMatchingTreeNodes(parentCategoryTerm, categoryTree);
        if (parentRoots.length > 0) {
          const parentDescendantIds = new Set(
            parentRoots.flatMap((pr) => getDescendantCategoryIdsLocal(pr.id, categoryTree))
          );
          const scopedSubNodes = subNodes.filter((sn) => parentDescendantIds.has(sn.id));
          if (scopedSubNodes.length > 0) {
            subNodes = scopedSubNodes;
          }
        }
      }

      if (subNodes.length > 0) {
        const childSubNodes = subNodes.filter((sn) => Boolean(sn.parent_id));
        if (childSubNodes.length > 0) {
          let matched = false;
          for (const subNode of childSubNodes) {
            if (doesBindingBelongToCategoryNode(binding, subNode, categoryTree)) {
              matched = true;
              return true;
            }
          }
          if (!matched) {
            continue;
          }
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
 * - `isStrictMode = true` (Vínculo Estrito Ativo): o produto só aparece se pertencer à categoria pai E à subcategoria alvo.
 * - `isStrictMode = false` (Modo Flexível / Abrangente): ao navegar por um submenu que aponte para uma categoria raiz autônoma
 *   (ex: Outono/Inverno -> Casacos & Jaquetas), produtos daquela categoria autônoma aparecem mesmo sem vínculo direto com Outono/Inverno.
 *   Subcategorias homônimas de outros departamentos não relacionados (ex: Tricots de Primavera/Verão) são devidamente bloqueadas.
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
  const matchesParent = categories.some((cat) => matchesCategoryFilter(product, cat, categoryTree));
  const matchesSubInParent = subcategories.some((sub) =>
    categories.some((parentCat) =>
      matchesSubcategoryFilter(product, sub, categoryTree, {
        includeCategoryMatch: true,
        parentCategoryTerm: parentCat
      })
    )
  );

  // Se atende à categoria pai E à subcategoria naquele contexto, aprovado em ambos os modos
  if (matchesParent && matchesSubInParent) {
    return true;
  }

  if (isStrictMode) {
    return false;
  }

  // Modo Flexível (Inativo no admin):
  // Permite que uma subopção que corresponda a um DEPARTAMENTO RAIZ autônomo na árvore (ex: Casacos & Jaquetas colocado como submenu de Outono/Inverno)
  // traga as peças daquele departamento raiz.
  // Se a subcategoria for uma ramificação filha legítima dentro do departamento filtrado (ex: Outono/Inverno -> Tricots),
  // o escopo é estritamente restrito a esse ramo, impedindo vazamentos de outros departamentos por homonímia.
  return subcategories.some((sub) => {
    const isChildOfFilteredParent = categories.some((parentCat) => {
      const parentNodes = findMatchingTreeNodes(parentCat, categoryTree);
      return parentNodes.some((pNode) => {
        const descendantIds = getDescendantCategoryIdsLocal(pNode.id, categoryTree).filter((id) => id !== pNode.id);
        const childNodes = categoryTree.filter((n) => descendantIds.includes(n.id));
        return childNodes.some((cn) => {
          const normCn = normalizeCatString(cn.nome);
          const normSub = normalizeCatString(sub);
          return normCn === normSub || normalizeCatString(cn.slug) === normSub;
        });
      });
    });

    if (isChildOfFilteredParent) {
      return false;
    }

    const isRootAutonomousCat = categoryTree.some(
      (n) => !n.parent_id && (normalizeCatString(n.nome) === normalizeCatString(sub) || normalizeCatString(n.slug) === normalizeCatString(sub) || isSemanticCategoryMatch(n.nome, sub))
    );
    if (isRootAutonomousCat) {
      return matchesCategoryFilter(product, sub, categoryTree);
    }
    return false;
  });
}
