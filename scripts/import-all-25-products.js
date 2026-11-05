const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('pg');

// 1. Carregar variáveis de ambiente
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
});

const ffmpegPath = 'C:\\Users\\leona\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const sourceBaseDir = 'C:\\Users\\leona\\OneDrive\\Documentos\\itens';
const publicBaseDir = path.join(process.cwd(), 'public', 'products');

const LOJA_ID = 'e8b7f890-4e3a-4a89-9c56-8e1234567890';

// 2. Definição completa dos 25 produtos
const PRODUCTS_DATA = [
  {
    folder: 'item 1',
    nome: 'Conjunto Casual Chic Moletom Silk Touch',
    slug: 'conjunto-casual-chic-moletom-silk-touch',
    categoriaNome: 'Conjuntos Exclusivos',
    subcategoria: 'Moletom & Malharia',
    tecido: 'Moletom Silk Touch',
    modelagem: 'Casual Chic / Calça Reta Fluida com Amarração',
    linha: 'Casual Sofisticado',
    preco: 389.90,
    preco_custo: 155.00,
    descricao: 'Conjunto confeccionado em moletom premium de toque sedoso e caimento impecável. Composto por blusa de manga longa com gola canoa e calça reta com cós elástico, cordão ajustável e bolsos embutidos. O equilíbrio perfeito entre conforto e sofisticação para o dia a dia.',
    especificacoes: [
      'Toque sedoso Silk Touch com elasticidade confortável',
      'Calça de corte reto com bolsos embutidos e amarração no cós',
      'Blusa de manga longa com gola canoa e punhos canelados',
      'Composição: 95% Viscose Silk, 5% Elastano',
      'Lavagem delicada recomendada'
    ],
    cores: [
      {
        nome: 'Verde Militar Nobre',
        hex: '#4B5320',
        arquivos: ['61D85D1B-A567-4D14-B27E-46D7A7593567.jpg', '50D89A2C-2233-4CC9-BD9E-A4B558AA81DE.jpg']
      }
    ]
  },
  {
    folder: 'item 2',
    nome: 'Cardigã em Tricot Canelado Geométrico Preto',
    slug: 'cardiga-tricot-geometrico-preto',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Cardigãs',
    tecido: 'Tricot Fio Nobre',
    modelagem: 'Cardigã Curto Aberto com Textura em Blocos',
    linha: 'Casual Chic',
    preco: 329.90,
    preco_custo: 132.00,
    descricao: 'Cardigã clássico em tricot texturizado com relevo geométrico em pequenos blocos. Possui punhos e barra canelados e plaqueta dourada metálica personalizada de autenticidade na barra.',
    especificacoes: [
      'Trama geométrica tridimensional em alto relevo',
      'Abertura frontal sem fechamento para sobreposição elegante',
      'Plaqueta de metal dourado exclusiva na barra',
      'Composição: 70% Acrílico Nobre, 30% Poliamida',
      'Toque macio e alta durabilidade'
    ],
    cores: [
      {
        nome: 'Preto Clássico',
        hex: '#1A1918',
        arquivos: ['E660C84A-9F04-47F2-907F-C8E3925FF259.jpg', '1BCCC3B4-29D6-4A08-8E6D-C9325DAE26BB.jpg']
      }
    ]
  },
  {
    folder: 'item 4',
    nome: 'Vestido Crepe com Manga Capa Lateral & Broche Dourado',
    slug: 'vestido-crepe-manga-capa-broche',
    categoriaNome: 'Vestidos & Macacões',
    subcategoria: 'Vestidos Curtos',
    tecido: 'Crepe Georgette Nobre',
    modelagem: 'Tubinho com Manga Capa Drapeada Assimétrica',
    linha: 'Festa & Noite',
    preco: 399.90,
    preco_custo: 160.00,
    descricao: 'Vestido curto confeccionado em crepe nobre de caimento fluido e estruturado. Apresenta recorte moderno com manga capa lateral drapeada e aplicação de broche dourado refinado no ombro.',
    especificacoes: [
      'Crepe encorpado com caimento refinado e forro interno',
      'Manga capa fluida assimétrica em um dos ombros',
      'Aplicação de broche dourado geométrico no ombro',
      'Composição: 97% Poliéster Crepe, 3% Elastano; Forro 100% Poliéster',
      'Fechamento discreto com zíper invisível'
    ],
    cores: [
      {
        nome: 'Vermelho Rubi',
        hex: '#C41E3A',
        arquivos: ['temp_image_3FE92DEE-11D6-479C-A073-5A059927C208.heic', 'temp_image_4A6FC2E4-5F85-4E58-A9D9-CD632E00414F.heic']
      }
    ]
  },
  {
    folder: 'item 5',
    nome: 'Colete em Tricot com Gola em Pele Ecológica Deluxe',
    slug: 'colete-tricot-gola-pele-deluxe',
    categoriaNome: 'Coletes & Cardigãs',
    subcategoria: 'Coletes',
    tecido: 'Tricot de Lã Nobre com Pele Ecológica',
    modelagem: 'Colete Alongado sem Manga com Tranças Traseiras',
    linha: 'Inverno & Meia Estação',
    preco: 369.90,
    preco_custo: 148.00,
    descricao: 'Colete imponente em tricot com gola felpuda em pele sintética de alto padrão. Traz ponto em tranças trabalhadas nas costas e barra reforçada.',
    especificacoes: [
      'Gola e lapela frontal em pele sintética felpuda de alta densidade',
      'Trabalho de tranças clássicas nas costas em ponto relevo',
      'Modelagem alongada que desenha a silhueta com imponência',
      'Composição: 80% Acrílico Nobre, 20% Poliamida; Pele 100% Sintética',
      'Acabamento primoroso'
    ],
    cores: [
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['marrom 01.heic', 'marrom 02.heic']
      },
      {
        nome: 'Preto Clássico',
        hex: '#1A1918',
        arquivos: ['na cor preto 01.heic', 'na cor preto 02.PNG']
      }
    ]
  },
  {
    folder: 'item 6',
    nome: 'Casaco Biamar Trabalhado em Ponto Vazado Off-White',
    slug: 'casaco-biamar-ponto-vazado-offwhite',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Tricots',
    tecido: 'Tricot Biamar Exclusivo',
    modelagem: 'Ampla / Oversized com Manga Balão e Punho Longo',
    linha: 'Casual Chic',
    preco: 349.90,
    preco_custo: 140.00,
    descricao: 'Casaco em tricot trabalhado Biamar com desenhos rendados em relevo vazado. Mangas amplas com punhos longos canelados e tag em couro de autenticidade da marca. Inclui vídeo de provador.',
    especificacoes: [
      'Trama em relevo trabalhado com vazados sofisticados',
      'Mangas balão com punhos canelados longos',
      'Etiqueta original Biamar em couro no punho',
      'Composição: 70% Acrílico Nobre, 30% Poliamida',
      'Vídeo de caimento real gravado no provador'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['temp_image_3E88C13E-1F72-46A8-87C7-AC994E913C2D.heic'],
        videos: ['136a44e34f7b48cfbba9a08041bd3858.mov']
      }
    ]
  },
  {
    folder: 'item 7',
    nome: 'Blusa em Tricot Ponto Rendado com Manga Flare',
    slug: 'blusa-tricot-ponto-rendado-manga-flare',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Tricots',
    tecido: 'Tricot Fio Nobre Trabalhado',
    modelagem: 'Decote Canoa, Busto Canelado e Mangas Flare Rendadas',
    linha: 'Casual Chic',
    preco: 269.90,
    preco_custo: 108.00,
    descricao: 'Blusa sofisticada em tricot com jogo de pontos requintado: corpo canelado estruturado e mangas abertas em ponto rendado vazado geométrico. Acompanha vídeo da peça no provador.',
    especificacoes: [
      'Corpo em trama canelada de alta densidade',
      'Mangas boca-de-sino/flare em ponto rendado vazado',
      'Decote canoa estruturado',
      'Composição: 75% Acrílico Nobre, 25% Algodão',
      'Vídeo de movimento real no provador da loja'
    ],
    cores: [
      {
        nome: 'Terracota Nobre',
        hex: '#C85A32',
        arquivos: ['blusa tricot laranja 01.jpg']
      },
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['blusa tricot marrom 01.heic', 'blusa tricot marrom 02.heic'],
        videos: ['Vídeo blusa tricot_.mov']
      }
    ]
  },
  {
    folder: 'item 8',
    nome: 'Calça Pantalona em Linho Rústico com Botão Encapado',
    slug: 'calca-pantalona-linho-rustico-offwhite',
    categoriaNome: 'Calças & Pantalonas',
    subcategoria: 'Pantalonas',
    tecido: 'Linho Rústico Puro com Forro Interno',
    modelagem: 'Pantalona Cintura Alta com Pespontos e Bolsos Faca',
    linha: 'Resort & Alfaiataria',
    preco: 349.90,
    preco_custo: 139.00,
    descricao: 'Calça pantalona elegante em linho de alta qualidade com toque fresco e caimento encorpado. Cintura alta com fechamento frontal por botão encapado no mesmo tecido e bolsos faca funcionais.',
    especificacoes: [
      'Linho encorpado com forro interno antitransparência',
      'Cintura alta com botão forrado em tecido próprio',
      'Bolsos faca laterais embutidos e passantes reforçados',
      'Composição: 55% Linho Nobre, 45% Viscose; Forro 100% Algodão',
      'Caimento amplo alongador da silhueta'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['373D2DD4-E650-41F4-9FF8-104558F866C4.jpg', 'temp_image_1A50745D-5135-4A11-B69A-0D5AB7DC25CE.heic']
      }
    ]
  },
  {
    folder: 'item 9',
    nome: 'T-shirt em Malha Pima Listrada Navy Chic',
    slug: 'tshirt-malha-pima-listrada-navy',
    categoriaNome: 'Camisas & Blusas',
    subcategoria: 'T-shirts & Tops',
    tecido: 'Algodão Pima com Elastano Nobre',
    modelagem: 'T-shirt Clássica com Gola Redonda Canelada Dupla',
    linha: 'Casual Chic',
    preco: 189.90,
    preco_custo: 75.00,
    descricao: 'T-shirt essencial inspirada no minimalismo chic francês. Malha encorpada que não marca, gola redonda canelada e listras horizontais harmônicas que combinam com alfaiatarias e jeans.',
    especificacoes: [
      'Algodão Pima nobre com toque aveludado peach touch',
      'Padronagem listrada refinada estilo marinheiro/navy chic',
      'Gola redonda com ribana canelada dupla anti-deformação',
      'Composição: 96% Algodão Pima, 4% Elastano',
      'Não desbota e mantém estrutura após lavagem'
    ],
    cores: [
      {
        nome: 'Bege Areia Nobre',
        hex: '#E2D3B8',
        arquivos: ['58DAD9B1-0192-4D01-99C7-719411FA75F7.jpg', 'temp_image_F9A729A6-0168-4C70-9AEC-9BDE4E0F0456.heic']
      }
    ]
  },
  {
    folder: 'item 10',
    nome: 'Conjunto Slip Chic Regata Fendas & Calça Cenoura',
    slug: 'conjunto-slip-chic-regata-calca-cenoura',
    categoriaNome: 'Conjuntos Exclusivos',
    subcategoria: 'Conjuntos de Festa',
    tecido: 'Crepe Acetinado Toque de Seda',
    modelagem: 'Regata Alongada com Alças Finas e Fendas + Calça Cenoura',
    linha: 'Noite & Festa',
    preco: 389.90,
    preco_custo: 155.00,
    descricao: 'Conjunto fluido em crepe acetinado preto. A regata longa possui decote V e fendas laterais para movimento fluido; a calça traz modelagem cenoura com detalhe ajustado no tornozelo.',
    especificacoes: [
      'Crepe toque acetinado com caimento esvoaçante',
      'Regata com alças espaguete duplas e fendas laterais longas',
      'Calça cenoura de alfaiataria com cós anatômico',
      'Composição: 97% Poliéster Acetinado, 3% Elastano',
      'Visual monocromático ultra elegante'
    ],
    cores: [
      {
        nome: 'Preto Clássico',
        hex: '#1A1918',
        arquivos: ['temp_image_AD108846-9AC6-429C-99EC-867BCFA8C9AA.heic', 'temp_image_FCB37BC1-5C45-4FCF-9E0D-C6164157E4D6.heic']
      }
    ]
  },
  {
    folder: 'item 11',
    nome: 'Conjunto Twin-Set Tricot Decote Ondulado com Botões Dourados',
    slug: 'conjunto-twinset-tricot-decote-ondulado',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Conjuntos',
    tecido: 'Tricot Fio Nobre Canelado',
    modelagem: 'Regata Canelada com Borda Ondulada + Cardigã Manga Longa com Botões Dourados',
    linha: 'Casual Chic',
    preco: 299.90,
    preco_custo: 120.00,
    descricao: 'Conjunto twin-set de toque macio e delicado. Regata com decote trabalhado em ondas recortadas e cardigã com fechamento por botões dourados e borda ondulada correspondente.',
    especificacoes: [
      'Fio de tricot macio com elasticidade natural',
      'Recortes ondulados scallop na gola e abertura do cardigã',
      'Botões de metal dourado com acabamento polido',
      'Composição: 65% Viscose, 35% Poliamida',
      'Permite uso conjunto ou peças separadas'
    ],
    cores: [
      {
        nome: 'Azul Serenity',
        hex: '#6B8EAE',
        arquivos: ['azul.heic']
      },
      {
        nome: 'Rosa Quartz',
        hex: '#E8A598',
        arquivos: ['rosa.jpg']
      }
    ]
  },
  {
    folder: 'item 12',
    nome: 'Vestido Chemise Midi em Linho Rústico com Botões Tartaruga',
    slug: 'vestido-chemise-midi-linho-rustico-offwhite',
    categoriaNome: 'Linho Rústico',
    subcategoria: 'Vestidos',
    tecido: 'Linho Rústico Puro com Forro Interno',
    modelagem: 'Chemise Midi com Abotoamento Frontal Completo e Barra Arredondada',
    linha: 'Resort & Elegância',
    preco: 389.90,
    preco_custo: 155.00,
    descricao: 'Vestido chemise midi em linho puro com abotoamento frontal por botões estilo tartaruga, gola colarinho clássica, bolsos funcionais com lapela no peito e fendas laterais curvadas.',
    especificacoes: [
      'Linho puro com caimento encorpado e frescor térmico',
      'Abotoamento frontal integral com botões efeito tartaruga',
      'Bolsos utilitários frontais com detalhe de martingalês',
      'Composição: 100% Linho com forro em viscose',
      'Barra mullet suave com fendas laterais'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['branco.heic', 'branco 02.heic']
      }
    ]
  },
  {
    folder: 'item 13',
    nome: 'Conjunto Vestido Midi & Casaqueto Rendado Vazado',
    slug: 'conjunto-vestido-midi-casaqueto-rendado',
    categoriaNome: 'Vestidos & Macacões',
    subcategoria: 'Conjuntos de Festa',
    tecido: 'Crepe Alfaiataria Nobre com Barra e Casaqueto em Trama Rendada Vazada',
    modelagem: 'Vestido Regata Decote Quadrado + Casaqueto Manga Curta com Botões Dourados',
    linha: 'Festa & Noite',
    preco: 489.90,
    preco_custo: 195.00,
    descricao: 'Conjunto exclusivo composto por vestido midi com decote quadrado, bolsos embutidos e barra em trama rendada vazada geométrica; inclui casaqueto combinando com mangas curtas e botões metálicos dourados.',
    especificacoes: [
      'Crepe alfaiataria premium de toque sedoso',
      'Barra vazada geométrica com forro contrastante suave',
      'Casaqueto curto com mangas princesa e botões em metal dourado',
      'Composição: 95% Poliéster Nobre, 5% Elastano',
      'Peça de alta presença visual para eventos e festas'
    ],
    cores: [
      {
        nome: 'Azul Marinho Nobre',
        hex: '#1B263B',
        arquivos: ['vestido azul 01.heic', 'vestido azul 02.heic', 'vestido azul 03.heic']
      }
    ]
  },
  {
    folder: 'item 14',
    nome: 'Blusa em Tricot Ponto Leque Escamado em Relevo',
    slug: 'blusa-tricot-ponto-leque-escamado',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Tricots',
    tecido: 'Tricot Fio Nobre Trabalhado em Relevo 3D',
    modelagem: 'Blusa Manga Curta com Decote Redondo e Barra Ondulada',
    linha: 'Casual Chic',
    preco: 249.90,
    preco_custo: 99.00,
    descricao: 'Blusa primorosa em tricot com trama escamada em ponto leque tridimensional. Mangas curtas com acabamento rendado e barra esculpida em ondas naturais do próprio tricot.',
    especificacoes: [
      'Trama em relevo trabalhado 3D ponto leque',
      'Mangas curtas com acabamento rendado recortado',
      'Decote redondo canelado de alta sustentação',
      'Composição: 70% Acrílico Nobre, 30% Poliamida',
      'Toque aveludado que não pinica na pele'
    ],
    cores: [
      {
        nome: 'Bege Areia Nobre',
        hex: '#E2D3B8',
        arquivos: ['bege.heic']
      },
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['marrom.jpg']
      }
    ]
  },
  {
    folder: 'item 15',
    nome: 'T-shirt Algodão Pima com Mangas em Crochet Rendado',
    slug: 'tshirt-algodao-pima-manga-crochet',
    categoriaNome: 'Camisas & Blusas',
    subcategoria: 'T-shirts & Tops',
    tecido: 'Algodão Pima com Mangas em Crochet de Fio Nobre',
    modelagem: 'T-shirt Estruturada com Manga Curta Rendada e Gola Picueta',
    linha: 'Casual Chic',
    preco: 219.90,
    preco_custo: 88.00,
    descricao: 'T-shirt que mescla a suavidade do algodão pima com a sofisticação artesanal das mangas em crochet rendado vazado. Gola redonda com acabamento canelado em picueta.',
    especificacoes: [
      'Corpo em puro algodão pima de toque aveludado',
      'Mangas artesanais em trama crochet vazada geométrica',
      'Gola com acabamento em picueta canelada feminina',
      'Composição: 95% Algodão Pima, 5% Elastano; Mangas 100% Algodão Fio',
      'Alta respirabilidade e conforto térmico'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['branco.heic']
      },
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['marrom.heic']
      },
      {
        nome: 'Rosa Quartz',
        hex: '#E8A598',
        arquivos: ['rosa.heic']
      }
    ]
  },
  {
    folder: 'item 16',
    nome: 'Calça Sarja Alfaiatada Reta com Botão Metalizado',
    slug: 'calca-sarja-alfaiatada-reta-offwhite',
    categoriaNome: 'Calças & Pantalonas',
    subcategoria: 'Calças Alfaiataria',
    tecido: 'Sarja Nobre de Algodão com Elastano',
    modelagem: 'Reta Alfaiatada com Bolsos Faca e Pespontos Frontais',
    linha: 'Casual Chic / Alfaiataria',
    preco: 289.90,
    preco_custo: 115.00,
    descricao: 'Calça em sarja encorpada com corte reto clássico e toque acetinado. Apresenta cós com passantes, botão de metal exclusivo e bolsos faca funcionais com costura reforçada.',
    especificacoes: [
      'Sarja acetinada encorpada com elastano',
      'Corte reto com caimento alinhado que veste perfeito',
      'Botão de metal maciço e zíper de alta durabilidade',
      'Composição: 98% Algodão, 2% Elastano',
      'Bolsos frontais estilo faca'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['calça branca.heic']
      }
    ]
  },
  {
    folder: 'item 17',
    nome: 'Maxi Suéter em Tricot Gola Rolê Confort',
    slug: 'maxi-sueter-tricot-gola-role-bege',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Tricots',
    tecido: 'Tricot Cashmere Touch',
    modelagem: 'Maxi Suéter Alongado com Gola Boba / Rolê e Fenda Lateral',
    linha: 'Inverno & Meia Estação',
    preco: 349.90,
    preco_custo: 139.00,
    descricao: 'Suéter alongado em tricot aveludado de alto conforto térmico. Gola ampla e macia, mangas longas com punhos ajustados e fendas laterais na barra que garantem mobilidade e elegância sobreposta.',
    especificacoes: [
      'Fio Cashmere Touch de toque macio que não pinica',
      'Gola rolê ampla aconchegante',
      'Fendas laterais que valorizam o caimento com leggings ou calças',
      'Composição: 75% Acrílico Nobre, 25% Poliamida',
      'Modelagem alongada e confortável'
    ],
    cores: [
      {
        nome: 'Bege Areia Nobre',
        hex: '#E2D3B8',
        arquivos: ['IMG_5173.PNG']
      }
    ]
  },
  {
    folder: 'item 18',
    nome: 'Camisa Transpassada em Cetim Acetinado com Gola Smoking',
    slug: 'camisa-transpassada-cetim-gola-smoking',
    categoriaNome: 'Camisas & Blusas',
    subcategoria: 'Camisas de Cetim',
    tecido: 'Cetim Toque de Seda Premium',
    modelagem: 'Transpassada / Wrap com Decote V Profundo e Mangas Bufantes',
    linha: 'Noite & Alfaiataria',
    preco: 299.90,
    preco_custo: 119.00,
    descricao: 'Camisa elegante em cetim encorpado de brilho champanhe sutil. Gola estilo smoking com decote V transpassado sem botões aparentes e mangas longas bufantes com punhos franzidos em elástico delicado.',
    especificacoes: [
      'Cetim toque de seda com brilho fosco sofisticado',
      'Decote transpassado drapeado com gola smoking elegante',
      'Mangas longas amplas com punhos franzidos em elástico',
      'Composição: 97% Cetim Seda, 3% Elastano',
      'Ideal para eventos, reuniões e produções requintadas'
    ],
    cores: [
      {
        nome: 'Dourado Champagne',
        hex: '#DFBE76',
        arquivos: ['temp_image_8D8E707D-1771-49E0-BA8B-A15CDC5EB74F.heic']
      }
    ]
  },
  {
    folder: 'item 19',
    nome: 'Vestido Tubinho Curto em Linho Puro com Decote Canoa Cavado',
    slug: 'vestido-tubinho-curto-linho-puro',
    categoriaNome: 'Vestidos & Macacões',
    subcategoria: 'Vestidos Curtos',
    tecido: 'Linho Rústico Nobre com Forro Interno',
    modelagem: 'Tubinho Curto Minimalista com Decote Redondo Cavado',
    linha: 'Resort & Elegância',
    preco: 349.90,
    preco_custo: 139.00,
    descricao: 'Vestido tubinho em linho nobre de corte reto minimalista. Decote canoa elegante, cavas estruturadas que valorizam a postura e forro interno completo que proporciona total conforto e opacidade.',
    especificacoes: [
      'Linho puro nobre com acabamento pré-encolhido',
      'Corte tubinho estruturado com pences anatômicas',
      'Forro interno integral em algodão leve',
      'Composição: 100% Linho Nobre; Forro 100% Algodão',
      'Fechamento traseiro por zíper invisível'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['temp_image_41E16667-FBF8-4203-B7F1-2552EA66B4A5.heic']
      },
      {
        nome: 'Azul Royal',
        hex: '#1D4ED8',
        arquivos: ['temp_image_57D8D111-039F-4740-98CB-46ED4E10E294.heic']
      }
    ]
  },
  {
    folder: 'item 20',
    nome: 'Camisa Alfaiataria Oversized Listrada com Bolsos Contrastantes',
    slug: 'camisa-alfaiataria-oversized-listrada',
    categoriaNome: 'Camisas & Blusas',
    subcategoria: 'Camisas Alfaiataria',
    tecido: 'Tricoline de Algodão Nobre Fio Tinto',
    modelagem: 'Camisa Oversized com Bolsos Duplos e Botões Madrepérola',
    linha: 'Trabalho & Alfaiataria',
    preco: 279.90,
    preco_custo: 112.00,
    descricao: 'Camisa ampla de alfaiataria em algodão puro com listras clássicas em tom marrom e branco. Bolsos frontais com padronagem horizontal que criam contraste geométrico moderno com o corpo vertical da peça.',
    especificacoes: [
      'Tricoline fio tinto de alta gramatura e toque suave',
      'Listras clássicas verticais com bolsos frontais em listras horizontais',
      'Botões madrepérola exclusivos com costura cruzada reforçada',
      'Composição: 100% Algodão Nobre',
      'Modelagem oversized moderna'
    ],
    cores: [
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['temp_image_2359CF66-3376-46A5-9C9B-B1F0708DC3EA.heic']
      }
    ]
  },
  {
    folder: 'item 21',
    nome: 'Blusa Casual Chic Manga Crochetada Rosa Quartz',
    slug: 'blusa-casual-chic-manga-crochet-rosa',
    categoriaNome: 'Camisas & Blusas',
    subcategoria: 'T-shirts & Tops',
    tecido: 'Malha Cotton Silk com Mangas Rendadas',
    modelagem: 'T-shirt Gola Redonda com Mangas em Ponto Rede Vazado',
    linha: 'Casual Chic',
    preco: 219.90,
    preco_custo: 88.00,
    descricao: 'Blusa feminina delicada em malha premium na tonalidade Rosa Quartz. Destaque para as mangas curtas em trama rendada vazada e gola em ribana canelada macia.',
    especificacoes: [
      'Malha Cotton Silk com toque de seda extremamente macio',
      'Mangas trabalhadas em ponto rede vazado crochet',
      'Gola redonda com ribana canelada fina',
      'Composição: 95% Algodão, 5% Elastano; Mangas 100% Algodão',
      'Caimento perfeito para o corpo'
    ],
    cores: [
      {
        nome: 'Rosa Quartz',
        hex: '#E8A598',
        arquivos: ['261E6498-23F8-4A55-B86F-9AB0B777BCD3.jpg']
      }
    ]
  },
  {
    folder: 'item 22',
    nome: 'Blusa Canelada em Tricot Biamar com Decote V & Botões Dourados',
    slug: 'blusa-canelada-biamar-decote-v-offwhite',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Tricots',
    tecido: 'Fio Biamar Canelado Nobre',
    modelagem: 'Blusa Manga Longa Canelada com Decote V e Punhos com Botões de Metal',
    linha: 'Casual Chic',
    preco: 259.90,
    preco_custo: 104.00,
    descricao: 'Blusa ajustada em tricot canelado de toque acetinado. Decote V que alonga a silhueta e punhos compridos adornados por fileira de delicados botões dourados funcionais.',
    especificacoes: [
      'Tricot canelado de alta elasticidade com memória de fibra',
      'Fileira de botões dourados polidos nos punhos',
      'Decote V desenhado com acabamento sem costura aparente',
      'Composição: 70% Viscose, 30% Poliamida',
      'Toque extremamente macio e aconchegante'
    ],
    cores: [
      {
        nome: 'Branco Off-White',
        hex: '#FAF9F6',
        arquivos: ['E79791D1-ACF6-4969-B110-5969A52F0211.jpg']
      }
    ]
  },
  {
    folder: 'item 23',
    nome: 'Conjunto Tricot Biamar Tranças Verticais & Calça com Vinco',
    slug: 'conjunto-tricot-biamar-trancas-bordo',
    categoriaNome: 'Conjuntos Exclusivos',
    subcategoria: 'Conjuntos de Inverno',
    tecido: 'Tricot Biamar Encorpado',
    modelagem: 'Blusa Manga Bufante com Tranças + Calça Reta com Vinco Pespontado e Cordão',
    linha: 'Inverno & Casual Sofisticado',
    preco: 429.90,
    preco_custo: 170.00,
    descricao: 'Conjunto exclusivo Biamar em tricot nobre no sofisticado tom bordô marsala. Blusa com tranças verticais, mangas volumosas com punho longo e etiqueta Biamar; calça com nervura frontal alongadora e amarração.',
    especificacoes: [
      'Fio nobre Biamar de alta retenção térmica',
      'Blusa com ponto tranças verticais e mangas bufantes com punho canelado longo',
      'Calça com nervura frontal pespontada e cós com cordão',
      'Etiqueta exclusiva Biamar em couro no punho',
      'Composição: 70% Acrílico Nobre, 30% Poliamida'
    ],
    cores: [
      {
        nome: 'Bordô Marsala',
        hex: '#6B1D2F',
        arquivos: ['temp_image_59AF1E1D-52E2-471E-98C1-303363D9900C.heic']
      }
    ]
  },
  {
    folder: 'item 24',
    nome: 'Conjunto Twin-Set Tricot Geométrico Caramelo',
    slug: 'conjunto-twinset-tricot-geometrico-caramelo',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Conjuntos',
    tecido: 'Tricot Fio Nobre Trabalhado em Relevo',
    modelagem: 'Cardigã Cropped com Padronagem em Blocos + Regata Interna Coordenada',
    linha: 'Casual Chic',
    preco: 349.90,
    preco_custo: 140.00,
    descricao: 'Conjunto twin-set em tricot fio nobre na cor Marrom Caramelo. Apresenta textura geométrica tridimensional em relevo, composto por cardigã de manga longa e regata interna de mesma padronagem.',
    especificacoes: [
      'Textura geométrica quadriculada em alto relevo',
      'Composto por regata decote reto + cardigã manga longa',
      'Acabamentos canelados nos punhos e barra',
      'Composição: 70% Acrílico Nobre, 30% Poliamida',
      'Visual monocromático sofisticado'
    ],
    cores: [
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['C4333CF9-319B-4444-B9F4-83988EB7F21A.jpg']
      }
    ]
  },
  {
    folder: 'item 25',
    nome: 'Cardigã Bomber Tricot Ponto Pipoca / Folhas Relevo',
    slug: 'cardiga-bomber-tricot-ponto-pipoca-terracota',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Cardigãs',
    tecido: 'Tricot Fio Nobre Trabalhado',
    modelagem: 'Cardigã Bomber Aberto com Textura Tridimensional e Manga Bufante',
    linha: 'Casual Chic',
    preco: 319.90,
    preco_custo: 128.00,
    descricao: 'Cardigã em tricot artesanal com textura em alto relevo de ponto pipoca e folhas entrelaçadas. Decote V aberto, punhos ajustados e caimento aconchegante em tom quente outonal.',
    especificacoes: [
      'Ponto pipoca tridimensional artesanal em alto relevo',
      'Modelagem estilo bomber com punhos canelados',
      'Abertura frontal limpa sem fecho para sobreposição perfeita',
      'Composição: 80% Acrílico Nobre, 20% Lã Suave',
      'Toque volumoso e aquecido'
    ],
    cores: [
      {
        nome: 'Terracota Nobre',
        hex: '#C85A32',
        arquivos: ['1F2D5DB5-18B6-4A4A-929D-13E1FF10F59D.jpg']
      }
    ]
  },
  {
    folder: 'item 26',
    nome: 'Casaco Curto Biamar em Tricot Ponto Ajour Caramelo',
    slug: 'casaco-curto-biamar-ponto-ajour-caramelo',
    categoriaNome: 'Tricots & Malharia Nobre',
    subcategoria: 'Tricots',
    tecido: 'Tricot Biamar Exclusivo',
    modelagem: 'Casaco Curto Aberto com Trama Rendada Vazada e Etiqueta Biamar no Punho',
    linha: 'Casual Chic',
    preco: 349.90,
    preco_custo: 140.00,
    descricao: 'Casaco autêntico Biamar em malharia nobre com desenho vazado em ponto ajour e mangas volumosas com punhos canelados e tag em couro legítimo da Biamar.',
    especificacoes: [
      'Ponto ajour rendado vazado exclusivo Biamar',
      'Mangas volumosas com punho canelado longo e etiqueta Biamar',
      'Modelagem curta ideal para sobreposições com regatas e calças de cintura alta',
      'Composição: 70% Acrílico Nobre, 30% Poliamida',
      'Toque sedoso e caimento impecável'
    ],
    cores: [
      {
        nome: 'Marrom Caramelo',
        hex: '#8B5A2B',
        arquivos: ['temp_image_6ECC6E9F-C310-43CA-B3CB-18189CED67D6.heic']
      }
    ]
  }
];

