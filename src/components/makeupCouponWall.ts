import type { MakeupCoupon, TextRecordSide } from '../types';

const sideCopy: Record<TextRecordSide, { title: string; kicker: string; empty: string }> = {
  left: {
    title: 'Daniel',
    kicker: "Daniel's Coupons",
    empty: '暂时还没有和好券，先添一张给未来的温柔台阶。',
  },
  right: {
    title: 'AVA',
    kicker: "AVA's Coupons",
    empty: '暂时还没有和好券，先添一张给未来的温柔台阶。',
  },
};

export function mountMakeupCouponWall(coupons: MakeupCoupon[]): void {
  const anchor = document.getElementById('text-record-wall') || document.getElementById('hero');
  if (!anchor) return;

  document.getElementById('makeup-coupon-wall')?.remove();
  anchor.insertAdjacentHTML('afterend', renderCouponWall(coupons));
}

export function appendCoupon(coupon: MakeupCoupon, allCoupons: MakeupCoupon[]): void {
  const list = document.querySelector(`[data-coupon-list="${coupon.side}"]`);
  const empty = document.querySelector(`[data-coupon-empty="${coupon.side}"]`);
  if (!list) return;

  empty?.remove();
  const firstUsed = list.querySelector('.coupon-ticket.is-used');
  if (firstUsed) {
    firstUsed.insertAdjacentHTML('beforebegin', renderCouponTicket(coupon));
  } else {
    list.insertAdjacentHTML('beforeend', renderCouponTicket(coupon));
  }

  updateSideCount(coupon.side, allCoupons);
  list.scrollTo({ top: 0, behavior: 'smooth' });
}

export function replaceCoupon(coupon: MakeupCoupon, allCoupons: MakeupCoupon[]): void {
  const item = document.querySelector(`[data-coupon-id="${escapeAttr(coupon.id)}"]`);
  if (!item) {
    appendCoupon(coupon, allCoupons);
    return;
  }

  const list = item.closest(`[data-coupon-list="${coupon.side}"]`);
  item.remove();

  if (list) {
    if (coupon.status === 'used') {
      list.insertAdjacentHTML('beforeend', renderCouponTicket(coupon));
    } else {
      list.insertAdjacentHTML('afterbegin', renderCouponTicket(coupon));
    }
  }

  updateSideCount(coupon.side, allCoupons);
}

function updateSideCount(side: TextRecordSide, allCoupons: MakeupCoupon[]): void {
  const countEl = document.querySelector(`[data-coupon-count="${side}"]`);
  if (!countEl) return;
  const availableCount = allCoupons.filter((item) => item.side === side && item.status === 'available').length;
  countEl.textContent = `可用 ${availableCount} 张`;
}

function renderCouponWall(coupons: MakeupCoupon[]): string {
  return `
    <section class="coupon-section reveal-blur" id="makeup-coupon-wall">
      <div class="coupon-bg" aria-hidden="true"></div>
      <div class="section-inner coupon-inner">
        <div class="coupon-heading">
          <p class="chapter-label">Makeup Coupons</p>
          <h2 class="display-md">吵架和好券</h2>
          <p class="body-sm">小别扭总会过去，每一张券都是提前写好的温柔台阶。</p>
        </div>
        <div class="coupon-columns">
          ${renderColumn('left', coupons)}
          ${renderColumn('right', coupons)}
        </div>
      </div>
    </section>
  `;
}

function renderColumn(side: TextRecordSide, coupons: MakeupCoupon[]): string {
  const items = coupons
    .filter((coupon) => coupon.side === side)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
  const availableCount = items.filter((coupon) => coupon.status === 'available').length;
  const copy = sideCopy[side];

  return `
    <article class="coupon-column ${side}" data-coupon-column="${side}">
      <div class="coupon-column-top">
        <div>
          <p>${copy.kicker}</p>
          <div class="coupon-column-title-row">
            <h3>${copy.title}</h3>
            <span class="coupon-count-pill" data-coupon-count="${side}">可用 ${availableCount} 张</span>
          </div>
        </div>
        <button class="coupon-add" type="button" data-add-coupon="${side}">添加和好券</button>
      </div>
      <div class="coupon-list" data-coupon-list="${side}">
        ${
          items.length
            ? items.map(renderCouponTicket).join('')
            : `<div class="coupon-empty" data-coupon-empty="${side}">${copy.empty}</div>`
        }
      </div>
    </article>
  `;
}

function renderCouponTicket(coupon: MakeupCoupon): string {
  const isUsed = coupon.status === 'used';
  const createdLabel = formatShortDate(coupon.createdAt);

  return `
    <article class="coupon-ticket ${coupon.side} ${isUsed ? 'is-used' : 'is-available'}" data-coupon-id="${escapeAttr(coupon.id)}">
      <div class="coupon-ticket-main">
        <div class="coupon-ticket-meta">
          <span class="coupon-ticket-badge">${isUsed ? '已使用' : '有效券'}</span>
          ${createdLabel ? `<time>${escapeHtml(createdLabel)}</time>` : ''}
        </div>
        <h4 class="coupon-ticket-title">${escapeHtml(coupon.title)}</h4>
        ${
          coupon.description
            ? `<p class="coupon-ticket-desc">${escapeHtml(coupon.description)}</p>`
            : ''
        }
        ${
          isUsed && coupon.usedNote
            ? `<p class="coupon-ticket-used-note">核销备注：${escapeHtml(coupon.usedNote)}</p>`
            : ''
        }
      </div>
      <div class="coupon-ticket-stub">
        ${
          isUsed
            ? `
              <div class="coupon-stamp">
                <span>已核销</span>
                ${coupon.usedAt ? `<small>${escapeHtml(coupon.usedAt)}</small>` : ''}
              </div>
            `
            : `
              <button class="coupon-use-btn" type="button" data-use-coupon="${escapeAttr(coupon.id)}">
                使用此券
              </button>
            `
        }
      </div>
    </article>
  `;
}

function formatShortDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char] ?? char));
}
