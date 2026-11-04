const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const client = new Client({
  connectionString: 'postgresql://postgres:Set%40provisorio26@db.mpexpfuvqwstrjctjrbv.supabase.co:5432/postgres'
});

const sb = createClient(
  'https://mpexpfuvqwstrjctjrbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhwZnV2cXdzdHJqY3RqcmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTI4MjMsImV4cCI6MjEwNzU2ODgyM30.ru147EyJ4T06N5mED6cEqfixlVR0QwTWX9hGyXuPgDQ'
);

async function main() {
  await client.connect();
  await client.query("DELETE FROM auth.identities WHERE email IN ('admin@leidyboutique.com.br', 'admin2@leidyboutique.com.br');");
  await client.query("DELETE FROM auth.users WHERE email IN ('admin@leidyboutique.com.br', 'admin2@leidyboutique.com.br');");
  console.log('🧹 Usuários antigos limpos.');

  // 1. SignUp
  const { data: signUpData, error: signErr } = await sb.auth.signUp({
    email: 'admin@leidyboutique.com.br',
    password: 'Leidy@2026!'
  });
  if (signErr) throw signErr;
  console.log('📝 Cadastro oficial efetuado:', signUpData.user.id);

  // 2. Confirmação instantânea do e-mail no banco
  await client.query("UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'admin@leidyboutique.com.br';");
  console.log('✉️ E-mail oficial confirmado com sucesso.');

  // 3. Teste de login real
  const { data: loginData, error: loginErr } = await sb.auth.signInWithPassword({
    email: 'admin@leidyboutique.com.br',
    password: 'Leidy@2026!'
  });
  if (loginErr) throw loginErr;
  console.log('🎉 LOGIN OFICIAL DO ADMINISTRADOR REALIZADO COM SUCESSO!');
  console.log('   - User ID:', loginData.user.id);
  console.log('   - Role:', loginData.user.role);
  console.log('   - Access Token JWT gerado e ativo:', !!loginData.session.access_token);

  await client.end();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
