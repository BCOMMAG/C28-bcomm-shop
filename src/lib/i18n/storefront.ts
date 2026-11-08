export interface StorefrontTranslations {
  nav: {
    home: string;
    catalog: string;
    newArrivals: string;
    sale: string;
    searchPlaceholder: string;
    cart: string;
    vipClub: string;
    myAccount: string;
    freeShippingAbove: (val: string) => string;
  };
  product: {
    addToCart: string;
    addedToCart: string;
    soldOut: string;
    reserved: string;
    quickView: string;
    selectSize: string;
    selectColor: string;
    sizeGuide: string;
    details: string;
    installments: (times: number, val: string) => string;
  };
  cart: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    continueShopping: string;
    subtotal: string;
    shipping: string;
    free: string;
    coupon: string;
    couponPlaceholder: string;
    applyCoupon: string;
    total: string;
    checkoutButton: string;
    itemsCount: (n: number) => string;
  };
  checkout: {
    steps: {
      bag: string;
      address: string;
      identity: string;
      payment: string;
    };
    contactTitle: string;
    deliveryTitle: string;
    paymentTitle: string;
    fullName: string;
    email: string;
    phone: string;
    taxId: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    searchCep: string;
    orderSummary: string;
    completeOrder: string;
    backToStore: string;
    securityBadge: string;
  };
}

export const storefrontPt: StorefrontTranslations = {
  nav: {
    home: 'Início',
    catalog: 'Catálogo',
    newArrivals: 'Lançamentos',
    sale: 'Promoções',
    searchPlaceholder: 'Buscar vestidos, blazers, alfaiataria...',
    cart: 'Sacola',
    vipClub: 'Espaço VIP',
    myAccount: 'Minha Conta',
    freeShippingAbove: (val) => `Frete Grátis acima de ${val} para todo o país`
  },
  product: {
    addToCart: 'Adicionar à Sacola',
    addedToCart: 'Peça Adicionada!',
    soldOut: 'Esgotado',
    reserved: 'Em Reserva',
    quickView: 'Espiar Peça',
    selectSize: 'Selecione o Tamanho',
    selectColor: 'Selecione a Cor',
    sizeGuide: 'Tabela de Medidas',
    details: 'Detalhes da Peça',
    installments: (times, val) => `em até ${times}x de ${val} sem juros`
  },
  cart: {
    title: 'Sua Sacola',
    emptyTitle: 'Sua sacola está vazia',
    emptySubtitle: 'Explore nossos lançamentos e escolha suas peças favoritas.',
    continueShopping: 'Explorar Coleção',
    subtotal: 'Subtotal',
    shipping: 'Frete',
    free: 'Grátis',
    coupon: 'Cupom de Desconto',
    couponPlaceholder: 'Código do cupom',
    applyCoupon: 'Aplicar',
    total: 'Total',
    checkoutButton: 'Finalizar Pedido',
    itemsCount: (n) => `${n} ${n === 1 ? 'peça' : 'peças'}`
  },
  checkout: {
    steps: {
      bag: 'Sacola & Frete',
      address: 'Endereço de Entrega',
      identity: 'Identificação Pessoal',
      payment: 'Pagamento & Envio'
    },
    contactTitle: '1. Seus Dados de Contato',
    deliveryTitle: '2. Onde devemos entregar?',
    paymentTitle: '3. Escolha como pagar',
    fullName: 'Nome Completo',
    email: 'E-mail Principal',
    phone: 'WhatsApp / Telefone com DDD',
    taxId: 'CPF (obrigatório para nota fiscal)',
    zipCode: 'CEP',
    street: 'Rua / Logradouro',
    number: 'Número',
    complement: 'Complemento (Apto, Bloco)',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'Estado (UF)',
    searchCep: 'Buscar CEP',
    orderSummary: 'Resumo do Seu Pedido',
    completeOrder: 'Concluir Pedido com Segurança',
    backToStore: 'Voltar para a Boutique',
    securityBadge: 'Ambiente Criptografado & Pagamento Seguro'
  }
};

