import type { LocalPhoto, PhotoEditPayload } from '../types';

type SubmitHandler = (payload: PhotoEditPayload) => Promise<void>;

interface ModalState extends PhotoEditPayload {
  previewUrl: string;
  fileName: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const emptyState: ModalState = {
  file: null,
  title: '',
  caption: '',
  date: '',
  location: '',
  previewUrl: '',
  fileName: '',
  status: 'idle',
  message: '',
};

export class PhotoEditModal {
  private root: HTMLElement;
  private onSubmit: SubmitHandler | null = null;
  private state: ModalState = { ...emptyState };

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'record-modal-root';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.bindEvents();
  }

  open(photo: LocalPhoto, onSubmit: SubmitHandler): void {
    this.onSubmit = onSubmit;
    this.state = {
      file: null,
      title: photo.title ?? '',
      caption: photo.caption ?? '',
      date: photo.date ?? '',
      location: photo.location ?? '',
      previewUrl: photo.src,
      fileName: '',
      status: 'idle',
      message: '',
    };
    this.root.classList.add('is-open');
    this.render();
    setTimeout(() => this.root.querySelector<HTMLInputElement>('[name="title"]')?.focus(), 80);
  }

  close(): void {
    this.root.classList.remove('is-open');
  }

  private bindEvents(): void {
    this.root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-close-photo-edit-modal]') || target === this.root.querySelector('.record-modal-backdrop')) {
        this.close();
      }
    });

    this.root.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.name === 'image') {
        const input = target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.state = {
          ...this.state,
          file,
          fileName: file?.name ?? '',
          previewUrl: file ? URL.createObjectURL(file) : this.state.previewUrl,
          status: 'idle',
          message: '',
        };
        this.render();
        return;
      }

      if (!(target.name in this.state)) return;
      this.state = { ...this.state, [target.name]: target.value, status: 'idle', message: '' };
      this.renderMessage();
    });

    this.root.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!this.onSubmit) return;

      this.setMessage('loading', '正在保存照片信息...');
      try {
        await this.onSubmit({
          file: this.state.file,
          title: this.state.title,
          caption: this.state.caption,
          date: this.state.date,
          location: this.state.location,
        });
        this.setMessage('success', '照片信息已经更新。');
        setTimeout(() => this.close(), 850);
      } catch (error) {
        this.setMessage('error', error instanceof Error ? error.message : '更新失败，请稍后再试。');
      }
    });
  }

  private setMessage(status: ModalState['status'], message: string): void {
    this.state.status = status;
    this.state.message = message;
    this.render();
  }

  private renderMessage(): void {
    const message = this.root.querySelector('[data-photo-edit-message]');
    if (!message) return;
    message.textContent = this.state.message;
    message.className = `record-modal-message ${this.state.status}`;
  }

  private render(): void {
    for (const name of ['title', 'caption', 'date', 'location'] as const) {
      const field = this.root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (field) field.value = this.state[name];
    }

    const preview = this.root.querySelector<HTMLImageElement>('[data-photo-edit-preview]');
    if (preview) preview.src = this.state.previewUrl;

    const fileName = this.root.querySelector('[data-photo-edit-file-name]');
    if (fileName) fileName.textContent = this.state.fileName || '不替换原图片';

    const submit = this.root.querySelector<HTMLButtonElement>('[data-photo-edit-submit]');
    if (submit) {
      submit.disabled = this.state.status === 'loading';
      submit.textContent = this.state.status === 'loading' ? '保存中...' : '保存修改';
    }
    this.renderMessage();
  }

  private template(): string {
    return `
      <div class="record-modal-backdrop" aria-hidden="true"></div>
      <section class="record-modal photo-edit-modal" role="dialog" aria-modal="true" aria-labelledby="photo-edit-modal-title">
        <button class="record-modal-close" type="button" data-close-photo-edit-modal aria-label="关闭">×</button>
        <p class="record-modal-kicker">Photo Edit</p>
        <h2 id="photo-edit-modal-title">修改照片信息</h2>
        <p class="record-modal-side">可以覆盖标题、配文、日期、地点；选择新图时也会替换这条记录显示的照片。</p>
        <form class="record-modal-form photo-edit-form">
          <label class="photo-edit-image wide">
            替换图片
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp">
            <span class="photo-edit-preview">
              <img data-photo-edit-preview alt="当前照片预览">
            </span>
            <span class="photo-edit-file-name" data-photo-edit-file-name>不替换原图片</span>
          </label>
          <label>
            标题
            <input name="title" type="text" maxlength="80" placeholder="这张照片的标题">
          </label>
          <label>
            日期
            <input name="date" type="text" maxlength="40" placeholder="例如 2025-02-14">
          </label>
          <label>
            地点
            <input name="location" type="text" maxlength="80" placeholder="例如 南京">
          </label>
          <label class="wide">
            配文
            <textarea name="caption" rows="5" maxlength="500" placeholder="写下这一刻想被记住的话"></textarea>
          </label>
          <p class="record-modal-message" data-photo-edit-message aria-live="polite"></p>
          <button class="record-submit" type="submit" data-photo-edit-submit>保存修改</button>
        </form>
      </section>
    `;
  }
}
