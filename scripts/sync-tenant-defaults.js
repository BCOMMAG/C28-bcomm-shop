/**
 * Script de Sincronização Pré-Build de Tenants e Banners da Vitrine
 * Garante que DEFAULT_LEIDY_TENANT e DEFAULT_LEIDY_BANNERS em src/lib/tenant.ts
 * sempre reflitam com 100% de paridade o banco de dados Supabase antes de qualquer exportação estática (npm run build).
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function syncTenantDefaults() {
  console.log('🔄 [Prebuild] Sincronizando configurações visuais e banners da boutique com o Supabase...');

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

    // 1. Sincroniza Loja
    const { data: dbLoja, error: lojaErr } = await supabase
      .from('lojas')
      .select('*')
      .eq('slug', 'leidy-boutique')
      .single();

    if (lojaErr || !dbLoja) {
      console.warn('⚠️ [Prebuild] Falha ao consultar loja no Supabase:', lojaErr?.message || 'Não encontrada');
      return;
    }

    // 2. Sincroniza Hero Banners
    const { data: dbBanners, error: bannersErr } = await supabase
      .from('hero_banners')
      .select('*')
      .eq('loja_id', dbLoja.id)
      .order('display_order', { ascending: true });

    if (bannersErr) {
      console.warn('⚠️ [Prebuild] Falha ao consultar hero_banners no Supabase:', bannersErr.message);
    }

    const mappedBanners = (dbBanners || []).map((b) => ({
      id: b.id,
      titulo: b.titulo,
      subtitulo: b.subtitulo,
      cta_texto: b.cta_texto,
      cta_link: b.cta_link,
      tipo_midia: b.tipo_midia || 'video',
      desktop_media_url: b.desktop_media_url,
      mobile_media_url: b.mobile_media_url,
      display_order: Number(b.display_order ?? 0),
      ativo: Boolean(b.ativo)
    }));

    const tenantTsPath = path.join(__dirname, '..', 'src', 'lib', 'tenant.ts');
    let tenantContent = fs.readFileSync(tenantTsPath, 'utf8');

    // Substitui com precisão o bloco de DEFAULT_LEIDY_TENANT
    const tenantReplacement = `export const DEFAULT_LEIDY_TENANT: Loja = ${JSON.stringify(dbLoja, null, 2)};`;
    const tenantRegex = /export const DEFAULT_LEIDY_TENANT: Loja = [\s\S]*?\n\};/;

    if (tenantRegex.test(tenantContent)) {
      tenantContent = tenantContent.replace(tenantRegex, tenantReplacement);
      console.log('✅ [Prebuild] DEFAULT_LEIDY_TENANT sincronizado com sucesso!');
    } else {
      console.warn('⚠️ [Prebuild] Padrão regex para DEFAULT_LEIDY_TENANT não correspondido.');
    }

    // Substitui com precisão o bloco de DEFAULT_LEIDY_BANNERS
    const bannersReplacement = `export const DEFAULT_LEIDY_BANNERS: AdminHeroBanner[] = ${JSON.stringify(mappedBanners, null, 2)};`;
    const bannersRegex = /export const DEFAULT_LEIDY_BANNERS: AdminHeroBanner\[\] = [\s\S]*?\n\];/;

    if (bannersRegex.test(tenantContent)) {
      tenantContent = tenantContent.replace(bannersRegex, bannersReplacement);
      console.log(`✅ [Prebuild] DEFAULT_LEIDY_BANNERS sincronizado com sucesso (${mappedBanners.length} banners)!`);
      const activeCount = mappedBanners.filter((b) => b.ativo).length;
      console.log(`   - Banners Ativos: ${activeCount}`);
      console.log(`   - Banners Pausados: ${mappedBanners.length - activeCount}`);
    } else {
      console.warn('⚠️ [Prebuild] Padrão regex para DEFAULT_LEIDY_BANNERS não correspondido.');
    }

    fs.writeFileSync(tenantTsPath, tenantContent, 'utf8');
  } catch (err) {
    console.warn('⚠️ [Prebuild] Erro durante a sincronização pré-build:', err.message);
  }
}

syncTenantDefaults();
