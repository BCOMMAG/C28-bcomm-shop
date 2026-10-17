import { CustomerOrder } from './orders';
import { AdminClientItem } from './admin';

export const DEMO_ADMIN_ORDERS: CustomerOrder[] = [
  {
    id: 'demo-ord-1',
    numero_pedido: 'LB-2026-1042',
    cliente_nome: 'Marina Silveira',
    cliente_telefone: '(11) 98765-4321',
    total: 489.0,
    subtotal: 489.0,
    valor_frete: 0.0,
    valor_desconto: 0.0,
    metodo_pagamento: 'pix',
    status: 'pago',
    endereco_entrega: {
      logradouro: 'Av. Brigadeiro Faria Lima',
      numero: '2200',
      bairro: 'Jardim Paulistano',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01452-000'
    },
    itens_pedido: [
      {
        id: 'item-1',
        nome_produto: 'Vestido Seda Alfaiataria Florença',
        preco_unitario: 489.0,
        quantidade: 1,
        tamanho: 'M',
        cor: 'Preto Nobre',
        imagem_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/vestido-florenca.webp'
      }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'demo-ord-2',
    numero_pedido: 'LB-2026-1041',
    cliente_nome: 'Patrícia Alencar',
    cliente_telefone: '(21) 99876-5432',
    total: 760.0,
    subtotal: 760.0,
    valor_frete: 0.0,
    valor_desconto: 0.0,
    metodo_pagamento: 'cartao',
    status: 'em_separacao',
    endereco_entrega: {
      logradouro: 'Rua Garcia d\'Ávila',
      numero: '150',
      bairro: 'Ipanema',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      cep: '22421-010'
    },
    itens_pedido: [
      {
        id: 'item-2a',
        nome_produto: 'Conjunto Cetim Nobre Milano',
        preco_unitario: 380.0,
        quantidade: 1,
        tamanho: 'P',
        cor: 'Dourado Champanhe',
        imagem_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/conjunto-milano.webp'
      },
      {
        id: 'item-2b',
        nome_produto: 'Calça Pantalona Alfaiataria',
        preco_unitario: 380.0,
        quantidade: 1,
        tamanho: 'P',
        cor: 'Preto',
        imagem_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/pantalona-preta.webp'
      }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: 'demo-ord-3',
    numero_pedido: 'LB-2026-1040',
    cliente_nome: 'Camila Rocha',
    cliente_telefone: '(31) 98877-6655',
    total: 290.0,
    subtotal: 290.0,
    valor_frete: 25.0,
    valor_desconto: 0.0,
    metodo_pagamento: 'cartao',
    status: 'enviado',
    codigo_rastreio: 'QD987654321BR',
    endereco_entrega: {
      logradouro: 'Rua da Bahia',
      numero: '1120',
      bairro: 'Lourdes',
      cidade: 'Belo Horizonte',
      uf: 'MG',
      cep: '30160-011'
    },
    itens_pedido: [
      {
        id: 'item-3',
        nome_produto: 'Camisa Linho Pura Alfaiataria',
        preco_unitario: 290.0,
        quantidade: 1,
        tamanho: 'G',
        cor: 'Off White',
        imagem_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/camisa-linho.webp'
      }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'demo-ord-4',
    numero_pedido: 'LB-2026-1039',
    cliente_nome: 'Beatriz Ramos',
    cliente_telefone: '(41) 97766-5544',
    total: 520.0,
    subtotal: 520.0,
    valor_frete: 0.0,
    valor_desconto: 0.0,
    metodo_pagamento: 'pix',
    status: 'entregue',
    codigo_rastreio: 'BR123456789QD',
    endereco_entrega: {
      logradouro: 'Av. Sete de Setembro',
      numero: '4500',
      bairro: 'Batel',
      cidade: 'Curitiba',
      uf: 'PR',
      cep: '80240-000'
    },
    itens_pedido: [
      {
        id: 'item-4',
        nome_produto: 'Blazer Alfaiataria Estruturado Roma',
        preco_unitario: 520.0,
        quantidade: 1,
        tamanho: 'M',
        cor: 'Camel Nobre',
        imagem_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/blazer-roma.webp'
      }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'demo-ord-5',
    numero_pedido: 'LB-2026-1038',
    cliente_nome: 'Fernanda Lima',
    cliente_telefone: '(51) 96655-4433',
    total: 350.0,
    subtotal: 350.0,
    valor_frete: 18.0,
    valor_desconto: 0.0,
    metodo_pagamento: 'pix',
    status: 'pendente',
    endereco_entrega: {
      logradouro: 'Rua Padre Chagas',
      numero: '340',
      bairro: 'Moinhos de Vento',
      cidade: 'Porto Alegre',
      uf: 'RS',
      cep: '90570-080'
    },
    itens_pedido: [
      {
        id: 'item-5',
        nome_produto: 'Tricot Biamar Decote V Premium',
        preco_unitario: 350.0,
        quantidade: 1,
        tamanho: 'Único',
        cor: 'Bege Areia',
        imagem_url: 'https://pub-e5c670efa04d4ef185aece8ed06532af.r2.dev/tricot-biamar.webp'
      }
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

export const DEMO_ADMIN_CLIENTS: AdminClientItem[] = [
  {
    id: 'cli-demo-1',
    nome: 'Marina Silveira',
    email: 'marina.silveira@email.com',
    telefone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    cidade: 'São Paulo',
    estado: 'SP',
    totalPedidos: 4,
    totalGasto: 1940.0,
    ticketMedio: 485.0,
    primeiroPedido: '2026-08-10T14:30:00Z',
    ultimoPedido: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isVIP: true,
    tag: 'vip',
    tamanhoHabitual: 'M / 38',
    notasInternas: 'Cliente VIP assídua. Prefere tons terrosos, linho puro e alfaiataria fina. Aniversário em 12 de novembro.',
    pedidos: [
      {
        id: 'ord-demo-1a',
        numeroPedido: 'LB-2026-9042',
        total: 580.0,
        status: 'entregue',
        createdAt: '2026-10-10T14:20:00Z',
        itens: [
          { nome: 'Conjunto Alfaiataria Nobre Bege', cor: 'Bege Areia', tamanho: 'M', quantidade: 1, preco: 580.0 }
        ]
      },
      {
        id: 'ord-demo-1b',
        numeroPedido: 'LB-2026-8810',
        total: 480.0,
        status: 'entregue',
        createdAt: '2026-09-22T11:15:00Z',
        itens: [
          { nome: 'Casaco em Tricot Biamar Exclusivo', cor: 'Camel', tamanho: 'Único', quantidade: 1, preco: 480.0 }
        ]
      },
      {
        id: 'ord-demo-1c',
        numeroPedido: 'LB-2026-7730',
        total: 520.0,
        status: 'entregue',
        createdAt: '2026-08-30T16:40:00Z',
        itens: [
          { nome: 'Blazer Alfaiataria Estruturado Roma', cor: 'Off-White', tamanho: 'M', quantidade: 1, preco: 520.0 }
        ]
      },
      {
        id: 'ord-demo-1d',
        numeroPedido: 'LB-2026-6612',
        total: 360.0,
        status: 'entregue',
        createdAt: '2026-08-10T14:30:00Z',
        itens: [
          { nome: 'Calça Cenoura em Alfaiataria', cor: 'Preto Clássico', tamanho: '38', quantidade: 1, preco: 360.0 }
        ]
      }
    ]
  },
  {
    id: 'cli-demo-2',
    nome: 'Beatriz Ramos',
    email: 'beatriz.ramos@corp.com',
    telefone: '(41) 97766-5544',
    cpf: '987.654.321-11',
    cidade: 'Curitiba',
    estado: 'PR',
    totalPedidos: 5,
    totalGasto: 2450.0,
    ticketMedio: 490.0,
    primeiroPedido: '2026-07-15T11:20:00Z',
    ultimoPedido: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isVIP: true,
    tag: 'vip',
    tamanhoHabitual: 'P / 36',
    notasInternas: 'Advogada, compra frequente para escritório. Solicita envio rápido via Sedex.',
    pedidos: [
      {
        id: 'ord-demo-2a',
        numeroPedido: 'LB-2026-9102',
        total: 520.0,
        status: 'enviado',
        createdAt: '2026-10-15T10:00:00Z',
        itens: [
          { nome: 'Blazer Alfaiataria Estruturado Roma', cor: 'Camel Nobre', tamanho: 'P', quantidade: 1, preco: 520.0 }
        ]
      },
      {
        id: 'ord-demo-2b',
        numeroPedido: 'LB-2026-8740',
        total: 620.0,
        status: 'entregue',
        createdAt: '2026-09-15T15:30:00Z',
        itens: [
          { nome: 'Vestido Midi Linho Puro Aurora', cor: 'Terracota', tamanho: 'P', quantidade: 1, preco: 620.0 }
        ]
      }
    ]
  },
  {
    id: 'cli-demo-3',
    nome: 'Patrícia Alencar',
    email: 'patricia.alencar@luxo.com',
    telefone: '(21) 99876-5432',
    cpf: '456.789.123-22',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    totalPedidos: 3,
    totalGasto: 1140.0,
    ticketMedio: 380.0,
    primeiroPedido: '2026-09-02T16:00:00Z',
    ultimoPedido: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isVIP: true,
    tag: 'vip',
    tamanhoHabitual: 'G / 42',
    notasInternas: 'Gosta de modelagens confortáveis e tecidos frescos de verão.',
    pedidos: [
      {
        id: 'ord-demo-3a',
        numeroPedido: 'LB-2026-9055',
        total: 380.0,
        status: 'pago',
        createdAt: '2026-10-16T18:00:00Z',
        itens: [
          { nome: 'Camisa Seda Pura Marsala', cor: 'Marsala', tamanho: 'G', quantidade: 1, preco: 380.0 }
        ]
      }
    ]
  },
  {
    id: 'cli-demo-4',
    nome: 'Camila Rocha',
    email: 'camila.rocha@adv.br',
    telefone: '(31) 98877-6655',
    cpf: '333.444.555-66',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    totalPedidos: 1,
    totalGasto: 290.0,
    ticketMedio: 290.0,
    primeiroPedido: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    ultimoPedido: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isVIP: false,
    tag: 'compradora',
    tamanhoHabitual: 'M',
    pedidos: [
      {
        id: 'ord-demo-4a',
        numeroPedido: 'LB-2026-8991',
        total: 290.0,
        status: 'em_separacao',
        createdAt: '2026-10-16T09:30:00Z',
        itens: [
          { nome: 'T-Shirt Algodão Egípcio Minimal', cor: 'Off-White', tamanho: 'M', quantidade: 1, preco: 290.0 }
        ]
      }
    ]
  },
  {
    id: 'cli-demo-5',
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@med.br',
    telefone: '(51) 96655-4433',
    cpf: '777.888.999-00',
    cidade: 'Porto Alegre',
    estado: 'RS',
    totalPedidos: 1,
    totalGasto: 350.0,
    ticketMedio: 350.0,
    primeiroPedido: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    ultimoPedido: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    isVIP: false,
    tag: 'compradora',
    tamanhoHabitual: 'P',
    pedidos: [
      {
        id: 'ord-demo-5a',
        numeroPedido: 'LB-2026-8802',
        total: 350.0,
        status: 'entregue',
        createdAt: '2026-10-14T14:10:00Z',
        itens: [
          { nome: 'Saia Midi Evasê com Pregas', cor: 'Verde Oliva', tamanho: 'P', quantidade: 1, preco: 350.0 }
        ]
      }
    ]
  }
];
