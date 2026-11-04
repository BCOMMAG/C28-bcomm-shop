const fs = require('fs');
const { Client } = require('pg');

const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
});

const client = new Client({ connectionString: env.DATABASE_URL });

async function run() {
  await client.connect();
  console.log('✅ Conectado ao PostgreSQL do Supabase.');

  const lojaId = 'e8b7f890-4e3a-4a89-9c56-8e1234567890';

  // 1. Inspecionar produtos ativos antes da atualização
  const prodsBefore = await client.query(
    'SELECT id, nome, status_badges, outlet, destaque, mais_vendido FROM produtos WHERE loja_id = $1 AND ativo = true',
    [lojaId]
  );
  console.log(`Encontrados ${prodsBefore.rows.length} produtos ativos.`);
  prodsBefore.rows.forEach(p => {
    console.log(` - ${p.nome}: status_badges = ${JSON.stringify(p.status_badges)}, outlet=${p.outlet}`);
  });

  // 2. Limpar status_badges residuais legados
  // Se o produto não for outlet e não for mais vendido nem destaque, limpa o array
  const cleanRes = await client.query(
    `UPDATE produtos 
     SET status_badges = ARRAY[]::TEXT[] 
     WHERE loja_id = $1 AND ativo = true`,
    [lojaId]
  );
  console.log(`✅ Atualizados ${cleanRes.rowCount} produtos. status_badges limpo de resíduos legados.`);

  // 3. Atualizar configuracoes_visuais na tabela lojas para reativar seções e incluir todasAsPecas
  const lojaRes = await client.query('SELECT configuracoes_visuais FROM lojas WHERE id = $1', [lojaId]);
  const currentVis = lojaRes.rows[0]?.configuracoes_visuais || {};
  const currentSecoes = currentVis.secoes_vitrine || {};

  const updatedSecoes = {
    ...currentSecoes,
    modoIndependente: false,
    global: {
      ativo: true,
      tituloFont: currentSecoes.global?.tituloFont || 'Playfair Display',
      tituloCorLight: currentSecoes.global?.tituloCorLight || '#FFFFFF',
      tituloCorDark: currentSecoes.global?.tituloCorDark || '#FFFFFF',
      subtituloCorLight: currentSecoes.global?.subtituloCorLight || '#FAF8F5',
      subtituloCorDark: currentSecoes.global?.subtituloCorDark || '#FAF8F5'
    },
    lancamentos: {
      ativo: true,
      tituloFont: currentSecoes.lancamentos?.tituloFont || 'Playfair Display',
      tituloCorLight: currentSecoes.lancamentos?.tituloCorLight || '#FFFFFF',
      tituloCorDark: currentSecoes.lancamentos?.tituloCorDark || '#FFFFFF',
      subtituloCorLight: currentSecoes.lancamentos?.subtituloCorLight || '#FAF8F5',
      subtituloCorDark: currentSecoes.lancamentos?.subtituloCorDark || '#FAF8F5'
    },
    maisVendidos: {
      ativo: true,
      tituloFont: currentSecoes.maisVendidos?.tituloFont || 'Playfair Display',
      tituloCorLight: currentSecoes.maisVendidos?.tituloCorLight || '#FFFFFF',
      tituloCorDark: currentSecoes.maisVendidos?.tituloCorDark || '#FFFFFF',
      subtituloCorLight: currentSecoes.maisVendidos?.subtituloCorLight || '#FAF8F5',
      subtituloCorDark: currentSecoes.maisVendidos?.subtituloCorDark || '#FAF8F5'
    },
    outlet: {
      ativo: true,
      tituloFont: currentSecoes.outlet?.tituloFont || 'Playfair Display',
      tituloCorLight: currentSecoes.outlet?.tituloCorLight || '#FFFFFF',
      tituloCorDark: currentSecoes.outlet?.tituloCorDark || '#FFFFFF',
      subtituloCorLight: currentSecoes.outlet?.subtituloCorLight || '#FAF8F5',
      subtituloCorDark: currentSecoes.outlet?.subtituloCorDark || '#FAF8F5'
    },
    ultimasPecas: {
      ativo: true,
      tituloFont: currentSecoes.ultimasPecas?.tituloFont || 'Playfair Display',
      tituloCorLight: currentSecoes.ultimasPecas?.tituloCorLight || '#FFFFFF',
      tituloCorDark: currentSecoes.ultimasPecas?.tituloCorDark || '#FFFFFF',
      subtituloCorLight: currentSecoes.ultimasPecas?.subtituloCorLight || '#FAF8F5',
      subtituloCorDark: currentSecoes.ultimasPecas?.subtituloCorDark || '#FAF8F5'
    },
    todasAsPecas: {
      ativo: true,
      titulo: 'Todas as Peças',
      subtitulo: 'Conheça todas as criações e modelos exclusivos disponíveis na boutique.',
      tituloFont: 'Playfair Display',
      tituloCorLight: '#FFFFFF',
      tituloCorDark: '#FFFFFF',
      subtituloCorLight: '#FAF8F5',
      subtituloCorDark: '#FAF8F5'
    }
  };

  currentVis.secoes_vitrine = updatedSecoes;

  await client.query(
    'UPDATE lojas SET configuracoes_visuais = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(currentVis), lojaId]
  );
  console.log('✅ configuracoes_visuais.secoes_vitrine atualizado com sucesso no Supabase!');

  await client.end();
}

run().catch(err => {
  console.error('❌ Erro no script:', err);
  process.exit(1);
});

