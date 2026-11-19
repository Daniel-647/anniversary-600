import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase';
import type {
  CreateCouponInput,
  MakeupCoupon,
  MakeupCouponRow,
  TextRecordSide,
  UseCouponInput,
} from '../types';

export async function fetchCoupons(): Promise<MakeupCoupon[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('makeup_coupons')
    .select('*')
    .order('side', { ascending: true })
    .order('status', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`和好券加载失败：${error.message}`);
  }

  return (data ?? []).map(couponRowToModel);
}

export async function getNextCouponSortOrder(side: TextRecordSide): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('makeup_coupons')
    .select('sort_order')
    .eq('side', side)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`和好券排序号获取失败：${error.message}`);
  }

  return (data?.sort_order ?? 0) + 1;
}

export async function createCoupon(input: CreateCouponInput): Promise<MakeupCoupon> {
  const client = requireSupabase();
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    throw new Error('请先写下和好券的名称。');
  }

  const { data, error } = await client
    .from('makeup_coupons')
    .insert({
      side: input.side,
      title,
      description,
      status: 'available',
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`和好券添加失败：${error.message}`);
  }

  return couponRowToModel(data);
}

export async function useCoupon(input: UseCouponInput): Promise<MakeupCoupon> {
  const client = requireSupabase();
  const usedNote = input.usedNote?.trim() || null;

  const { data, error } = await client
    .from('makeup_coupons')
    .update({
      status: 'used',
      used_at: input.usedAt,
      used_note: usedNote,
    })
    .eq('id', input.id)
    .eq('status', 'available')
    .select('*')
    .single();

  if (error) {
    throw new Error(`和好券核销失败：${error.message}`);
  }

  return couponRowToModel(data);
}

function couponRowToModel(row: MakeupCouponRow): MakeupCoupon {
  return {
    id: row.id,
    side: row.side,
    title: row.title,
    description: row.description ?? '',
    status: row.status,
    usedAt: row.used_at,
    usedNote: row.used_note,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
