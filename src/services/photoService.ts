import { requireSupabase, supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  CreatePhotoRecordInput,
  DisplayType,
  LocalPhoto,
  RemotePhotoRow,
  UploadPhotoResult,
} from '../types';

const BUCKET_NAME = 'love-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const chapterDefaults: Record<string, Pick<LocalPhoto, 'displayType' | 'animation' | 'mood' | 'colorTone'>> = {
  'growing-clear': { displayType: 'card', animation: 'blur-fade-in', mood: 'intense', colorTone: 'dark' },
  nanjing: { displayType: 'gallery', animation: 'parallax-reveal', mood: 'warm', colorTone: 'gold' },
  announcement: { displayType: 'hero', animation: 'cinematic-zoom', mood: 'soft', colorTone: 'pink' },
  'good-times-1': { displayType: 'card', animation: 'float-in', mood: 'warm', colorTone: 'gold' },
  'good-times-2': { displayType: 'floating', animation: 'float-in', mood: 'soft', colorTone: 'gold' },
  now: { displayType: 'hero', animation: 'cinematic-zoom', mood: 'nostalgic', colorTone: 'gold' },
};

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export function validatePhotoFile(file: File): void {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('只支持 JPG、PNG 或 WebP 图片。');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('单张图片请控制在 5MB 以内。');
  }
}

export async function fetchAllRemotePhotos(): Promise<LocalPhoto[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('chapter_id', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`远程照片加载失败：${error.message}`);
  }

  return (data ?? []).map(remoteRowToLocalPhoto);
}

export async function fetchPhotosByChapter(chapterId: string): Promise<LocalPhoto[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`这一章的照片加载失败：${error.message}`);
  }

  return (data ?? []).map(remoteRowToLocalPhoto);
}

export async function getNextSortOrder(chapterId: string): Promise<number> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('photos')
    .select('sort_order')
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`排序号获取失败：${error.message}`);
  }

  return (data?.sort_order ?? 0) + 1;
}

export async function uploadPhoto(file: File, chapterId: string): Promise<UploadPhotoResult> {
  validatePhotoFile(file);

  const client = requireSupabase();
  const ext = extensionFor(file);
  const randomPart = crypto.randomUUID().slice(0, 8);
  const storagePath = `${chapterId}/${Date.now()}-${randomPart}.${ext}`;

  const { error } = await client.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`图片上传失败：${error.message}`);
  }

  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

  return {
    imageUrl: data.publicUrl,
    storagePath,
  };
}

export async function createPhotoRecord(photoData: CreatePhotoRecordInput): Promise<LocalPhoto> {
  const client = requireSupabase();
  const defaults = chapterDefaults[photoData.chapterId] ?? chapterDefaults['good-times-1'];

  const { data, error } = await client
    .from('photos')
    .insert({
      chapter_id: photoData.chapterId,
      title: photoData.title || null,
      caption: photoData.caption || null,
      date: photoData.date || null,
      location: photoData.location || null,
      image_url: photoData.imageUrl,
      storage_path: photoData.storagePath,
      sort_order: photoData.sortOrder,
      display_type: photoData.displayType ?? defaults.displayType,
      animation: photoData.animation ?? defaults.animation,
      mood: photoData.mood ?? defaults.mood,
      color_tone: photoData.colorTone ?? defaults.colorTone,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`照片信息保存失败：${error.message}`);
  }

  return remoteRowToLocalPhoto(data);
}

export function mergeJsonPhotosWithRemotePhotos(localPhotos: LocalPhoto[], remotePhotos: LocalPhoto[]): LocalPhoto[] {
  const seen = new Set<string>();
  const merged: LocalPhoto[] = [];

  for (const photo of [...localPhotos, ...remotePhotos]) {
    const key = photo.remote ? `remote:${photo.id}` : `local:${photo.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(photo);
  }

  return merged.sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter.localeCompare(b.chapter);
    if (!a.remote && b.remote) return -1;
    if (a.remote && !b.remote) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function remoteRowToLocalPhoto(row: RemotePhotoRow): LocalPhoto {
  const defaults = chapterDefaults[row.chapter_id] ?? chapterDefaults['good-times-1'];

  return {
    id: row.id,
    src: row.image_url,
    chapter: row.chapter_id,
    title: row.title ?? '',
    caption: row.caption ?? '',
    date: row.date ?? '',
    location: row.location ?? '',
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
    displayType: (row.display_type as DisplayType | null) ?? defaults.displayType,
    animation: row.animation ?? defaults.animation,
    mood: row.mood ?? defaults.mood,
    colorTone: row.color_tone ?? defaults.colorTone,
    blurReveal: true,
    parallax: ['growing-clear', 'nanjing', 'good-times-2'].includes(row.chapter_id),
    remote: true,
    createdAt: row.created_at,
  };
}
