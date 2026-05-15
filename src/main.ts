import '../css/styles.css';
import '../js/data-loader.js';
import '../js/renderer.js';
import '../js/particles.js';
import '../js/cursor.js';
import '../js/scroll.js';
import '../js/main.js';
import './styles/upload.css';
import { PhotoUploadModal } from './components/PhotoUploadModal';
import { TextRecordModal } from './components/TextRecordModal';
import { appendTextRecord, mountTextRecordWall } from './components/textRecordWall';
import {
  createPhotoRecord,
  fetchAllRemotePhotos,
  getNextSortOrder,
  uploadPhoto,
} from './services/photoService';
import {
  createTextRecord,
  fetchTextRecords,
  formatCurrentRecordHour,
  getNextTextRecordSortOrder,
} from './services/textRecordService';
import { isSupabaseConfigured } from './lib/supabase';
import type { LocalPhoto, TextRecord, TextRecordSide, UploadModalPayload } from './types';

const editorPassword = import.meta.env.VITE_EDITOR_PASSWORD as string | undefined;
const uploadableChapters = new Set(['growing-clear', 'nanjing', 'announcement', 'good-times-1', 'good-times-2', 'now']);
const modal = new PhotoUploadModal();
const recordModal = new TextRecordModal();
let textRecords: TextRecord[] = [];

function notify(message: string, tone: 'success' | 'error' | 'info' = 'info'): void {
  const existing = document.querySelector('.site-toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = `site-toast ${tone}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 3600);
}

function askEditorPassword(): Promise<boolean> {
  if (!editorPassword) {
    notify('未配置编辑密码。请在环境变量中设置 VITE_EDITOR_PASSWORD。', 'error');
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'password-gate-root is-open';
    root.innerHTML = `
      <div class="password-gate-backdrop"></div>
      <form class="password-gate" aria-label="编辑密码">
        <button type="button" class="password-gate-close" aria-label="关闭">×</button>
        <p class="upload-modal-kicker">Editor Gate</p>
        <h2>进入编辑模式</h2>
        <p>输入编辑密码后，才可以添加照片或文字记录。</p>
        <input type="password" name="password" autocomplete="current-password" placeholder="编辑密码">
        <span class="password-gate-message" aria-live="polite"></span>
        <button type="submit" class="upload-submit">继续编辑</button>
      </form>
    `;
    document.body.appendChild(root);

    const close = (result: boolean) => {
      root.classList.remove('is-open');
      setTimeout(() => root.remove(), 250);
      resolve(result);
    };

    root.querySelector('.password-gate-close')?.addEventListener('click', () => close(false));
    root.querySelector('.password-gate-backdrop')?.addEventListener('click', () => close(false));
    root.querySelector('input')?.addEventListener('keydown', () => {
      const message = root.querySelector('.password-gate-message');
      if (message) message.textContent = '';
    });
    root.querySelector('form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = (root.querySelector('input') as HTMLInputElement | null)?.value ?? '';
      if (value !== editorPassword) {
        const message = root.querySelector('.password-gate-message');
        if (message) message.textContent = '密码不正确，上传入口未打开。';
        return;
      }
      close(true);
    });

    setTimeout(() => root.querySelector('input')?.focus(), 80);
  });
}

function rerenderPage(): void {
  window.Renderer?.renderAll();
  mountTextRecordWall(textRecords);
  window.reinitAnniversaryAnimations?.();
  window.initBentoCardEffects?.();
  window.scrollManager?.buildSectionIds?.();
}

async function handleUpload(chapterId: string, payload: UploadModalPayload): Promise<void> {
  const uploaded = await uploadPhoto(payload.file, chapterId);
  const sortOrder = await getNextSortOrder(chapterId);
  const photo = await createPhotoRecord({
    chapterId,
    title: payload.title,
    caption: payload.caption,
    date: payload.date,
    location: payload.location,
    imageUrl: uploaded.imageUrl,
    storagePath: uploaded.storagePath,
    sortOrder,
  });

  window.DataLoader?.addRemotePhoto?.(photo);
  rerenderPage();
  notify('已加入这一章的记忆', 'success');
}

async function handleCreateTextRecord(side: TextRecordSide, content: string): Promise<void> {
  const sortOrder = await getNextTextRecordSortOrder(side);
  const record = await createTextRecord({
    side,
    content,
    occurredAt: formatCurrentRecordHour(),
    sortOrder,
  });

  textRecords = textRecords.concat(record);
  appendTextRecord(record);
  notify('已经写进这面记录墙', 'success');
}

function getChapterTitle(button: HTMLElement): string {
  const section = button.closest('.section');
  const heading = section?.querySelector('h2')?.textContent?.trim();
  return heading || button.dataset.chapterTitle || button.dataset.chapter || '这一章';
}

function bindUploadEntrypoints(): void {
  document.body.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLElement>('[data-upload-chapter]');
    if (!button) return;

    const chapterId = button.dataset.uploadChapter;
    if (!chapterId || !uploadableChapters.has(chapterId)) return;
    if (!(await askEditorPassword())) return;
    if (!isSupabaseConfigured) {
      notify('Supabase 尚未配置，当前只能浏览本地 JSON 内容。', 'error');
      return;
    }

    modal.open(chapterId, getChapterTitle(button), (payload) => handleUpload(chapterId, payload));
  });
}

function bindTextRecordEntrypoints(): void {
  document.body.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLElement>('[data-add-record]');
    if (!button) return;

    const side = button.dataset.addRecord as TextRecordSide | undefined;
    if (side !== 'left' && side !== 'right') return;
    if (!(await askEditorPassword())) return;
    if (!isSupabaseConfigured) {
      notify('Supabase 尚未配置，文字记录暂时不能保存。', 'error');
      return;
    }

    recordModal.open(side, (content) => handleCreateTextRecord(side, content));
  });
}

async function loadRemotePhotos(): Promise<void> {
  if (!window.DataLoader) return;

  try {
    const remotePhotos: LocalPhoto[] = await fetchAllRemotePhotos();
    window.DataLoader.setRemotePhotos?.(remotePhotos);
    if (remotePhotos.length) {
      rerenderPage();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '远程照片加载失败。';
    notify(`${message} 本地内容已保留。`, 'error');
  }
}

async function loadTextRecords(): Promise<void> {
  try {
    textRecords = await fetchTextRecords();
    mountTextRecordWall(textRecords);
    window.reinitAnniversaryAnimations?.();
    window.scrollManager?.buildSectionIds?.();
  } catch (error) {
    textRecords = [];
    mountTextRecordWall([]);
    const message = error instanceof Error ? error.message : '文字记录加载失败。';
    notify(`${message} 页面其他内容已保留。`, 'error');
  }
}

function bootRemoteLayer(): void {
  bindUploadEntrypoints();
  bindTextRecordEntrypoints();

  if (!isSupabaseConfigured) {
    notify('Supabase 环境变量未配置，上传功能暂不可用。', 'info');
  }

  if (window.DataLoader?.getStatus().isLoaded) {
    void loadRemotePhotos();
    void loadTextRecords();
    return;
  }

  window.DataLoader?.onReady(() => {
    void loadRemotePhotos();
    void loadTextRecords();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootRemoteLayer);
} else {
  bootRemoteLayer();
}
