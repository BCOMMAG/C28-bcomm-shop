import { Product } from '@/types';

export const PRODUCTS: Product[] = [
  {
    id: '01-casaco-tricot',
    name: 'Casaco em Tricot Biamar Exclusivo',
    price: 289.90,
    formattedPrice: 'R$ 289,90',
    originalPrice: 349.90,
    formattedOriginalPrice: 'R$ 349,90',
    discountBadge: 'OUTLET 17% OFF',
    category: 'Casacos & Jaquetas',
    subcategory: 'Tricots',
    fabric: 'Tricot Biamar',
    fit: 'Ampla / Oversized',
    line: 'Casual Chic',
    status: ['Mais Vendido', 'OUTLET', 'Pronta Entrega'],
    isBestSeller: true,
    isOutlet: true,
    description: 'Casaco confeccionado em tricot premium Biamar, com textura canelada encorpada e toque aveludado irresistível. Modelagem ampla com caimento elegante para compor sobreposições refinadas em dias de meia-estação e inverno.',
    details: [
      'Fio nobre Biamar de alta durabilidade e conforto térmico',
      'Acabamento canelado com caimento fluído',
      'Pala alongada e modelagem sofisticada',
      'Composição: 70% Acrílico nobre, 30% Poliamida',
      'Cuidados: Lavagem manual ou ciclo delicado para preservar a fibra'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Marrom Caramelo', hex: '#8B5A2B', imageSrc: '/products/01-casaco-tricot/marrom.jpg' },
      { name: 'Branco Off-White', hex: '#FAF9F6', imageSrc: '/products/01-casaco-tricot/branco.jpg' }
    ],
    totalStock: 9,
    variations: [
          {
                id: "ef8d62b9-177c-4a11-95d9-998251c26f2b",
                color: "Marrom Caramelo",
                size: "Tamanho Único",
                stock: 5,
                sku: "01-casaco-tricot-marrom-caramelo-tamanho-unico"
          },
          {
                id: "9d0cf6e6-a035-46ac-82d5-24d6dc357acf",
                color: "Branco Off-White",
                size: "Tamanho Único",
                stock: 4,
                sku: "01-casaco-tricot-branco-off-white-tamanho-unico"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/01-casaco-tricot/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/01-casaco-tricot/marrom.jpg',
        label: 'Marrom Caramelo'
      },
      {
        type: 'image',
        src: '/products/01-casaco-tricot/branco.jpg',
        label: 'Branco Off-White'
      }
    ],
    thumbnail: '/products/01-casaco-tricot/marrom.jpg',
    rating: 5.0,
    reviewCount: 18,
    pairedWithId: '04-conjunto-alfaiataria-bege'
  },
  {
    id: '02-blusa-tricot-rosa',
    name: 'Blusa em Tricot Especial Outubro Rosa',
    price: 189.90,
    formattedPrice: 'R$ 189,90',
    originalPrice: 249.90,
    formattedOriginalPrice: 'R$ 249,90',
    discountBadge: 'OUTLET 24% OFF',
    category: 'Blusas & Tops',
    subcategory: 'Tricots',
    fabric: 'Tricot Biamar',
    fit: 'Ajustada / Slim',
    line: 'Casual Chic',
    status: ['Mais Vendido', 'OUTLET', 'Novidade'],
    isOutlet: true,
    isBestSeller: true,
    isNewArrival: true,
    description: 'Blusa em tricot canelado com ponto refinado e decote suave. Peça curinga que combina a delicadeza dos tons rosados com a sofisticação de uma malharia estruturada e confortável para qualquer momento do dia.',
    details: [
      'Trama trabalhada com toque suave na pele',
      'Elasticidade inteligente que valoriza a silhueta sem apertar',
      'Manga de acabamento impecável com punho ajustado',
      'Composição: 80% Fio Especial, 20% Elastano de reforço',
      'Peça versátil para combinar com alfaiataria ou jeans premium'
    ],
    sizes: ['P', 'M', 'Tamanho Único'],
    colors: [
      { name: 'Rosa Quartz', hex: '#E8A598', imageSrc: '/products/02-blusa-tricot-rosa/rosa.jpg' }
    ],
    totalStock: 14,
    variations: [
          {
                id: "edc865dc-5111-4586-a290-df64419a5b13",
                color: "Rosa Quartz",
                size: "P",
                stock: 5,
                sku: "02-blusa-tricot-rosa-rosa-quartz-p"
          },
          {
                id: "928c4362-347a-4bda-a926-c6106d0bcc17",
                color: "Rosa Quartz",
                size: "Tamanho Único",
                stock: 5,
                sku: "02-blusa-tricot-rosa-rosa-quartz-tamanho-unico"
          },
          {
                id: "ddd58c89-cdba-405b-a544-64acaea855c9",
                color: "Rosa Quartz",
                size: "M",
                stock: 4,
                sku: "02-blusa-tricot-rosa-rosa-quartz-m"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/02-blusa-tricot-rosa/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/02-blusa-tricot-rosa/rosa.jpg',
        label: 'Rosa Quartz'
      }
    ],
    thumbnail: '/products/02-blusa-tricot-rosa/rosa.jpg',
    rating: 4.9,
    reviewCount: 14,
    pairedWithId: '03-conjunto-cetim'
  },
  {
    id: '03-conjunto-cetim',
    name: 'Conjunto em Cetim Seda Chic',
    price: 349.90,
    formattedPrice: 'R$ 349,90',
    originalPrice: 429.90,
    formattedOriginalPrice: 'R$ 429,90',
    discountBadge: 'OUTLET 18% OFF',
    category: 'Conjuntos Exclusivos',
    subcategory: 'Camisas',
    fabric: 'Cetim de Seda',
    fit: 'Fluida / Evasê',
    line: 'Festa & Noite',
    status: ['Mais Vendido', 'OUTLET'],
    isOutlet: true,
    isBestSeller: true,
    description: 'Conjunto em cetim toque de seda com brilho suave e movimento natural. O match perfeito entre conforto descomplicado e o requinte de uma produção sofisticada para ocasiões especiais, jantares e passeios com estilo.',
    details: [
      'Cetim acetinado com toque acetinado premium antiestático',
      'Calça de corte reto com caimento fluido e cós confortável',
      'Camisa leve de botões forrados e manga estruturada',
      'Composição: 97% Cetim Seda Toque Suave, 3% Elastano',
      'Não amassa facilmente e traz frescor imediato'
    ],
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Prata Acetinado', hex: '#D1D5DB', imageSrc: '/products/03-conjunto-cetim/prata.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "5a3ce2b8-8472-4b6d-8873-6b0241c65b67",
                color: "Prata Acetinado",
                size: "P",
                stock: 5,
                sku: "03-conjunto-cetim-prata-acetinado-p"
          },
          {
                id: "08322cd2-b57c-4b0b-aa23-12c90482f2cb",
                color: "Prata Acetinado",
                size: "M",
                stock: 5,
                sku: "03-conjunto-cetim-prata-acetinado-m"
          },
          {
                id: "200e70b7-534d-4f1d-b8d9-d05120a6b7a8",
                color: "Prata Acetinado",
                size: "G",
                stock: 5,
                sku: "03-conjunto-cetim-prata-acetinado-g"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/03-conjunto-cetim/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/03-conjunto-cetim/prata.jpg',
        label: 'Prata Acetinado'
      }
    ],
    thumbnail: '/products/03-conjunto-cetim/prata.jpg',
    rating: 5.0,
    reviewCount: 22,
    pairedWithId: '01-casaco-tricot'
  },
  {
    id: '04-conjunto-alfaiataria-bege',
    name: 'Conjunto Alfaiataria Premium Bege Dourado',
    price: 389.90,
    formattedPrice: 'R$ 389,90',
    originalPrice: 489.90,
    formattedOriginalPrice: 'R$ 489,90',
    discountBadge: 'OUTLET 20% OFF',
    category: 'Blazers & Alfaiataria',
    subcategory: 'Calças',
    fabric: 'Crepe Alfaiataria',
    fit: 'Alfaiataria Estruturada',
    line: 'Trabalho & Alfaiataria',
    status: ['Mais Vendido', 'OUTLET', 'Pronta Entrega'],
    isBestSeller: true,
    isOutlet: true,
    description: 'A definição absoluta da alfaiataria feminina contemporânea. Peça esculpida em tecido estruturado de caimento impecável em tom bege sofisticado. Projetado para mulheres que se posicionam com autoridade e elegância onde chegam.',
    details: [
      'Alfaiataria encorpada com costura e forro de alto padrão',
      'Blazer com ombreiras sutis que desenham a postura com harmonia',
      'Calça pantalona com pregas frontais alongadoras',
      'Composição: 95% Crepe Alfaiataria, 5% Spandex',
      'Acompanha botões nobres com acabamento em banho dourado fosco'
    ],
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Bege Areia Nobre', hex: '#E2D3B8', imageSrc: '/products/04-conjunto-alfaiataria-bege/bege.jpg' }
    ],
    totalStock: 14,
    variations: [
          {
                id: "5fd4a60d-2609-4a97-a2a7-6ed8905bb2b3",
                color: "Bege Areia Nobre",
                size: "P",
                stock: 5,
                sku: "04-conjunto-alfaiataria-bege-bege-areia-nobre-p"
          },
          {
                id: "262fdcd8-d42d-4e6a-964c-681a2f4e81f5",
                color: "Bege Areia Nobre",
                size: "M",
                stock: 5,
                sku: "04-conjunto-alfaiataria-bege-bege-areia-nobre-m"
          },
          {
                id: "7483139a-38a4-4523-bccc-1e59dc335c27",
                color: "Bege Areia Nobre",
                size: "G",
                stock: 4,
                sku: "04-conjunto-alfaiataria-bege-bege-areia-nobre-g"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/04-conjunto-alfaiataria-bege/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
        label: 'Bege Areia Nobre'
      }
    ],
    thumbnail: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
    rating: 5.0,
    reviewCount: 31,
    pairedWithId: '02-blusa-tricot-rosa'
  },
  {
    id: '05-blazer-alfaiataria-offwhite',
    name: 'Blazer Estruturado Imperial Off-White',
    price: 459.90,
    formattedPrice: 'R$ 459,90',
    category: 'Blazers & Alfaiataria',
    subcategory: 'Blazers & Alfaiataria',
    fabric: 'Crepe Alfaiataria',
    fit: 'Alfaiataria Estruturada',
    line: 'Trabalho & Alfaiataria',
    status: ['Novidade', 'Pronta Entrega'],
    isNewArrival: true,
    badge: 'Restam 5 peças',
    remainingPieces: 5,
    isLastPieces: true,
    description: 'Blazer confeccionado em crepe de alfaiataria nobre com forro em cetim puro. Lapela alongada, botões frontais em banho ouro fosco e caimento que impõe presença em qualquer reunião ou evento especial.',
    details: [
      'Forro 100% acetato com costura embutida de alto padrão',
      'Bolsos embutidos com lapela italiana',
      'Ombreiras anatômicas que desenham os ombros com perfeição',
      'Tecido resistente a vincos e marcas de uso'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Branco Off-White', hex: '#FAF9F6', imageSrc: '/products/01-casaco-tricot/branco.jpg' }
    ],
    totalStock: 19,
    variations: [
          {
                id: "ca728e50-e51f-4f25-a1bf-216dba8f1451",
                color: "Branco Off-White",
                size: "PP",
                stock: 5,
                sku: "05-blazer-alfaiataria-offwhite-branco-off-white-pp"
          },
          {
                id: "ce15e04d-8511-41f7-880a-2981b7f25e4d",
                color: "Branco Off-White",
                size: "P",
                stock: 5,
                sku: "05-blazer-alfaiataria-offwhite-branco-off-white-p"
          },
          {
                id: "f0350264-e6df-41e9-a943-84b1eaa3025b",
                color: "Branco Off-White",
                size: "G",
                stock: 5,
                sku: "05-blazer-alfaiataria-offwhite-branco-off-white-g"
          },
          {
                id: "7ce4a941-7393-48c6-8477-5bcd8b8b570a",
                color: "Branco Off-White",
                size: "M",
                stock: 4,
                sku: "05-blazer-alfaiataria-offwhite-branco-off-white-m"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/04-conjunto-alfaiataria-bege/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/01-casaco-tricot/branco.jpg',
        label: 'Branco Off-White'
      }
    ],
    thumbnail: '/products/01-casaco-tricot/branco.jpg',
    rating: 5.0,
    reviewCount: 9,
    pairedWithId: '04-conjunto-alfaiataria-bege'
  },
  {
    id: '06-calca-pantalona-areia',
    name: 'Calça Pantalona Cintura Alta Elegance',
    price: 249.90,
    formattedPrice: 'R$ 249,90',
    category: 'Calças',
    subcategory: 'Calças',
    fabric: 'Crepe Alfaiataria',
    fit: 'Reta Clássica',
    line: 'Trabalho & Alfaiataria',
    status: ['Pronta Entrega', 'Mais Vendido'],
    isBestSeller: true,
    badge: 'Restam 2 peças',
    remainingPieces: 2,
    isLastPieces: true,
    description: 'Pantalona em modelagem impecável com cintura alta e cós limpo. Possui pregas frontais que criam uma linha vertical alongadora e fluidez em cada passo.',
    details: [
      'Cós entretelado firme que valoriza a cintura',
      'Fecho invisível e bolsos faca funcionais',
      'Caimento solto e estruturado sem marcar',
      'Comprimento ideal para salto fino ou mocassim'
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Bege Areia Nobre', hex: '#E2D3B8', imageSrc: '/products/04-conjunto-alfaiataria-bege/bege.jpg' }
    ],
    totalStock: 19,
    variations: [
          {
                id: "cbfcb10c-f03a-4d77-ab73-83115227dac2",
                color: "Bege Areia Nobre",
                size: "P",
                stock: 5,
                sku: "06-calca-pantalona-areia-bege-areia-nobre-p"
          },
          {
                id: "c3d9f221-b967-47f4-b548-066414fa3cbe",
                color: "Bege Areia Nobre",
                size: "G",
                stock: 5,
                sku: "06-calca-pantalona-areia-bege-areia-nobre-g"
          },
          {
                id: "e087b7a2-5fe9-4f11-817f-4ec98333428c",
                color: "Bege Areia Nobre",
                size: "GG",
                stock: 5,
                sku: "06-calca-pantalona-areia-bege-areia-nobre-gg"
          },
          {
                id: "b1ede5ed-ae80-4820-ab36-b88b869b8bb2",
                color: "Bege Areia Nobre",
                size: "M",
                stock: 4,
                sku: "06-calca-pantalona-areia-bege-areia-nobre-m"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/04-conjunto-alfaiataria-bege/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
        label: 'Bege Areia'
      }
    ],
    thumbnail: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
    rating: 4.8,
    reviewCount: 16
  },
  {
    id: '07-vestido-midi-seda',
    name: 'Vestido Midi Fluido em Cetim Champagne',
    price: 620.00,
    formattedPrice: 'R$ 620,00',
    category: 'Vestidos & Macacões',
    subcategory: 'Vestidos & Macacões',
    fabric: 'Cetim de Seda',
    fit: 'Fluida / Evasê',
    line: 'Festa & Noite',
    status: ['Novidade'],
    isNewArrival: true,
    description: 'Vestido midi confeccionado em cetim seda com corte no viés, abraçando as curvas com leveza e sensualidade sutil. Decote degagê delicado e alças ajustáveis.',
    details: [
      'Corte em viés que proporciona caimento orgânico único',
      'Costura invisível e acabamento francês',
      'Brilho sofisticado que reflete a luz com elegância',
      'Ideal para celebrações, casamentos e coquetéis'
    ],
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Dourado Champagne', hex: '#DFBE76', imageSrc: '/products/03-conjunto-cetim/prata.jpg' },
      { name: 'Prata Acetinado', hex: '#D1D5DB', imageSrc: '/products/03-conjunto-cetim/prata.jpg' }
    ],
    totalStock: 29,
    variations: [
          {
                id: "d28ea64f-a8c4-4c5f-ac69-383b9e5f8b82",
                color: "Dourado Champagne",
                size: "M",
                stock: 5,
                sku: "07-vestido-midi-seda-dourado-champagne-m"
          },
          {
                id: "a9cefe02-7f2a-48fb-ab7b-2d1bb5c4c054",
                color: "Dourado Champagne",
                size: "G",
                stock: 5,
                sku: "07-vestido-midi-seda-dourado-champagne-g"
          },
          {
                id: "27a520c1-97d3-41f8-b31a-e6bdc43e2b48",
                color: "Prata Acetinado",
                size: "P",
                stock: 5,
                sku: "07-vestido-midi-seda-prata-acetinado-p"
          },
          {
                id: "d5c38daa-e36d-43f7-b3b4-6e7a5ec34d88",
                color: "Prata Acetinado",
                size: "M",
                stock: 5,
                sku: "07-vestido-midi-seda-prata-acetinado-m"
          },
          {
                id: "7cf44eaa-16de-4cee-91f4-671e27a9c042",
                color: "Prata Acetinado",
                size: "G",
                stock: 5,
                sku: "07-vestido-midi-seda-prata-acetinado-g"
          },
          {
                id: "c24092dd-b59a-4c56-906a-dee0c8e7f323",
                color: "Dourado Champagne",
                size: "P",
                stock: 4,
                sku: "07-vestido-midi-seda-dourado-champagne-p"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/03-conjunto-cetim/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/03-conjunto-cetim/prata.jpg',
        label: 'Prata Acetinado'
      }
    ],
    thumbnail: '/products/03-conjunto-cetim/prata.jpg',
    rating: 5.0,
    reviewCount: 11
  },
  {
    id: '08-camisa-seda-botoes',
    name: 'Camisa Pura Elegância em Seda Acetinada',
    price: 219.90,
    formattedPrice: 'R$ 219,90',
    category: 'Camisas',
    subcategory: 'Camisas',
    fabric: 'Cetim de Seda',
    fit: 'Reta Clássica',
    line: 'Casual Chic',
    status: ['Pronta Entrega'],
    description: 'Camisa de mangas compridas em seda acetinada de toque macio e fresco. Gola estruturada, punhos com abotoamento refinado e caimento leve para composições sofisticadas.',
    details: [
      'Botões tingidos no tom exato do tecido',
      'Gola francesa entretelada com corte impecável',
      'Fácil de sobrepor com tricots ou usar como peça principal',
      'Excelente respiração do tecido'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Branco Off-White', hex: '#FAF9F6', imageSrc: '/products/01-casaco-tricot/branco.jpg' },
      { name: 'Marrom Caramelo', hex: '#8B5A2B', imageSrc: '/products/01-casaco-tricot/marrom.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "f2da20f9-550e-441e-a95f-1efbc0f6bfb7",
                color: "Branco Off-White",
                size: "PP",
                stock: 5,
                sku: "08-camisa-seda-botoes-branco-off-white-pp"
          },
          {
                id: "5756eb95-c5f2-4c49-9654-aeeb1d156a34",
                color: "Branco Off-White",
                size: "P",
                stock: 5,
                sku: "08-camisa-seda-botoes-branco-off-white-p"
          },
          {
                id: "89ec2b7a-e9e2-40e8-9c3c-661d7c1a3326",
                color: "Branco Off-White",
                size: "M",
                stock: 5,
                sku: "08-camisa-seda-botoes-branco-off-white-m"
          },
          {
                id: "c592dae1-8f0a-4bdf-96f4-d4712f5466f4",
                color: "Branco Off-White",
                size: "G",
                stock: 5,
                sku: "08-camisa-seda-botoes-branco-off-white-g"
          },
          {
                id: "6e19da2a-5fc3-47c7-a721-976d8693341e",
                color: "Marrom Caramelo",
                size: "PP",
                stock: 5,
                sku: "08-camisa-seda-botoes-marrom-caramelo-pp"
          },
          {
                id: "bd7d8f07-de9a-4ec9-82f1-0d0277ff6d3a",
                color: "Marrom Caramelo",
                size: "P",
                stock: 5,
                sku: "08-camisa-seda-botoes-marrom-caramelo-p"
          },
          {
                id: "c15d4731-04ba-4f9e-b324-4936e9695dc4",
                color: "Marrom Caramelo",
                size: "M",
                stock: 5,
                sku: "08-camisa-seda-botoes-marrom-caramelo-m"
          },
          {
                id: "c8e7dda0-c186-47f8-8e47-cfc43ac2e4d5",
                color: "Marrom Caramelo",
                size: "G",
                stock: 5,
                sku: "08-camisa-seda-botoes-marrom-caramelo-g"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/03-conjunto-cetim/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/01-casaco-tricot/branco.jpg',
        label: 'Branco Off-White'
      }
    ],
    thumbnail: '/products/01-casaco-tricot/branco.jpg',
    rating: 4.9,
    reviewCount: 20
  },
  {
    id: '09-saia-midi-plissada',
    name: 'Saia Midi Plissada Textura Canelada',
    price: 199.90,
    formattedPrice: 'R$ 199,90',
    category: 'Saias',
    subcategory: 'Saias',
    fabric: 'Tricot Biamar',
    fit: 'Fluida / Evasê',
    line: 'Casual Chic',
    status: ['Novidade', 'Pronta Entrega'],
    isNewArrival: true,
    badge: 'Restam 4 peças',
    remainingPieces: 4,
    isLastPieces: true,
    description: 'Saia em malharia fina plissada com elástico confortável na cintura. Cria um movimento belíssimo ao caminhar, perfeita para transitar do dia para a noite.',
    details: [
      'Plissado permanente que não deforma com a lavagem',
      'Cós elástico macio que se molda suavemente à cintura',
      'Comprimento midi elegante abaixo do joelho',
      'Trama encorpada que dispensa o uso de forro extra'
    ],
    sizes: ['P', 'M', 'Tamanho Único'],
    colors: [
      { name: 'Marrom Caramelo', hex: '#8B5A2B', imageSrc: '/products/01-casaco-tricot/marrom.jpg' },
      { name: 'Rosa Quartz', hex: '#E8A598', imageSrc: '/products/02-blusa-tricot-rosa/rosa.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "55510832-13d4-44d7-a885-b56d5152ee6e",
                color: "Marrom Caramelo",
                size: "P",
                stock: 5,
                sku: "09-saia-midi-plissada-marrom-caramelo-p"
          },
          {
                id: "f797a8f2-b05e-4c89-bf96-5ec0501f65b0",
                color: "Marrom Caramelo",
                size: "M",
                stock: 5,
                sku: "09-saia-midi-plissada-marrom-caramelo-m"
          },
          {
                id: "1a92aa0e-b708-49c7-b6a4-36201d4d5d87",
                color: "Marrom Caramelo",
                size: "Tamanho Único",
                stock: 5,
                sku: "09-saia-midi-plissada-marrom-caramelo-tamanho-unico"
          },
          {
                id: "a3746684-a34e-4702-902d-9f83f9ac820a",
                color: "Rosa Quartz",
                size: "P",
                stock: 5,
                sku: "09-saia-midi-plissada-rosa-quartz-p"
          },
          {
                id: "382ab7df-0cec-4006-a535-fb5b33ab88fd",
                color: "Rosa Quartz",
                size: "M",
                stock: 5,
                sku: "09-saia-midi-plissada-rosa-quartz-m"
          },
          {
                id: "2e91b6f0-d278-4c95-850b-2c3d5cfc824a",
                color: "Rosa Quartz",
                size: "Tamanho Único",
                stock: 5,
                sku: "09-saia-midi-plissada-rosa-quartz-tamanho-unico"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/01-casaco-tricot/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/01-casaco-tricot/marrom.jpg',
        label: 'Marrom Caramelo'
      }
    ],
    thumbnail: '/products/01-casaco-tricot/marrom.jpg',
    rating: 4.8,
    reviewCount: 8
  },
  {
    id: '10-bermuda-alfaiataria-chic',
    name: 'Bermuda Alfaiataria Pregas Duplas',
    price: 179.90,
    formattedPrice: 'R$ 179,90',
    category: 'Bermudas & Shorts',
    subcategory: 'Bermudas & Shorts',
    fabric: 'Crepe Alfaiataria',
    fit: 'Reta Clássica',
    line: 'Casual Chic',
    status: ['Pronta Entrega'],
    badge: 'Restam 3 peças',
    remainingPieces: 3,
    isLastPieces: true,
    description: 'Bermuda de corte reto em alfaiataria premium com comprimento meia-coxa elegante. Traz pregas frontais bem definidas e bolsos laterais funcionais.',
    details: [
      'Acabamento de alfaiataria masculina adaptado ao corpo feminino',
      'Comprimento moderado ideal para propostas elegantes no calor',
      'Passantes largos para compor com cintos de couro'
    ],
    sizes: ['36', '38', '40', '42'],
    colors: [
      { name: 'Bege Areia Nobre', hex: '#E2D3B8', imageSrc: '/products/04-conjunto-alfaiataria-bege/bege.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "521f1cd7-3521-4355-9831-c86db22cee65",
                color: "Bege Areia Nobre",
                size: "36",
                stock: 5,
                sku: "10-bermuda-alfaiataria-chic-bege-areia-nobre-36"
          },
          {
                id: "e17e0909-0595-4696-9bd9-313fb76b0e1e",
                color: "Bege Areia Nobre",
                size: "38",
                stock: 5,
                sku: "10-bermuda-alfaiataria-chic-bege-areia-nobre-38"
          },
          {
                id: "bee21015-504c-43da-a7f9-36c1c23cdbdd",
                color: "Bege Areia Nobre",
                size: "40",
                stock: 5,
                sku: "10-bermuda-alfaiataria-chic-bege-areia-nobre-40"
          },
          {
                id: "82c154d7-c805-41f6-ab76-ecc86a9fbca4",
                color: "Bege Areia Nobre",
                size: "42",
                stock: 5,
                sku: "10-bermuda-alfaiataria-chic-bege-areia-nobre-42"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/04-conjunto-alfaiataria-bege/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
        label: 'Bege Areia'
      }
    ],
    thumbnail: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
    rating: 4.7,
    reviewCount: 7
  },
  {
    id: '11-cinto-couro-fivela-dourada',
    name: 'Cinto em Couro Legítimo com Fivela Dourada',
    price: 89.90,
    formattedPrice: 'R$ 89,90',
    category: 'Acessórios',
    subcategory: 'Cintos',
    fabric: 'Couro Premium',
    fit: 'Ajustada / Slim',
    line: 'Casual Chic',
    status: ['Mais Vendido', 'Pronta Entrega'],
    isBestSeller: true,
    description: 'Cinto fino em couro estruturado com acabamento fosco e fivela geométrica em banho dourado de alta durabilidade. O toque final que transforma qualquer produção básica.',
    details: [
      'Couro macio que não craquela',
      'Fivela antialérgica com banho especial verniz',
      'Largura média ideal para calças de alfaiataria ou acinturar blazers',
      'Comprimento ajustável com 7 furos'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Marrom Caramelo', hex: '#8B5A2B', imageSrc: '/products/01-casaco-tricot/marrom.jpg' },
      { name: 'Preto Clássico', hex: '#1A1918', imageSrc: '/products/01-casaco-tricot/marrom.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "663890a7-f31f-449a-9ae7-5aa89d37ddde",
                color: "Marrom Caramelo",
                size: "Tamanho Único",
                stock: 5,
                sku: "11-cinto-couro-fivela-dourada-marrom-caramelo-tamanho-unico"
          },
          {
                id: "18cb61c6-e4a2-43ac-824d-662d1a90775d",
                color: "Preto Clássico",
                size: "Tamanho Único",
                stock: 5,
                sku: "11-cinto-couro-fivela-dourada-preto-classico-tamanho-unico"
          }
    ],
    media: [
      {
        type: 'image',
        src: '/products/01-casaco-tricot/marrom.jpg',
        label: 'Cinto Couro Caramelo'
      }
    ],
    thumbnail: '/products/01-casaco-tricot/marrom.jpg',
    rating: 4.9,
    reviewCount: 25
  },
  {
    id: '12-colar-elo-dourado',
    name: 'Colar Elos Portugueses Banho Ouro 18k',
    price: 99.00,
    formattedPrice: 'R$ 99,00',
    category: 'Acessórios',
    subcategory: 'Colares & Joias',
    fabric: 'Metal Nobre Banho 18k',
    fit: 'Ajustada / Slim',
    line: 'Festa & Noite',
    status: ['Novidade', 'Pronta Entrega'],
    isNewArrival: true,
    description: 'Colar com corrente de elos entrelaçados em acabamento polido reluzente. Design marcante que valoriza decotes e eleva produções com camisas e tricots.',
    details: [
      'Banho de alta espessura com camada hipoalergênica',
      'Fecho lagosta seguro com extensor de 5cm',
      'Brilho radiante que dura anos com os devidos cuidados',
      'Acompanha saquinho de veludo para proteção'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Dourado Champagne', hex: '#DFBE76', imageSrc: '/products/04-conjunto-alfaiataria-bege/bege.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "eb766939-4039-4d5a-a4ef-3b2c11a96913",
                color: "Dourado Champagne",
                size: "Tamanho Único",
                stock: 5,
                sku: "12-colar-elo-dourado-dourado-champagne-tamanho-unico"
          }
    ],
    media: [
      {
        type: 'image',
        src: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
        label: 'Colar Elos Dourados'
      }
    ],
    thumbnail: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
    rating: 5.0,
    reviewCount: 19
  },
  {
    id: '13-bolsa-clutch-acetinada',
    name: 'Bolsa Baguette Estruturada com Alça Corrente',
    price: 299.90,
    formattedPrice: 'R$ 299,90',
    category: 'Acessórios',
    subcategory: 'Bolsas & Carteiras',
    fabric: 'Couro Premium',
    fit: 'Reta Clássica',
    line: 'Festa & Noite',
    status: ['Novidade'],
    isNewArrival: true,
    description: 'Bolsa modelo baguette em material nobre com acabamento impecável. Acompanha duas opções de alça: uma em corrente dourada para eventos e outra em couro para o dia a dia.',
    details: [
      'Compartimento interno com bolso para cartões e documentos',
      'Fechamento com botão magnético de precisão',
      'Forro interno em camurça aveludada',
      'Espaço perfeito para celular, chaves e maquiagem'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Prata Acetinado', hex: '#D1D5DB', imageSrc: '/products/03-conjunto-cetim/prata.jpg' },
      { name: 'Branco Off-White', hex: '#FAF9F6', imageSrc: '/products/01-casaco-tricot/branco.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "6c4cea7f-23a6-4e3c-9d02-c406843fa8e5",
                color: "Prata Acetinado",
                size: "Tamanho Único",
                stock: 5,
                sku: "13-bolsa-clutch-acetinada-prata-acetinado-tamanho-unico"
          },
          {
                id: "9e231ee1-8d1c-479d-918d-065f0dee763b",
                color: "Branco Off-White",
                size: "Tamanho Único",
                stock: 5,
                sku: "13-bolsa-clutch-acetinada-branco-off-white-tamanho-unico"
          }
    ],
    media: [
      {
        type: 'image',
        src: '/products/03-conjunto-cetim/prata.jpg',
        label: 'Bolsa Baguette'
      }
    ],
    thumbnail: '/products/03-conjunto-cetim/prata.jpg',
    rating: 5.0,
    reviewCount: 12
  },
  {
    id: '14-lenco-seda-estampado',
    name: 'Lenço em Seda Pura Acabamento Rolotê',
    price: 79.90,
    formattedPrice: 'R$ 79,90',
    originalPrice: 94.90,
    formattedOriginalPrice: 'R$ 94,90',
    discountBadge: 'OUTLET 15% OFF',
    category: 'Acessórios',
    subcategory: 'Lenços',
    fabric: 'Cetim de Seda',
    fit: 'Fluida / Evasê',
    line: 'Resort & Elegância',
    status: ['OUTLET', 'Pronta Entrega'],
    isOutlet: true,
    description: 'Lenço quadrado em seda fluida com estampa geométrica inspirada na Riviera Italiana. Versatilidade infinita: amarre no pescoço, no cabelo, na bolsa ou use como cinto delicado.',
    details: [
      'Barra enrolada à mão com acabamento artesanal',
      'Estamparia digital de altíssima definição',
      'Medidas: 70cm x 70cm',
      'Toque macio e refrescante'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Rosa Quartz', hex: '#E8A598', imageSrc: '/products/02-blusa-tricot-rosa/rosa.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "af3a14c2-0728-42fa-8206-50106c15f79a",
                color: "Rosa Quartz",
                size: "Tamanho Único",
                stock: 5,
                sku: "14-lenco-seda-estampado-rosa-quartz-tamanho-unico"
          }
    ],
    media: [
      {
        type: 'image',
        src: '/products/02-blusa-tricot-rosa/rosa.jpg',
        label: 'Lenço Seda'
      }
    ],
    thumbnail: '/products/02-blusa-tricot-rosa/rosa.jpg',
    rating: 4.8,
    reviewCount: 17
  },
  {
    id: '15-colete-alfaiataria-botoes',
    name: 'Colete de Alfaiataria Feminino Sem Manga',
    price: 199.90,
    formattedPrice: 'R$ 199,90',
    category: 'Coletes & Cardigãs',
    subcategory: 'Coletes & Cardigãs',
    fabric: 'Crepe Alfaiataria',
    fit: 'Alfaiataria Estruturada',
    line: 'Trabalho & Alfaiataria',
    status: ['Novidade', 'Mais Vendido'],
    isNewArrival: true,
    isBestSeller: true,
    badge: 'Última peça',
    remainingPieces: 1,
    isLastPieces: true,
    description: 'Colete com decote V e abotoamento frontal em crepe de alfaiataria. A peça queridinha da temporada que pode ser usada fechada como blusa ou aberta em sobreposições chiques.',
    details: [
      'Pala traseira com fivela de ajuste para cinturar o corpo',
      'Forro acetinado macio em toda a extensão',
      'Botões nobres forrados no mesmo tecido'
    ],
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Bege Areia Nobre', hex: '#E2D3B8', imageSrc: '/products/04-conjunto-alfaiataria-bege/bege.jpg' }
    ],
    totalStock: 15,
    variations: [
          {
                id: "606f38e3-2ba9-4974-a006-b08ddad24e51",
                color: "Bege Areia Nobre",
                size: "P",
                stock: 5,
                sku: "15-colete-alfaiataria-botoes-bege-areia-nobre-p"
          },
          {
                id: "3ad1165b-e31f-4bd2-a37c-49811cf08c6c",
                color: "Bege Areia Nobre",
                size: "M",
                stock: 5,
                sku: "15-colete-alfaiataria-botoes-bege-areia-nobre-m"
          },
          {
                id: "8bf41499-5941-4391-9d1a-fb5b0a07a051",
                color: "Bege Areia Nobre",
                size: "G",
                stock: 5,
                sku: "15-colete-alfaiataria-botoes-bege-areia-nobre-g"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/04-conjunto-alfaiataria-bege/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
        label: 'Colete Bege'
      }
    ],
    thumbnail: '/products/04-conjunto-alfaiataria-bege/bege.jpg',
    rating: 4.9,
    reviewCount: 21
  },
  {
    id: '16-sobretudo-la-premium',
    name: 'Sobretudo Estruturado em Lã Batida Deluxe',
    price: 699.90,
    formattedPrice: 'R$ 699,90',
    category: 'Casacos & Jaquetas',
    subcategory: 'Casacos & Jaquetas',
    fabric: 'Lã & Fios Nobres',
    fit: 'Ampla / Oversized',
    line: 'Resort & Elegância',
    status: ['Novidade'],
    isNewArrival: true,
    badge: 'Restam 2 peças',
    remainingPieces: 2,
    isLastPieces: true,
    description: 'Casaco sobretudo longo com gola imponente e cinto faixa para amarração. Confeccionado para quem exige o mais alto padrão térmico e estético nos dias frios.',
    details: [
      'Lã batida de toque denso e macio',
      'Bolsos embutidos profundos para aquecer as mãos',
      'Fenda traseira que garante liberdade total de movimento',
      'Acompanha cinto faixa largo no mesmo tecido'
    ],
    sizes: ['M', 'G'],
    colors: [
      { name: 'Marrom Caramelo', hex: '#8B5A2B', imageSrc: '/products/01-casaco-tricot/marrom.jpg' }
    ],
    totalStock: 2,
    variations: [
          {
                id: "a54ed007-b02f-4286-aeb4-edfc287eb037",
                color: "Marrom Caramelo",
                size: "M",
                stock: 1,
                sku: "16-sobretudo-la-premium-marrom-caramelo-m"
          },
          {
                id: "56e23b04-6506-4a3f-b2ad-4300d6272b1c",
                color: "Marrom Caramelo",
                size: "G",
                stock: 1,
                sku: "16-sobretudo-la-premium-marrom-caramelo-g"
          }
    ],
    media: [
      {
        type: 'video',
        src: '/products/01-casaco-tricot/video.mp4',
        label: 'Vídeo no Provador (Leidy)'
      },
      {
        type: 'image',
        src: '/products/01-casaco-tricot/marrom.jpg',
        label: 'Sobretudo Caramelo'
      }
    ],
    thumbnail: '/products/01-casaco-tricot/marrom.jpg',
    rating: 5.0,
    reviewCount: 6
  }
];

