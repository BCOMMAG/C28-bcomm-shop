import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DEFAULT_TENANT_ID } from '@/lib/products';

export interface CouponItem {
  id: string;
  loja_id: string;
  codigo: string;
  tipo_desconto: 'porcentagem' | 'fixo';
  valor_desconto: number;
  valor_minimo: number;
  limite_usos: number;
  usos_atuais: number;
  ativo: boolean;
  created_at?: string;
}

export interface CreateCouponInput {
  codigo: string;
  tipo_desconto: 'porcentagem' | 'fixo';
  valor_desconto: number;
  valor_minimo?: number;
  limite_usos?: number;
  ativo?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: CouponItem;
  discountAmount: number;
  discountPercentage?: number;
  error?: string;
}

export const DEFAULT_DEMO_COUPONS: CouponItem[] = [
  {
    id: 'demo-cupom-1',
    loja_id: DEFAULT_TENANT_ID,
    codigo: 'BEMVINDA10',
    tipo_desconto: 'porcentagem',
    valor_desconto: 10,
    valor_minimo: 0,
    limite_usos: 500,
    usos_atuais: 42,
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-cupom-2',
    loja_id: DEFAULT_TENANT_ID,
    codigo: 'VIP15',
    tipo_desconto: 'porcentagem',
    valor_desconto: 15,
    valor_minimo: 350,
    limite_usos: 200,
    usos_atuais: 89,
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'demo-cupom-3',
    loja_id: DEFAULT_TENANT_ID,
    codigo: 'LEIDY50',
    tipo_desconto: 'fixo',
    valor_desconto: 50,
    valor_minimo: 400,
    limite_usos: 100,
    usos_atuais: 15,
    ativo: true,
    created_at: new Date().toISOString()
  }
];

/**
 * Consulta a lista completa de cupons cadastrados na loja.
 */
export async function getAdminCoupons(
  lojaId: string = DEFAULT_TENANT_ID
): Promise<CouponItem[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ [Supabase] Erro ao buscar cupons, usando lista padrão:', error.message);
      return DEFAULT_DEMO_COUPONS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_DEMO_COUPONS;
    }

    return data.map((c: any) => ({
      id: c.id,
      loja_id: c.loja_id,
      codigo: (c.codigo || '').toUpperCase(),
      tipo_desconto: c.tipo_desconto || 'porcentagem',
      valor_desconto: Number(c.valor_desconto || 0),
      valor_minimo: Number(c.valor_minimo || 0),
      limite_usos: Number(c.limite_usos || 1000),
      usos_atuais: Number(c.usos_atuais || 0),
      ativo: Boolean(c.ativo),
      created_at: c.created_at
    }));
  } catch (err: any) {
    console.warn('⚠️ [Supabase] Falha ao carregar cupons:', err?.message);
    return DEFAULT_DEMO_COUPONS;
  }
}

/**
 * Cadastra um novo cupom no banco de dados.
 */
export async function createAdminCoupon(
  input: CreateCouponInput,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<{ success: boolean; coupon?: CouponItem; error?: string }> {
  try {
    const cleanCode = input.codigo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      return { success: false, error: 'O código do cupom deve ter pelo menos 3 caracteres.' };
    }

    if (Number(input.valor_desconto) <= 0) {
      return { success: false, error: 'O valor de desconto deve ser maior que zero.' };
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('cupons')
      .insert({
        loja_id: lojaId,
        codigo: cleanCode,
        tipo_desconto: input.tipo_desconto,
        valor_desconto: Number(input.valor_desconto),
        valor_minimo: Number(input.valor_minimo || 0),
        limite_usos: Number(input.limite_usos || 1000),
        usos_atuais: 0,
        ativo: input.ativo !== undefined ? input.ativo : true
      })
      .select('*')
      .single();

    if (error) {
      console.error('❌ [Supabase] Erro ao cadastrar cupom:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, coupon: data };
  } catch (err: any) {
    console.error('❌ [Supabase] Falha ao criar cupom:', err);
    return { success: false, error: err?.message || 'Falha ao cadastrar cupom.' };
  }
}

/**
 * Ativa ou pausa um cupom na loja.
 */
export async function toggleAdminCouponActive(
  couponId: string,
  novoStatus: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('cupons')
      .update({ ativo: novoStatus })
      .eq('id', couponId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao alterar status do cupom:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Exclui um cupom do banco de dados.
 */
export async function deleteAdminCoupon(
  couponId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('cupons').delete().eq('id', couponId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Supabase] Erro ao excluir cupom:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Validação em tempo real de cupom para o Checkout.
 * Verifica existência, loja, ativação, valor mínimo e limite de utilização.
 */
export async function validateCouponInDatabase(
  code: string,
  subtotal: number,
  lojaId: string = DEFAULT_TENANT_ID
): Promise<CouponValidationResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, discountAmount: 0, error: 'Informe um código de cupom.' };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('loja_id', lojaId)
      .ilike('codigo', cleanCode)
      .maybeSingle();

    let couponRecord: CouponItem | undefined = data;

    // Se não encontrou no banco, faz fallback para cupons promocionais oficiais da loja
    if (!couponRecord) {
      couponRecord = DEFAULT_DEMO_COUPONS.find(
        (c) => c.codigo.toUpperCase() === cleanCode
      );
    }

    if (!couponRecord) {
      return { valid: false, discountAmount: 0, error: 'Cupom inválido ou expirado.' };
    }

    if (!couponRecord.ativo) {
      return { valid: false, discountAmount: 0, error: 'Este cupom não está mais ativo.' };
    }

    if (couponRecord.limite_usos > 0 && couponRecord.usos_atuais >= couponRecord.limite_usos) {
      return { valid: false, discountAmount: 0, error: 'Este cupom atingiu o limite de utilizações.' };
    }

    if (couponRecord.valor_minimo > 0 && subtotal < couponRecord.valor_minimo) {
      const minFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(couponRecord.valor_minimo);
      return {
        valid: false,
        discountAmount: 0,
        error: `O valor mínimo em produtos para este cupom é de ${minFormatted}.`
      };
    }

    // Calcula o desconto real
    let discountAmount = 0;
    let discountPercentage: number | undefined = undefined;

    if (couponRecord.tipo_desconto === 'porcentagem') {
      discountPercentage = couponRecord.valor_desconto;
      discountAmount = (subtotal * discountPercentage) / 100;
    } else {
      discountAmount = Math.min(subtotal, couponRecord.valor_desconto);
    }

    return {
      valid: true,
      coupon: couponRecord,
      discountAmount: Number(discountAmount.toFixed(2)),
      discountPercentage
    };
  } catch (err: any) {
    console.warn('⚠️ [Supabase] Erro ao validar cupom, usando fallback:', err);
    return { valid: false, discountAmount: 0, error: 'Falha ao validar cupom no momento.' };
  }
}
