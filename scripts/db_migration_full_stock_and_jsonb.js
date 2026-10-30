const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.nrcffzptymcfhsdnjepw:bcomm-saas-2026@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'
  });

  try {
    console.log('🔄 Conectando ao PostgreSQL do Supabase...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // 1. Migração de produtos.detalhes para JSONB
    console.log('📦 1. Migrando produtos.detalhes para JSONB...');
    await client.query(`
      ALTER TABLE produtos ALTER COLUMN detalhes DROP DEFAULT;
      ALTER TABLE produtos 
        ALTER COLUMN detalhes TYPE JSONB 
        USING CASE 
          WHEN detalhes IS NULL THEN '[]'::jsonb
          ELSE to_jsonb(detalhes)
        END;
      ALTER TABLE produtos ALTER COLUMN detalhes SET DEFAULT '[]'::jsonb;
    `);
    console.log('✅ produtos.detalhes migrado para JSONB com sucesso!');

    // 2. Adicionando preco e preco_promocional em variacoes_produto
    console.log('📦 2. Adicionando colunas de preços em variacoes_produto...');
    await client.query(`
      ALTER TABLE variacoes_produto ADD COLUMN IF NOT EXISTS preco NUMERIC(10,2);
      ALTER TABLE variacoes_produto ADD COLUMN IF NOT EXISTS preco_promocional NUMERIC(10,2);
    `);
    console.log('✅ Colunas preco e preco_promocional adicionadas em variacoes_produto!');

    // 3. Criando a função e a trigger SQL para sincronização perpétua de estoque
    console.log('📦 3. Criando trigger sync_produto_estoque_total()...');
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_produto_estoque_total() 
      RETURNS TRIGGER AS $$
      BEGIN
        -- Se houve alteração de produto_id na variação, atualiza o produto antigo
        IF (TG_OP = 'UPDATE' AND OLD.produto_id IS DISTINCT FROM NEW.produto_id) THEN
          UPDATE produtos 
          SET estoque_total = COALESCE((SELECT SUM(estoque) FROM variacoes_produto WHERE produto_id = OLD.produto_id), 0),
              updated_at = NOW()
          WHERE id = OLD.produto_id;
        END IF;

        -- Atualiza o produto associado à variação
        UPDATE produtos 
        SET estoque_total = COALESCE((
          SELECT SUM(estoque) 
          FROM variacoes_produto 
          WHERE produto_id = COALESCE(NEW.produto_id, OLD.produto_id)
        ), 0),
        updated_at = NOW()
        WHERE id = COALESCE(NEW.produto_id, OLD.produto_id);
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_sync_estoque_total ON variacoes_produto;
      CREATE TRIGGER trg_sync_estoque_total
      AFTER INSERT OR UPDATE OR DELETE ON variacoes_produto
      FOR EACH ROW EXECUTE FUNCTION sync_produto_estoque_total();
    `);
    console.log('✅ Trigger e função SQL trg_sync_estoque_total instaladas com sucesso!');

    // 4. Reconciliação retroativa imediata dos 8 produtos com estoque divergente
    console.log('📦 4. Executando reconciliação retroativa do estoque das peças existentes...');
    const reconcileRes = await client.query(`
      UPDATE produtos p
      SET estoque_total = COALESCE((
        SELECT SUM(v.estoque)
        FROM variacoes_produto v
        WHERE v.produto_id = p.id
      ), 0)
      WHERE EXISTS (SELECT 1 FROM variacoes_produto v WHERE v.produto_id = p.id);
    `);
    console.log(`✅ Reconciliação executada! ${reconcileRes.rowCount} produtos auditados e sincronizados.`);

    // 5. Recarregando schema cache do PostgREST
    console.log('📦 5. Recarregando cache do PostgREST...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✅ Cache do PostgREST recarregado com sucesso!');

    // 6. Verificação final
    const checkRes = await client.query(`
      SELECT p.id, p.nome, p.estoque_total, sum(v.estoque) as v_estoque
      FROM produtos p
      JOIN variacoes_produto v ON v.produto_id = p.id
      WHERE p.slug = '16-sobretudo-la-premium-copia-2289'
      GROUP BY p.id, p.nome, p.estoque_total;
    `);
    console.log('🔍 Status da peça alvo (Sobretudo Cópia):', checkRes.rows[0]);

  } catch (err) {
    console.error('❌ Erro na execução da migração:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🏁 Conexão finalizada.');
  }
}

runMigration();
