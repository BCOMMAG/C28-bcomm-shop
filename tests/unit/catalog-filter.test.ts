import {
  matchesCategoryFilter,
  matchesSubcategoryFilter,
  matchesCatalogCategoryAndSubcategory
} from '../../src/lib/catalog-filter';
import type { Product } from '../../src/types';
import type { CategoriaNode } from '../../src/types/database';

function assertStrictEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${String(expected)} but got ${String(actual)}`);
  }
}

const assert = { strictEqual: assertStrictEqual };

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (err) {
    console.error(`✖ ${name}`);
    throw err;
  }
}

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: overrides.id || 'prod-1',
    name: overrides.name || 'Peça Teste',
    price: 199.9,
    formattedPrice: 'R$ 199,90',
    category: overrides.category || 'Geral',
    description: '',
    details: [],
    sizes: ['P', 'M'],
    colors: [],
    media: [],
    thumbnail: '/placeholder.jpg',
    rating: 5,
    reviewCount: 0,
    ...overrides
  };
}

const sampleTree: CategoriaNode[] = [
  {
    id: 'cat-outono',
    loja_id: 'loja-1',
    nome: 'Outono/Inverno',
    slug: 'outono-inverno',
    parent_id: null,
    nivel: 0,
    display_order: 10,
    ativo: true
  },
  {
    id: 'cat-casacos',
    loja_id: 'loja-1',
    nome: 'Casacos & Jaquetas',
    slug: 'casacos-jaquetas',
    parent_id: null,
    nivel: 0,
    display_order: 20,
    ativo: true
  },
  {
    id: 'cat-primavera',
    loja_id: 'loja-1',
    nome: 'Primavera/Verão',
    slug: 'primavera-verao',
    parent_id: null,
    nivel: 0,
    display_order: 30,
    ativo: true
  },
  {
    id: 'cat-blusas',
    loja_id: 'loja-1',
    nome: 'Blusas & Tops',
    slug: 'blusas-tops',
    parent_id: null,
    nivel: 0,
    display_order: 40,
    ativo: true
  },
  {
    id: 'cat-outono-tricots',
    loja_id: 'loja-1',
    nome: 'Tricots',
    slug: 'tricots',
    parent_id: 'cat-outono',
    nivel: 1,
    display_order: 10,
    ativo: true
  }
];

const prodCasacoSemVinculoOutono = makeProduct({
  id: 'p-casaco-raiz',
  name: 'Jaqueta Couro',
  category: 'Casacos & Jaquetas',
  categoryId: 'cat-casacos',
  subcategory: undefined
});

const prodCasacoEmOutono = makeProduct({
  id: 'p-casaco-outono',
  name: 'Casaco Lã Batida Outono',
  category: 'Outono/Inverno',
  categoryId: 'cat-outono',
  subcategory: 'Casacos & Jaquetas'
});

const prodTricotEmOutono = makeProduct({
  id: 'p-tricot-outono',
  name: 'Tricot Gola Alta',
  category: 'Outono/Inverno',
  categoryId: 'cat-outono',
  subcategory: 'Tricots'
});

const prodVestidoPrimavera = makeProduct({
  id: 'p-vestido-primavera',
  name: 'Vestido Floral Primavera',
  category: 'Primavera/Verão',
  categoryId: 'cat-primavera',
  subcategory: undefined
});

runTest(
  'Modo Flexível (strict = false): Outono/Inverno -> Casacos & Jaquetas inclui casaco sem vínculo com Outono/Inverno',
  () => {
    const cats = ['Outono/Inverno'];
    const subs = ['Casacos & Jaquetas'];

    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodCasacoSemVinculoOutono, cats, subs, sampleTree, false),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodCasacoEmOutono, cats, subs, sampleTree, false),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodTricotEmOutono, cats, subs, sampleTree, false),
      false
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodVestidoPrimavera, cats, subs, sampleTree, false),
      false
    );
  }
);

runTest(
  'Modo Estrito (strict = true): Outono/Inverno -> Casacos & Jaquetas exige vínculo explícito com Outono/Inverno E Casacos & Jaquetas',
  () => {
    const cats = ['Outono/Inverno'];
    const subs = ['Casacos & Jaquetas'];

    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodCasacoSemVinculoOutono, cats, subs, sampleTree, true),
      false
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodCasacoEmOutono, cats, subs, sampleTree, true),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodTricotEmOutono, cats, subs, sampleTree, true),
      false
    );
  }
);

runTest(
  'Autonomia de submenu cruzado (Outono/Inverno -> Primavera/Verão): flexível exibe Primavera/Verão; estrito bloqueia',
  () => {
    const cats = ['Outono/Inverno'];
    const subs = ['Primavera/Verão'];

    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodVestidoPrimavera, cats, subs, sampleTree, false),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodVestidoPrimavera, cats, subs, sampleTree, true),
      false
    );
  }
);

runTest(
  'Filtro apenas por categoria (Outono/Inverno) sem subcategoria funciona nos dois modos sem vazar outras categorias',
  () => {
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodCasacoEmOutono, ['Outono/Inverno'], [], sampleTree, false),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodTricotEmOutono, ['Outono/Inverno'], [], sampleTree, true),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodCasacoSemVinculoOutono, ['Outono/Inverno'], [], sampleTree, false),
      false
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodVestidoPrimavera, ['Outono/Inverno'], [], sampleTree, false),
      false
    );
  }
);

runTest(
  'Subcategoria cadastrada como nó filho na árvore (categoryId apontando para nó N2) funciona no modo estrito',
  () => {
    const prodN2 = makeProduct({
      id: 'p-tricot-n2',
      name: 'Tricot N2 Direto',
      category: 'Tricots',
      categoryId: 'cat-outono-tricots',
      subcategory: undefined
    });

    assert.strictEqual(matchesCategoryFilter(prodN2, 'Outono/Inverno', sampleTree), true);
    assert.strictEqual(
      matchesSubcategoryFilter(prodN2, 'Tricots', sampleTree, { includeCategoryMatch: false }),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodN2, ['Outono/Inverno'], ['Tricots'], sampleTree, true),
      true
    );
  }
);

runTest(
  'Multi-categoria: peça vinculada a Outono/Inverno, Conjuntos Exclusivos e Blusas aparece em todas e no submenu Outono/Inverno -> Blusas (mesmo em modo estrito)',
  () => {
    const prodMultiCat = makeProduct({
      id: 'p-multi-1',
      name: 'Blusa Conjunto Outono',
      category: 'Outono/Inverno',
      categoryId: 'cat-outono',
      subcategory: undefined,
      categories: [
        { categoria_id: 'cat-outono', categoria_nome: 'Outono/Inverno', subcategoria: null },
        { categoria_id: 'cat-conjuntos', categoria_nome: 'Conjuntos Exclusivos', subcategoria: null },
        { categoria_id: 'cat-blusas', categoria_nome: 'Blusas & Tops', subcategoria: null }
      ]
    });

    assert.strictEqual(matchesCategoryFilter(prodMultiCat, 'Outono/Inverno', sampleTree), true);
    assert.strictEqual(matchesCategoryFilter(prodMultiCat, 'Conjuntos Exclusivos', sampleTree), true);
    assert.strictEqual(matchesCategoryFilter(prodMultiCat, 'Blusas', sampleTree), true);
    assert.strictEqual(matchesCategoryFilter(prodMultiCat, 'Primavera/Verão', sampleTree), false);

    // No menu Outono/Inverno -> Blusas, deve aparecer tanto no modo flexível quanto no estrito
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodMultiCat, ['Outono/Inverno'], ['Blusas'], sampleTree, false),
      true
    );
    assert.strictEqual(
      matchesCatalogCategoryAndSubcategory(prodMultiCat, ['Outono/Inverno'], ['Blusas'], sampleTree, true),
      true
    );
  }
);

console.log('Todos os testes de catalog-filter passaram com sucesso!');