export const storefrontEn: StorefrontTranslations = {
  nav: {
    home: 'Home',
    catalog: 'Catalog',
    newArrivals: 'New Arrivals',
    sale: 'Sale',
    searchPlaceholder: 'Search dresses, blazers, luxury pieces...',
    cart: 'Shopping Bag',
    vipClub: 'VIP Lounge',
    myAccount: 'My Account',
    freeShippingAbove: (val) => `Free Shipping on orders over ${val}`
  },
  product: {
    addToCart: 'Add to Bag',
    addedToCart: 'Added to Bag!',
    soldOut: 'Sold Out',
    reserved: 'On Hold',
    quickView: 'Quick View',
    selectSize: 'Select Size',
    selectColor: 'Select Color',
    sizeGuide: 'Size Guide',
    details: 'Product Details',
    installments: (times, val) => `or ${times} payments of ${val}`
  },
  cart: {
    title: 'Shopping Bag',
    emptyTitle: 'Your bag is empty',
    emptySubtitle: 'Explore our latest arrivals and pick your favorite pieces.',
    continueShopping: 'Explore Collection',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    coupon: 'Promo Code',
    couponPlaceholder: 'Enter promo code',
    applyCoupon: 'Apply',
    total: 'Total',
    checkoutButton: 'Proceed to Checkout',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`
  },
  checkout: {
    steps: {
      bag: 'Bag & Shipping',
      address: 'Shipping Address',
      identity: 'Customer Info',
      payment: 'Payment & Review'
    },
    contactTitle: '1. Contact Information',
    deliveryTitle: '2. Shipping Address',
    paymentTitle: '3. Payment Method',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number / WhatsApp',
    taxId: 'Tax ID / Document (Optional)',
    zipCode: 'Postal / ZIP Code',
    street: 'Street Address',
    number: 'House / Unit Number',
    complement: 'Apt, Suite, Building (optional)',
    neighborhood: 'District / Neighborhood',
    city: 'City',
    state: 'State / Province',
    searchCep: 'Find Code',
    orderSummary: 'Order Summary',
    completeOrder: 'Place Order Securely',
    backToStore: 'Return to Boutique',
    securityBadge: 'Encrypted & Guaranteed Secure Checkout'
  }
};

export const storefrontEs: StorefrontTranslations = {
  nav: {
    home: 'Inicio',
    catalog: 'Catálogo',
    newArrivals: 'Novedades',
    sale: 'Ofertas',
    searchPlaceholder: 'Buscar vestidos, blazers, conjuntos...',
    cart: 'Bolsa de Compras',
    vipClub: 'Espacio VIP',
    myAccount: 'Mi Cuenta',
    freeShippingAbove: (val) => `Envío Gratis en compras superiores a ${val}`
  },
  product: {
    addToCart: 'Añadir a la Bolsa',
    addedToCart: '¡Prenda Añadida!',
    soldOut: 'Agotado',
    reserved: 'En Reserva',
    quickView: 'Vista Rápida',
    selectSize: 'Seleccione la Talla',
    selectColor: 'Seleccione el Color',
    sizeGuide: 'Guía de Tallas',
    details: 'Detalles de la Prenda',
    installments: (times, val) => `hasta ${times} cuotas de ${val}`
  },
  cart: {
    title: 'Tu Bolsa',
    emptyTitle: 'Tu bolsa está vacía',
    emptySubtitle: 'Explora nuestros lanzamientos y elige tus prendas favoritas.',
    continueShopping: 'Explorar Colección',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    free: 'Gratis',
    coupon: 'Cupón de Descuento',
    couponPlaceholder: 'Código del cupón',
    applyCoupon: 'Aplicar',
    total: 'Total',
    checkoutButton: 'Finalizar Pedido',
    itemsCount: (n) => `${n} ${n === 1 ? 'prenda' : 'prendas'}`
  },
  checkout: {
    steps: {
      bag: 'Bolsa y Envío',
      address: 'Dirección de Entrega',
      identity: 'Identificación',
      payment: 'Pago y Confirmación'
    },
    contactTitle: '1. Tus Datos de Contacto',
    deliveryTitle: '2. ¿Dónde entregamos tu pedido?',
    paymentTitle: '3. Método de Pago',
    fullName: 'Nombre Completo',
    email: 'Correo Electrónico',
    phone: 'Teléfono / WhatsApp',
    taxId: 'Documento / ID (Opcional)',
    zipCode: 'Código Postal',
    street: 'Calle / Dirección',
    number: 'Número',
    complement: 'Piso, Depto, Bloque (opcional)',
    neighborhood: 'Barrio / Colonia',
    city: 'Ciudad',
    state: 'Provincia / Estado',
    searchCep: 'Buscar Código',
    orderSummary: 'Resumen del Pedido',
    completeOrder: 'Completar Pedido con Seguridad',
    backToStore: 'Volver a la Tienda',
    securityBadge: 'Ambiente Cifrado y Pago 100% Seguro'
  }
};

export function getStorefrontTranslation(lang: string = 'pt'): StorefrontTranslations {
  const clean = (lang || 'pt').toLowerCase();
  if (clean.startsWith('en')) return storefrontEn;
  if (clean.startsWith('es')) return storefrontEs;
  return storefrontPt;
}

