import type { TextRecordSide } from '../types';

type SubmitHandler = (content: string) => Promise<void>;

interface ModalState {
  content: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const sideLabels: Record<TextRecordSide, string> = {
  left: '左侧记录',
  right: '右侧记录',
};

export class TextRecordModal {
  private root: HTMLElement;
  private side: TextRecordSide = 'left';
  private onSubmit: SubmitHandler | null = null;
  private state: ModalState = {
    content: '',
    status: 'idle',
    message: '',
  };

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'record-modal-root';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.bindEvents();
  }

  open(side: TextRecordSide, onSubmit: SubmitHandler): void {
    this.side = side;
    this.onSubmit = onSubmit;
    this.state = { content: '', status: 'idle', message: '' };
    this.root.classList.add('is-open');
    this.render();
    setTimeout(() => this.root.querySelector('textarea')?.focus(), 80);
  }

  close(): void {
    this.root.classList.remove('is-open');
  }

  private bindEvents(): void {
    this.root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-close-record-modal]') || target === this.root.querySelector('.record-modal-backdrop')) {
        this.close();
      }
    });

    this.root.addEventListener('input', (event) => {
      const target = event.target as HTMLTextAreaElement;
      if (target.name !== 'content') return;
      this.state.content = target.value;
      this.state.status = 'idle';
      this.state.message = '';
      this.renderMessage();
    });

    this.root.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!this.onSubmit) return;
      if (!this.state.content.trim()) {
        this.setMessage('error', '先写下一句话，再把它放进记录里。');
        return;
      }

      this.setMessage('loading', '正在保存这条记录...');
      try {
        await this.onSubmit(this.state.content);
        this.setMessage('success', '已经写进记录贴。');
        setTimeout(() => this.close(), 850);
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

  private renderMessage(): void {
    const message = this.root.querySelector('[data-record-message]');
    if (!message) return;
    message.textContent = this.state.message;
    message.className = `record-modal-message ${this.state.status}`;
  }

  private render(): void {
    const title = this.root.querySelector('[data-record-modal-title]');
    const side = this.root.querySelector('[data-record-modal-side]');
    const textarea = this.root.querySelector('[name="content"]') as HTMLTextAreaElement | null;
    const submit = this.root.querySelector('[data-record-submit]') as HTMLButtonElement | null;

    if (title) title.textContent = `添加${sideLabels[this.side]}`;
    if (side) side.textContent = sideLabels[this.side];
    if (textarea) textarea.value = this.state.content;
    if (submit) {
      submit.disabled = this.state.status === 'loading';
      submit.textContent = this.state.status === 'loading' ? '保存中...' : '保存记录';
    }
    this.renderMessage();
  }

  private template(): string {
    return `
      <div class="record-modal-backdrop" aria-hidden="true"></div>
      <section class="record-modal" role="dialog" aria-modal="true" aria-labelledby="record-modal-title">
        <button class="record-modal-close" type="button" data-close-record-modal aria-label="关闭">×</button>
        <p class="record-modal-kicker">Text Record</p>
        <h2 id="record-modal-title" data-record-modal-title>添加记录</h2>
        <p class="record-modal-side" data-record-modal-side>左侧记录</p>
        <form class="record-modal-form">
          <label>
            记录内容
            <textarea name="content" rows="6" maxlength="1200" placeholder="写下一条想被记住的话。时间会自动记录到当前小时。"></textarea>
          </label>
          <p class="record-modal-message" data-record-message aria-live="polite"></p>
          <button class="record-submit" type="submit" data-record-submit>保存记录</button>
        </form>
      </section>
    `;
  }
}
