import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase';
import type {
  CreateTextRecordInput,
  TextRecord,
  TextRecordRow,
  TextRecordSide,
  UpdateTextRecordInput,
} from '../types';

export function formatCurrentRecordHour(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:00`;
}

export async function fetchTextRecords(): Promise<TextRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('text_records')
    .select('*')
    .order('side', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`文字记录加载失败：${error.message}`);
  }

  return (data ?? []).map(textRecordRowToRecord);
}

export async function getNextTextRecordSortOrder(side: TextRecordSide): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('text_records')
    .select('sort_order')
    .eq('side', side)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`记录排序号获取失败：${error.message}`);
  }

  return (data?.sort_order ?? 0) + 1;
}

export async function createTextRecord(input: CreateTextRecordInput): Promise<TextRecord> {
  const client = requireSupabase();
  const content = input.content.trim();

  if (!content) {
    throw new Error('请先写下一条记录。');
  }

  const { data, error } = await client
    .from('text_records')
    .insert({
      side: input.side,
      content,
      occurred_at: input.occurredAt,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`文字记录保存失败：${error.message}`);
  }

  return textRecordRowToRecord(data);
}

export async function updateTextRecord(input: UpdateTextRecordInput): Promise<TextRecord> {
  const client = requireSupabase();
  const content = input.content.trim();

  if (!content) {
    throw new Error('请先写下这一条记录。');
  }

  const { data, error } = await client
    .from('text_records')
    .update({
      content,
      occurred_at: input.occurredAt,
    })
    .eq('id', input.id)
    .select('*')
    .single();

  if (error) {
    throw new Error(`文字记录更新失败：${error.message}`);
  }

  return textRecordRowToRecord(data);
}

function textRecordRowToRecord(row: TextRecordRow): TextRecord {
  return {
    id: row.id,
    side: row.side,
    content: row.content,
    occurredAt: row.occurred_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
