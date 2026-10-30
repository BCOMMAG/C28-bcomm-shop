/**
 * Script de Sincronização Pré-Build de Tenants
 * Garante que DEFAULT_LEIDY_TENANT em src/lib/tenant.ts sempre reflita
 * com 100% de paridade o banco de dados Supabase antes de qualquer exportação estática (npm run build).
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function syncTenantDefaults() {
  console.log('🔄 [Prebuild] Sincronizando configurações visuais da boutique com o Supabase...');

  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️ [Prebuild] Arquivo .env.local não encontrado. Mantendo fallbacks atuais.');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);

  if (!urlMatch || !keyMatch) {
    console.warn('⚠️ [Prebuild] Credenciais Supabase ausentes no .env.local. Mantendo fallbacks atuais.');
    return;
  }

  try {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());
    const { data: dbLoja, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('slug', 'leidy-boutique')
      .single();

    if (error || !dbLoja) {
      console.warn('⚠️ [Prebuild] Falha ao consultar loja no Supabase:', error?.message || 'Não encontrada');
      return;
    }

    const tenantTsPath = path.join(__dirname, '..', 'src', 'lib', 'tenant.ts');
    let tenantContent = fs.readFileSync(tenantTsPath, 'utf8');

    // Substitui com precisão o bloco de DEFAULT_LEIDY_TENANT
    const replacement = `// Configuração padrão da Leidy Boutique (Tenant #1 Oficial)
export const DEFAULT_LEIDY_TENANT: Loja = ${JSON.stringify(dbLoja, null, 2)};`;

    const regex = /\/\/ Configuração padrão da Leidy Boutique \(Tenant #1 Oficial\)[\s\S]*?export const DEFAULT_LEIDY_TENANT: Loja = [\s\S]*?\n\};/;

    if (regex.test(tenantContent)) {
      tenantContent = tenantContent.replace(regex, replacement);
      fs.writeFileSync(tenantTsPath, tenantContent, 'utf8');
      console.log('✅ [Prebuild] DEFAULT_LEIDY_TENANT sincronizado com sucesso a partir do banco de dados!');
      console.log(`   - Logo URL: ${dbLoja.configuracoes_visuais?.logo_url}`);
      console.log(`   - Cor Primária: ${dbLoja.configuracoes_visuais?.cor_primaria}`);
      console.log(`   - Barra Aviso (text_light): ${dbLoja.configuracoes_visuais?.barra_aviso_estilo?.text_light}`);
      console.log(`   - Barra Aviso (ícone): ${dbLoja.configuracoes_visuais?.barra_aviso_estilo?.icone}`);
    } else {
      console.warn('⚠️ [Prebuild] Padrão regex para DEFAULT_LEIDY_TENANT não correspondido.');
    }
  } catch (err) {
    console.warn('⚠️ [Prebuild] Erro durante a sincronização pré-build:', err.message);
  }
}

syncTenantDefaults();