export const CATEGORIES_ROUPAS = [
  'Bermudas & Shorts',
  'Blazers & Alfaiataria',
  'Blusas & Tops',
  'Calças',
  'Camisas',
  'Casacos & Jaquetas',
  'Coletes & Cardigãs',
  'Conjuntos Exclusivos',
  'Saias',
  'Tricots',
  'Underwear & Loungewear',
  'Vestidos & Macacões'
];

export const CATEGORIES_ACESSORIOS = [
  'Bolsas & Carteiras',
  'Cintos',
  'Colares & Joias',
  'Lenços',
  'Óculos de Sol'
];

export const ALL_CATEGORIES = [
  'Todas as Peças',
  ...CATEGORIES_ROUPAS,
  ...CATEGORIES_ACESSORIOS
];

export const FAIXAS_PRECO = [
  { label: 'Até R$ 99', min: 0, max: 99 },
  { label: 'R$ 99 a R$ 199', min: 99, max: 199 },
  { label: 'R$ 199 a R$ 399', min: 199, max: 399 },
  { label: 'R$ 399 a R$ 599', min: 399, max: 599 },
  { label: 'Acima de R$ 599', min: 599, max: 99999 }
];

export const FILTROS_TECIDO = [
  'Tricot Biamar',
  'Cetim de Seda',
  'Crepe Alfaiataria',
  'Linho Puro',
  'Algodão Nobre',
  'Lã & Fios Nobres',
  'Couro Premium'
];

export const FILTROS_MODELAGEM = [
  'Alfaiataria Estruturada',
  'Ampla / Oversized',
  'Reta Clássica',
  'Fluida / Evasê',
  'Ajustada / Slim'
];

export const FILTROS_LINHA = [
  'Casual Chic',
  'Trabalho & Alfaiataria',
  'Festa & Noite',
  'Resort & Elegância'
];

export const FILTROS_STATUS = [
  'Novidades',
  'Mais Vendidos',
  'Peças em OUTLET',
  'Pronta Entrega'
];

export const CATEGORIES = [
  'Todos os Modelos',
  'Mais Vendidos',
  'Casacos & Jaquetas',
  'Conjuntos Exclusivos',
  'Blazers & Alfaiataria',
  'Blusas & Tops',
  'OUTLET'
];

export const STORE_INFO = {
  name: 'Leidy Boutique',
  tagline: 'Curadoria Exclusiva em Moda Feminina',
  whatsapp: '554197347601',
  phoneFormatted: '(41) 9734-7601',
  instagram: '@leidyboutique',
  freeShippingThreshold: 350.00
};

