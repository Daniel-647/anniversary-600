import type { UploadModalPayload } from '../types';

type SubmitHandler = (payload: UploadModalPayload) => Promise<void>;

interface ModalState {
  file: File | null;
  previewUrl: string;
  title: string;
  caption: string;
  date: string;
  location: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

export class PhotoUploadModal {
  private root: HTMLElement;
  private chapterId = '';
  private chapterTitle = '';
  private onSubmit: SubmitHandler | null = null;
  private state: ModalState = {
    file: null,
    previewUrl: '',
    title: '',
    caption: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    status: 'idle',
    message: '',
  };

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'upload-modal-root';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.bindEvents();
  }

  open(chapterId: string, chapterTitle: string, onSubmit: SubmitHandler): void {
    this.chapterId = chapterId;
    this.chapterTitle = chapterTitle;
    this.onSubmit = onSubmit;
    this.state = {
      file: null,
      previewUrl: '',
      title: '',
      caption: '',
      date: new Date().toISOString().slice(0, 10),
      location: '',
      status: 'idle',
      message: '',
    };
    this.root.classList.add('is-open');
    this.render();
  }

  close(): void {
    this.root.classList.remove('is-open');
    if (this.state.previewUrl) URL.revokeObjectURL(this.state.previewUrl);
  }

  private bindEvents(): void {
    this.root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-close-modal]') || target === this.root.querySelector('.upload-modal-backdrop')) {
        this.close();
      }
    });

    this.root.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.name !== 'photo-file' || !target.files?.[0]) return;

      if (this.state.previewUrl) URL.revokeObjectURL(this.state.previewUrl);
      this.state.file = target.files[0];
      this.state.previewUrl = URL.createObjectURL(target.files[0]);
      this.state.status = 'idle';
      this.state.message = '';
      this.render();
    });

    this.root.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target.name) return;
      this.state = { ...this.state, [target.name]: target.value };
    });

    this.root.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!this.onSubmit) return;
      if (!this.state.file) {
        this.setMessage('error', '请先选择一张照片。');
        return;
      }

      this.setMessage('loading', '正在把这张记忆放进章节里...');
      try {
        await this.onSubmit({
          file: this.state.file,
          title: this.state.title,
          caption: this.state.caption,
          date: this.state.date,
          location: this.state.location,
        });
        this.setMessage('success', '已加入这一章的记忆');
        setTimeout(() => this.close(), 950);
      } catch (error) {
        this.setMessage('error', error instanceof Error ? error.message : '保存失败，请稍后再试。');
      }
    });
  }

  private setMessage(status: ModalState['status'], message: string): void {
    this.state.status = status;
    this.state.message = message;
    this.render();
  }

  private render(): void {
    const title = this.root.querySelector('[data-modal-chapter]');
    const preview = this.root.querySelector('[data-preview]');
    const fileName = this.root.querySelector('[data-file-name]');
    const message = this.root.querySelector('[data-modal-message]');
    const submit = this.root.querySelector('[data-submit]') as HTMLButtonElement | null;
    const titleInput = this.root.querySelector('[name="title"]') as HTMLInputElement | null;
    const captionInput = this.root.querySelector('[name="caption"]') as HTMLTextAreaElement | null;
    const dateInput = this.root.querySelector('[name="date"]') as HTMLInputElement | null;
    const locationInput = this.root.querySelector('[name="location"]') as HTMLInputElement | null;

    if (title) title.textContent = `${this.chapterTitle || this.chapterId} · 添加照片`;
    if (preview) {
      preview.innerHTML = this.state.previewUrl
        ? `<img src="${this.state.previewUrl}" alt="Selected photo preview">`
        : '<span>选择一张记忆</span>';
    }
    if (fileName) fileName.textContent = this.state.file?.name ?? 'JPG / PNG / WebP · 5MB 以内';
    if (message) {
      message.textContent = this.state.message;
      message.className = `upload-modal-message ${this.state.status}`;
    }
    if (submit) {
      submit.disabled = this.state.status === 'loading';
      submit.textContent = this.state.status === 'loading' ? '保存中...' : '保存到这一章';
    }
    if (titleInput) titleInput.value = this.state.title;
    if (captionInput) captionInput.value = this.state.caption;
    if (dateInput) dateInput.value = this.state.date;
    if (locationInput) locationInput.value = this.state.location;
  }

  private template(): string {
    return `
      <div class="upload-modal-backdrop" aria-hidden="true"></div>
      <section class="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
        <button class="upload-modal-close" type="button" data-close-modal aria-label="关闭">×</button>
        <div class="upload-modal-kicker">Memory Upload</div>
        <h2 id="upload-modal-title" data-modal-chapter>添加照片</h2>
        <form class="upload-modal-form">
          <label class="upload-dropzone">
            <input type="file" name="photo-file" accept="image/jpeg,image/png,image/webp">
            <span class="upload-preview" data-preview><span>选择一张记忆</span></span>
            <span class="upload-file-name" data-file-name>JPG / PNG / WebP · 5MB 以内</span>
          </label>
          <div class="upload-fields">
            <label>标题<input name="title" type="text" autocomplete="off" placeholder="这一刻的名字"></label>
            <label>日期<input name="date" type="date"></label>
            <label>地点<input name="location" type="text" autocomplete="off" placeholder="城市、街角、房间..."></label>
            <label class="wide">配文<textarea name="caption" rows="4" placeholder="写一句只属于这张照片的话"></textarea></label>
          </div>
          <p class="upload-modal-message" data-modal-message aria-live="polite"></p>
          <button class="upload-submit" type="submit" data-submit>保存到这一章</button>
        </form>
      </section>
    `;
  }
}