// 3. Função Principal de Execução
async function run() {
  console.log('🚀 Iniciando processamento e inserção dos 25 produtos no catálogo da Leidy Boutique...');
  
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  console.log('✅ Conectado ao PostgreSQL do Supabase com sucesso.');

  // Mapear categorias existentes no banco
  const catRes = await client.query('SELECT id, nome, slug FROM categorias WHERE loja_id = $1', [LOJA_ID]);
  const catMap = {};
  catRes.rows.forEach(c => {
    catMap[c.nome.toLowerCase()] = c.id;
    catMap[c.slug.toLowerCase()] = c.id;
  });

  // Função auxiliar para resolver ou criar categoriaId
  async function getCategoryId(nome) {
    const key = nome.toLowerCase();
    if (catMap[key]) return catMap[key];
    // Fallback por aproximação
    for (const [k, id] of Object.entries(catMap)) {
      if (k.includes(key) || key.includes(k)) return id;
    }
    // Cria a categoria no banco se não existir
    const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const ins = await client.query(
      'INSERT INTO categorias (loja_id, nome, slug, display_order) VALUES ($1, $2, $3, $4) RETURNING id',
      [LOJA_ID, nome, slug, Object.keys(catMap).length + 1]
    );
    const newId = ins.rows[0].id;
    catMap[key] = newId;
    catMap[slug] = newId;
    console.log(`   📁 Nova categoria criada no banco: "${nome}" (${slug})`);
    return newId;
  }

  let totalInseridos = 0;
  let totalVariacoes = 0;
  let totalMidias = 0;

  for (const item of PRODUCTS_DATA) {
    console.log(`\n📦 Processando ${item.folder}: "${item.nome}"...`);
    const targetProductDir = path.join(publicBaseDir, item.slug);
    if (fs.existsSync(targetProductDir)) {
      // Limpar arquivos antigos para não deixar resíduos pesados (.jpg ou .mp4 antigos)
      const existingFiles = fs.readdirSync(targetProductDir);
      for (const ef of existingFiles) {
        fs.unlinkSync(path.join(targetProductDir, ef));
      }
    } else {
      fs.mkdirSync(targetProductDir, { recursive: true });
    }

    const folderSrc = path.join(sourceBaseDir, item.folder);
    const fotosPorCor = {};
    const mediaEntries = [];
    let fotoPrincipalUrl = null;

    // Processar cores e suas imagens/vídeos
    let displayOrder = 0;
    for (const cor of item.cores) {
      fotosPorCor[cor.nome] = [];
      let corIndex = 1;
      const cleanCorSlug = cor.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      for (const arq of cor.arquivos) {
        const srcFile = path.join(folderSrc, arq);
        const destFileName = `${cleanCorSlug}-${corIndex}.webp`;
        const destPath = path.join(targetProductDir, destFileName);
        const publicUrl = `/products/${item.slug}/${destFileName}`;

        // Converte diretamente para WebP 82% com downscale máximo de 1200px
        execSync(`"${ffmpegPath}" -y -i "${srcFile}" -vf "scale='min(1200,iw)':-2" -c:v libwebp -quality 82 "${destPath}"`, { stdio: 'ignore' });

        if (!fotoPrincipalUrl) fotoPrincipalUrl = publicUrl;
        fotosPorCor[cor.nome].push(publicUrl);

        mediaEntries.push({
          tipo: 'image',
          url: publicUrl,
          label: `[COR: ${cor.nome}] ${cor.nome} - Foto ${corIndex}`,
          display_order: displayOrder++
        });

        corIndex++;
      }

      // Processar vídeos da cor (se houver)
      if (cor.videos && cor.videos.length > 0) {
        let vIndex = 1;
        for (const vid of cor.videos) {
          const srcVid = path.join(folderSrc, vid);
          const destVidName = `video-${cleanCorSlug}-${vIndex}.mp4`;
          const destVidPath = path.join(targetProductDir, destVidName);
          const publicVidUrl = `/products/${item.slug}/${destVidName}`;

          console.log(`      🎬 Otimizando vídeo para web mobile (30fps / 720p): ${destVidName}...`);
          execSync(`"${ffmpegPath}" -y -i "${srcVid}" -vf "scale=-2:1280" -r 30 -c:v libx264 -crf 28 -preset fast -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${destVidPath}"`, { stdio: 'ignore' });

          mediaEntries.push({
            tipo: 'video',
            url: publicVidUrl,
            label: `Vídeo no Provador (${cor.nome})`,
            display_order: displayOrder++
          });

          vIndex++;
        }
      }
    }

    const catId = await getCategoryId(item.categoriaNome);
    const estoqueTotal = item.cores.length * 5; // 5 por cor

    // Inserir produto no banco
    const prodInsertQuery = `
      INSERT INTO produtos (
        loja_id, categoria_id, nome, slug, descricao, preco, preco_promocional,
        preco_custo, tecido, modelagem, linha, status_badges, destaque, outlet,
        mais_vendido, ultimas_pecas, estoque_total, rating, review_count, ativo,
        foto_principal, subcategoria, detalhes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      ON CONFLICT (loja_id, slug) DO UPDATE SET
        categoria_id = EXCLUDED.categoria_id,
        nome = EXCLUDED.nome,
        descricao = EXCLUDED.descricao,
        preco = EXCLUDED.preco,
        preco_promocional = EXCLUDED.preco_promocional,
        preco_custo = EXCLUDED.preco_custo,
        tecido = EXCLUDED.tecido,
        modelagem = EXCLUDED.modelagem,
        linha = EXCLUDED.linha,
        status_badges = EXCLUDED.status_badges,
        destaque = EXCLUDED.destaque,
        outlet = EXCLUDED.outlet,
        mais_vendido = EXCLUDED.mais_vendido,
        ultimas_pecas = EXCLUDED.ultimas_pecas,
        estoque_total = EXCLUDED.estoque_total,
        ativo = EXCLUDED.ativo,
        foto_principal = EXCLUDED.foto_principal,
        subcategoria = EXCLUDED.subcategoria,
        detalhes = EXCLUDED.detalhes,
        updated_at = NOW()
      RETURNING id;
    `;

    const detalhesObj = {
      especificacoes: item.especificacoes,
      fotos_por_cor: fotosPorCor,
      badges: [],
      precos_diferenciados: null
    };

    const prodValues = [
      LOJA_ID,
      catId,
      item.nome,
      item.slug,
      item.descricao,
      item.preco,
      null, // Sem desconto
      item.preco_custo,
      item.tecido,
      item.modelagem,
      item.linha,
      [], // Sem badges
      false, // destaque
      false, // outlet
      false, // mais_vendido
      false, // ultimas_pecas
      estoqueTotal,
      5.0, // rating
      0,   // reviews
      true, // ativo
      fotoPrincipalUrl,
      item.subcategoria,
      JSON.stringify(detalhesObj)
    ];

    const prodRes = await client.query(prodInsertQuery, prodValues);
    const produtoId = prodRes.rows[0].id;
    totalInseridos++;

    // Limpar variações e mídias antigas do produto para re-inserção limpa
    await client.query('DELETE FROM variacoes_produto WHERE produto_id = $1', [produtoId]);
    await client.query('DELETE FROM midias_produto WHERE produto_id = $1', [produtoId]);

    // Inserir variações de cor (5 unidades por cor)
    for (const cor of item.cores) {
      const cleanCorSlug = cor.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const sku = `${item.slug}-${cleanCorSlug}-unico`;
      const imagemCor = fotosPorCor[cor.nome] ? fotosPorCor[cor.nome][0] : fotoPrincipalUrl;

      await client.query(`
        INSERT INTO variacoes_produto (
          loja_id, produto_id, cor_nome, cor_hex, tamanho, estoque, sku, imagem_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [LOJA_ID, produtoId, cor.nome, cor.hex, 'Tamanho Único', 5, sku, imagemCor]);
      totalVariacoes++;
    }

    // Inserir mídias no banco
    for (const m of mediaEntries) {
      await client.query(`
        INSERT INTO midias_produto (
          loja_id, produto_id, tipo, url, label, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [LOJA_ID, produtoId, m.tipo, m.url, m.label, m.display_order]);
      totalMidias++;
    }

    console.log(`   ✨ Inserido ID ${produtoId} | Cores: ${item.cores.length} | Mídias: ${mediaEntries.length}`);
  }

  await client.end();

  console.log('\n======================================================');
  console.log(`🎉 OPERAÇÃO FINALIZADA COM SUCESSO!`);
  console.log(`   - Produtos cadastrados no banco: ${totalInseridos}`);
  console.log(`   - Variações de cor cadastradas: ${totalVariacoes} (todas com 5 itens de estoque)`);
  console.log(`   - Mídias vinculadas (fotos e vídeos): ${totalMidias}`);
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('❌ Erro na importação:', err);
  process.exit(1);
});
