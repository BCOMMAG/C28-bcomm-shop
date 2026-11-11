const { Client } = require('../node_modules/pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('🔗 Conectado ao PostgreSQL para sincronizar equipe.');

  // Busca todos os colaboradores da Leidy Boutique
  const res = await client.query(`
    SELECT id, loja_id, nome, email, cargo, senha_acesso, auth_user_id
    FROM public.equipe_loja
    WHERE loja_id = 'e8b7f890-4e3a-4a89-9c56-8e1234567890'
    ORDER BY created_at ASC;
  `);

  console.log('Colaboradores encontrados:', res.rows.length);

  for (const colab of res.rows) {
    console.log(`\nProcessando ${colab.nome} (${colab.email}) - Cargo: ${colab.cargo}`);

    // Se for o dono (Leidi Mara), a senha master de login já está em auth.users
    let defaultPwd = colab.senha_acesso;
    if (!defaultPwd) {
      if (colab.cargo === 'gerente') defaultPwd = 'Mariana@2026!';
      else if (colab.cargo === 'atendente') defaultPwd = 'Carla@2026!';
      else if (colab.cargo === 'estoquista') defaultPwd = 'Roberto@2026!';
      else defaultPwd = 'Leidy@2026!';
    }

    // Chama a RPC admin_alterar_senha_colaborador com o operador Master
    const rpcRes = await client.query(`
      SELECT public.admin_alterar_senha_colaborador(
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::text
      ) as result;
    `, [colab.loja_id, colab.id, defaultPwd, 'superadmin@bcomm.com.br']);

    console.log('Resultado RPC:', rpcRes.rows[0].result);
  }

  // Verifica o estado final da tabela equipe_loja
  const check = await client.query(`
    SELECT id, nome, email, cargo, senha_acesso, token_version, auth_user_id
    FROM public.equipe_loja
    WHERE loja_id = 'e8b7f890-4e3a-4a89-9c56-8e1234567890';
  `);
  console.log('\n--- ESTADO FINAL DA EQUIPE ---');
  console.table(check.rows);

  await client.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

