import type { TextRecord, TextRecordSide } from '../types';

const sideCopy: Record<TextRecordSide, { title: string; kicker: string; empty: string }> = {
  left: {
    title: '此刻的回声',
    kicker: 'Left Notes',
    empty: '这里还没有记录，先写下第一句话。',
  },
  right: {
    title: '后来也记得',
    kicker: 'Right Notes',
    empty: '这一侧等待一条新的时间戳。',
  },
};

export function mountTextRecordWall(records: TextRecord[]): void {
  const ending = document.getElementById('ending');
  if (!ending) return;

  document.getElementById('text-record-wall')?.remove();
  ending.insertAdjacentHTML('beforebegin', renderTextRecordWall(records));
}

export function appendTextRecord(record: TextRecord): void {
  const list = document.querySelector(`[data-record-list="${record.side}"]`);
  const empty = document.querySelector(`[data-record-empty="${record.side}"]`);
  if (!list) return;

  empty?.remove();
  list.insertAdjacentHTML('beforeend', renderRecordItem(record));
  list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
}

function renderTextRecordWall(records: TextRecord[]): string {
  return `
    <section class="text-record-section reveal-blur" id="text-record-wall">
      <div class="text-record-bg" aria-hidden="true"></div>
      <div class="section-inner text-record-inner">
        <div class="text-record-heading">
          <p class="chapter-label">Text Notes</p>
          <h2 class="display-md">那些被写下来的话</h2>
          <p class="body-sm">它们不必很长，只要足够真实。时间会替每一句话安静落款。</p>
        </div>
        <div class="text-record-columns">
          ${renderColumn('left', records)}
          ${renderColumn('right', records)}
        </div>
      </div>
    </section>
  `;
}

function renderColumn(side: TextRecordSide, records: TextRecord[]): string {
  const items = records.filter((record) => record.side === side);
  const copy = sideCopy[side];

  return `
    <article class="text-record-column ${side}" data-record-column="${side}">
      <div class="text-record-column-top">
        <div>
          <p>${copy.kicker}</p>
          <h3>${copy.title}</h3>
        </div>
        <button class="text-record-add" type="button" data-add-record="${side}">添加记录</button>
      </div>
      <div class="text-record-list" data-record-list="${side}">
        ${
          items.length
            ? items.map(renderRecordItem).join('')
            : `<div class="text-record-empty" data-record-empty="${side}">${copy.empty}</div>`
        }
      </div>
    </article>
  `;
}

function renderRecordItem(record: TextRecord): string {
  return `
    <article class="text-record-item ${record.side}">
      <time>${escapeHtml(record.occurredAt)}</time>
      <p>${escapeHtml(record.content)}</p>
    </article>
  `;
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
