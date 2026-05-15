export type ChapterId =
  | 'uncertain-beginning'
  | 'growing-clear'
  | 'nanjing'
  | 'announcement'
  | 'good-times-1'
  | 'unexpected-challenge'
  | 'good-times-2'
  | 'now';

export type DisplayType = 'hero' | 'card' | 'background' | 'floating' | 'gallery';

export interface LocalPhoto {
  id: string;
  src: string;
  chapter: string;
  title?: string;
  caption?: string;
  date?: string;
  location?: string;
  mood?: string;
  colorTone?: string;
  importance?: string;
  displayType?: DisplayType;
  animation?: string;
  blurReveal?: boolean;
  parallax?: boolean;
  sortOrder?: number;
  remote?: boolean;
  storagePath?: string;
  createdAt?: string;
}

export interface RemotePhotoRow {
  id: string;
  chapter_id: string;
  title: string | null;
  caption: string | null;
  date: string | null;
  location: string | null;
  image_url: string;
  storage_path: string;
  sort_order: number;
  display_type: string | null;
  animation: string | null;
  mood: string | null;
  color_tone: string | null;
  created_at: string;
}

export interface CreatePhotoRecordInput {
  chapterId: string;
  title?: string;
  caption?: string;
  date?: string;
  location?: string;
  imageUrl: string;
  storagePath: string;
  sortOrder: number;
  displayType?: DisplayType;
  animation?: string;
  mood?: string;
  colorTone?: string;
}

export interface UpdatePhotoRecordInput {
  id: string;
  title?: string;
  caption?: string;
  date?: string;
  location?: string;
  imageUrl?: string;
  storagePath?: string;
}

export interface UploadPhotoResult {
  imageUrl: string;
  storagePath: string;
}

export interface UploadModalPayload {
  file: File;
  title: string;
  caption: string;
  date: string;
  location: string;
}

export interface PhotoEditPayload {
  file?: File | null;
  title: string;
  caption: string;
  date: string;
  location: string;
}

export type TextRecordSide = 'left' | 'right';

export interface TextRecord {
  id: string;
  side: TextRecordSide;
  content: string;
  occurredAt: string;
  sortOrder: number;
  createdAt: string;
}

export interface TextRecordRow {
  id: string;
  side: TextRecordSide;
  content: string;
  occurred_at: string;
  sort_order: number;
  created_at: string;
}

export interface CreateTextRecordInput {
  side: TextRecordSide;
  content: string;
  occurredAt: string;
  sortOrder: number;
}

export interface UpdateTextRecordInput {
  id: string;
  content: string;
  occurredAt: string;
}

declare global {
  interface Window {
    DataLoader?: {
      loadAll: () => Promise<boolean>;
      onReady: (cb: () => void) => void;
      getStatus: () => { isLoaded: boolean; loadError: unknown };
      getAllPhotos: () => LocalPhoto[];
      getPhotosByChapter: (chapterId: string) => LocalPhoto[];
      setRemotePhotos?: (photos: LocalPhoto[]) => void;
      addRemotePhoto?: (photo: LocalPhoto) => void;
    };
    Renderer?: {
      renderAll: () => void;
    };
    scrollManager?: {
      buildSectionIds?: () => void;
      init?: () => void;
      setupRevealText?: () => void;
    };
    reinitAnniversaryAnimations?: () => void;
    initBentoCardEffects?: () => void;
  }
}
