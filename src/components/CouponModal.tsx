import type { MakeupCoupon, TextRecordSide } from '../types';

type CreateHandler = (payload: { title: string; description: string }) => Promise<void>;
type UseHandler = (usedNote: string) => Promise<void>;
type ModalMode = 'create' | 'use';

const sideLabels: Record<TextRecordSide, string> = {
  left: 'Daniel 的和好券',
  right: 'AVA 的和好券',
};

const presetCoupons = [
  { title: '无条件抱抱券', desc: '不管谁先低头，出示此券立刻拥抱 30 秒。' },
  { title: '奶茶赔罪券', desc: '小情绪退散，立刻安排一杯喜欢的奶茶或甜品。' },
  { title: '免生气卡', desc: '这一次的小别扭直接翻篇，不许再翻旧账。' },
  { title: '认真倾听券', desc: '放下手机和所有事，专心听对方说完每一句话。' },
];

export class CouponModal {
  private root: HTMLElement;
  private mode: ModalMode = 'create';
  private side: TextRecordSide = 'left';
  private activeCoupon: MakeupCoupon | null = null;
  private onCreate: CreateHandler | null = null;
  private onUse: UseHandler | null = null;
  private status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  private message = '';
  private titleValue = '';
  private descValue = '';
  private noteValue = '';

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'record-modal-root coupon-modal-root';
    this.root.innerHTML = this.template();
    document.body.appendChild(this.root);
    this.bindEvents();
  }

  openCreate(side: TextRecordSide, onSubmit: CreateHandler): void {
    this.mode = 'create';
    this.side = side;
    this.activeCoupon = null;
    this.onCreate = onSubmit;
    this.onUse = null;
    this.status = 'idle';
    this.message = '';
    this.titleValue = '';
    this.descValue = '';
    this.noteValue = '';
    this.root.classList.add('is-open');
    this.render();
    setTimeout(() => (this.root.querySelector('[name="title"]') as HTMLInputElement | null)?.focus(), 80);
  }

  openUse(coupon: MakeupCoupon, onConfirm: UseHandler): void {
    this.mode = 'use';
    this.side = coupon.side;
    this.activeCoupon = coupon;
    this.onCreate = null;
    this.onUse = onConfirm;
    this.status = 'idle';
    this.message = '';
    this.titleValue = coupon.title;
    this.descValue = coupon.description;
    this.noteValue = '';
    this.root.classList.add('is-open');
    this.render();
    setTimeout(() => (this.root.querySelector('[name="usedNote"]') as HTMLInputElement | null)?.focus(), 80);
  }

  close(): void {
    this.root.classList.remove('is-open');
  }

  private bindEvents(): void {
    this.root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-close-coupon-modal]')) {
        this.close();
        return;
      }

      const presetBtn = target.closest<HTMLElement>('[data-coupon-preset]');
      if (presetBtn && this.mode === 'create') {
        const index = Number(presetBtn.dataset.couponPreset);
        const preset = presetCoupons[index];
        if (preset) {
          this.titleValue = preset.title;
          this.descValue = preset.desc;
          this.status = 'idle';
          this.message = '';
          this.render();
        }
      }
    });

    this.root.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.name === 'title') this.titleValue = target.value;
      if (target.name === 'description') this.descValue = target.value;
      if (target.name === 'usedNote') this.noteValue = target.value;
      this.status = 'idle';
      this.message = '';
      this.renderMessage();
    });

    this.root.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (this.mode === 'create') {
        if (!this.onCreate) return;
        if (!this.titleValue.trim()) {
          this.setMessage('error', '先给这张和好券起个名字吧。');
          return;
        }
        this.setMessage('loading', '正在放进和好券盒...');
        try {
          await this.onCreate({ title: this.titleValue, description: this.descValue });
          this.setMessage('success', '和好券已放好。');
          setTimeout(() => this.close(), 750);
        } catch (error) {
          this.setMessage('error', error instanceof Error ? error.message : '添加失败，请稍后再试。');
        }
        return;
      }

      if (!this.onUse) return;
      this.setMessage('loading', '正在核销这张和好券...');
      try {
        await this.onUse(this.noteValue);
        this.setMessage('success', '和好券已核销，记得抱抱彼此。');
        setTimeout(() => this.close(), 850);
      } catch (error) {
        this.setMessage('error', error instanceof Error ? error.message : '核销失败，请稍后再试。');
      }
    });
  }

  private setMessage(status: 'idle' | 'loading' | 'success' | 'error', message: string): void {
    this.status = status;
    this.message = message;
    this.render();
  }

  private renderMessage(): void {
    const messageEl = this.root.querySelector('[data-coupon-message]');
    if (!messageEl) return;
    messageEl.textContent = this.message;
    messageEl.className = `record-modal-message ${this.status}`;
  }

  private render(): void {
    const kicker = this.root.querySelector('[data-coupon-kicker]');
    const title = this.root.querySelector('[data-coupon-modal-title]');
    const side = this.root.querySelector('[data-coupon-modal-side]');
    const createFields = this.root.querySelector('[data-coupon-create-fields]') as HTMLElement | null;
    const useFields = this.root.querySelector('[data-coupon-use-fields]') as HTMLElement | null;
    const titleInput = this.root.querySelector('[name="title"]') as HTMLInputElement | null;
    const descInput = this.root.querySelector('[name="description"]') as HTMLTextAreaElement | null;
    const noteInput = this.root.querySelector('[name="usedNote"]') as HTMLInputElement | null;
    const useTitle = this.root.querySelector('[data-use-preview-title]');
    const useDesc = this.root.querySelector('[data-use-preview-desc]');
    const submit = this.root.querySelector('[data-coupon-submit]') as HTMLButtonElement | null;

    if (kicker) kicker.textContent = this.mode === 'create' ? 'New Makeup Coupon' : 'Redeem Coupon';
    if (title) title.textContent = this.mode === 'create' ? '添一张和好券' : '使用这张和好券';
    if (side) side.textContent = sideLabels[this.side];

    if (createFields) createFields.hidden = this.mode !== 'create';
    if (useFields) useFields.hidden = this.mode !== 'use';

    if (titleInput) titleInput.value = this.titleValue;
    if (descInput) descInput.value = this.descValue;
    if (noteInput) noteInput.value = this.noteValue;
    if (useTitle) useTitle.textContent = this.activeCoupon?.title ?? '';
    if (useDesc) useDesc.textContent = this.activeCoupon?.description || '出示此券，立刻触发一次温柔和好。';

    if (submit) {
      submit.disabled = this.status === 'loading';
      if (this.mode === 'create') {
        submit.textContent = this.status === 'loading' ? '保存中...' : '放进和好券盒';
      } else {
        submit.textContent = this.status === 'loading' ? '核销中...' : '确认使用此券';
      }
    }

    this.renderMessage();
  }

  private template(): string {
    const presetHtml = presetCoupons
      .map((item, idx) => `<button type="button" class="coupon-preset-chip" data-coupon-preset="${idx}">${item.title}</button>`)
      .join('');

    return `
      <div class="record-modal-backdrop" data-close-coupon-modal></div>
      <section class="record-modal coupon-modal" role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title">
        <button class="record-modal-close" type="button" data-close-coupon-modal aria-label="关闭">×</button>
        <p class="record-modal-kicker" data-coupon-kicker>New Makeup Coupon</p>
        <h2 id="coupon-modal-title" data-coupon-modal-title>添一张和好券</h2>
        <p class="record-modal-side" data-coupon-modal-side></p>
        <form class="record-modal-form coupon-modal-form">
          <div class="coupon-create-fields" data-coupon-create-fields>
            <div class="coupon-presets" aria-label="快捷模板">
              ${presetHtml}
            </div>
            <label>
              <span>券面名称</span>
              <input type="text" name="title" maxlength="80" placeholder="比如：无条件抱抱券 / 奶茶赔罪券">
            </label>
            <label>
              <span>约定内容（选填）</span>
              <textarea name="description" maxlength="300" placeholder="写下使用这张券时的温柔约定..."></textarea>
            </label>
          </div>
          <div class="coupon-use-fields" data-coupon-use-fields hidden>
            <div class="coupon-use-preview">
              <span class="coupon-use-preview-tag">即将核销</span>
              <h3 data-use-preview-title></h3>
              <p data-use-preview-desc></p>
            </div>
            <label>
              <span>核销备注（选填）</span>
              <input type="text" name="usedNote" maxlength="120" placeholder="比如：今晚散步时用掉啦">
            </label>
          </div>
          <p class="record-modal-message" data-coupon-message aria-live="polite"></p>
          <button class="record-submit" type="submit" data-coupon-submit>放进和好券盒</button>
        </form>
      </section>
    `;
  }
}
