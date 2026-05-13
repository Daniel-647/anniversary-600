/* ========================================
   Cinematic Renderer
   Component-style render functions driven by JSON data
   ======================================== */

const Renderer = (function () {
  'use strict';

  const D = window.DataLoader;
  if (!D) {
    console.error('[Renderer] DataLoader not found!');
    return {};
  }

  const photoChapterIds = new Set(['growing-clear', 'nanjing', 'announcement', 'good-times-1', 'good-times-2', 'now']);

  // ==========================================
  // Utility: Create element with classes & attrs
  // ==========================================
  function el(tag, classes, attrs, children) {
    const e = document.createElement(tag);
    if (classes) e.className = classes;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style') Object.assign(e.style, v);
      else if (k.startsWith('data-')) e.setAttribute(k, v);
      else e.setAttribute(k, v);
    });
    if (children) {
      if (typeof children === 'string') e.textContent = children;
      else if (Array.isArray(children)) children.forEach((c) => e.appendChild(c));
      else e.appendChild(children);
    }
    return e;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[char]));
  }

  function relationshipDays() {
    return D.getRelationshipDays?.() ?? 600;
  }

  function formatDays() {
    return relationshipDays().toLocaleString();
  }

  function withDynamicDays(value) {
    return String(value ?? '').replace(/600/g, formatDays());
  }

  // ==========================================
  // Component: GlassCard
  // ==========================================
  function GlassCard(content, opts = {}) {
    const size = opts.size === 'sm' ? 'glass-card-sm' : 'glass-card';
    const card = el('div', `${size} reveal-blur`, {
      style: opts.style || {},
    }, content);

    // Hover tilt
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      card.style.transform = `translateY(-2px) rotateX(${((y-cy)/cy)*3}deg) rotateY(${((x-cx)/cx)*-3}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    return card;
  }

  // ==========================================
  // Component: PhotoScene — renders a photo based on displayType
  // ==========================================
  function PhotoScene(photoData) {
    const {
      src, title, caption, displayType, animation,
      blurReveal: blur, parallax, colorTone, mood,
    } = photoData;

    const container = el('div', 'photo-scene-container', {
      'data-animation': animation,
      'data-display': displayType,
      'data-mood': mood,
      'data-tone': colorTone,
    });

    // Placeholder for missing images
    const placeholderColors = {
      blue: 'linear-gradient(135deg, #1a2a3a, #2a3a4a)',
      dark: 'linear-gradient(135deg, #0a0a14, #1a1a24)',
      gold: 'linear-gradient(135deg, #1a1610, #2a2018)',
      pink: 'linear-gradient(135deg, #1a1418, #2a1a20)',
    };

    const bgGradient = placeholderColors[colorTone] || placeholderColors.dark;

    switch (displayType) {
      case 'hero':
        // Full-width cinematic hero image
        container.className += ' photo-hero';
        const heroImg = el('div', 'photo-hero-image', {
          style: {
            backgroundImage: `url(${src}), ${bgGradient}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        });
        const heroOverlay = el('div', 'photo-hero-overlay', {
          html: `<p class="photo-hero-caption">${caption}</p>`,
        });
        container.appendChild(heroImg);
        container.appendChild(heroOverlay);
        break;

      case 'card':
        // Glass card with image
        container.className += ' photo-card-container';
        const cardImg = el('div', 'photo-card-image', {
          style: {
            backgroundImage: `url(${src}), ${bgGradient}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        });
        const cardContent = el('div', 'photo-card-text', {
          html: `
            <p class="photo-card-title">${title}</p>
            <p class="photo-card-caption">${caption}</p>
          `,
        });
        container.appendChild(cardImg);
        container.appendChild(cardContent);
        break;

      case 'background':
        // Used as chapter background (rendered in chapter section)
        container.className += ' photo-bg';
        container.style.backgroundImage = `url(${src}), ${bgGradient}`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        break;

      case 'floating':
        // Floating parallax image
        container.className += ' photo-floating';
        const floatImg = el('div', 'photo-floating-image', {
          style: {
            backgroundImage: `url(${src}), ${bgGradient}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        });
        container.appendChild(floatImg);
        if (caption) {
          container.appendChild(el('p', 'photo-floating-caption', { text: caption }));
        }
        break;

      case 'gallery':
        // Small gallery item
        container.className += ' photo-gallery-item';
        const galleryImg = el('div', 'photo-gallery-image', {
          style: {
            backgroundImage: `url(${src}), ${bgGradient}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        });
        container.appendChild(galleryImg);
        break;

      default:
        container.className += ' photo-default';
        container.style.backgroundImage = `url(${src}), ${bgGradient}`;
    }

    // Apply animation class
    const animClassMap = {
      'parallax-reveal': 'anim-parallax-reveal',
      'blur-fade-in': 'anim-blur-fade-in',
      'float-in': 'anim-float-in',
      'cinematic-zoom': 'anim-cinematic-zoom',
    };
    if (animClassMap[animation]) {
      container.classList.add(animClassMap[animation]);
    }
    if (blur) container.classList.add('blur-reveal');
    if (parallax) container.setAttribute('data-parallax', 'true');

    return container;
  }

  // ==========================================
  // Component: ChapterSection — full chapter render
  // ==========================================
  function ChapterSection(chapterData) {
    const { id, title, subtitle, description, theme, startText, endText, motionStyle } = chapterData;

    const section = el('section', `section chapter-${id}`, {
      id: `chapter-${id}`,
    });

    // Section background
    const bg = el('div', 'section-bg');
    // Check for background photo
    const bgPhoto = D.getBackgroundPhotoForChapter(id);
    if (bgPhoto) {
      bg.style.backgroundImage = `url(${bgPhoto.src})`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
      bg.style.opacity = '0.2';
    }
    // Rain overlay for uncertain-beginning
    if (id === 'uncertain-beginning') {
      bg.appendChild(el('div', 'rain-overlay'));
    }
    // Fracture lines for growing-clear and unexpected-challenge
    if (id === 'growing-clear' || id === 'unexpected-challenge') {
      for (let i = 0; i < 7; i++) {
        const line = el('div', 'fracture-line');
        line.style.left = `${12 + i * 12}%`;
        line.style.top = `${18 + (i % 4) * 16}%`;
        bg.appendChild(line);
      }
    }
    // Snowflakes for nanjing
    if (id === 'nanjing' && chapterData.hasSnow) {
      // Snowflakes are handled by main.js → initSnowflakes()
    }
    // Bloom lights for announcement, good-times-1, good-times-2
    if ((id === 'announcement' || id === 'good-times-1' || id === 'good-times-2') && chapterData.hasBloomLights) {
      const bloomPositions = [
        { w: 400, h: 400, t: '30%', l: '50%', c: 'rgba(201,169,110,0.3)' },
        { w: 250, h: 250, t: '60%', l: '30%', c: 'rgba(184,149,106,0.2)' },
        { w: 300, h: 300, t: '50%', l: '70%', c: 'rgba(201,169,110,0.2)' },
      ];
      bloomPositions.forEach((pos) => {
        const light = el('div', 'bloom-light');
        Object.assign(light.style, {
          width: `${pos.w}px`, height: `${pos.h}px`,
          top: pos.t, left: pos.l,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${pos.c}, transparent)`,
        });
        bg.appendChild(light);
      });
    }

    section.appendChild(bg);

    // Section inner
    const inner = el('div', 'section-inner');

    // Chapter header
    const header = el('div', '', { style: { textAlign: 'center', marginBottom: '3rem' } });
    header.appendChild(el('span', 'chapter-label reveal-text', { text: `Chapter ${chapterData.order}` }));
    header.appendChild(el('h2', 'display-md reveal-text', {
      text: withDynamicDays(`${title} · ${subtitle}`),
      style: { marginTop: '0.75rem', color: 'var(--cinema-white)' },
    }));
    header.appendChild(el('p', 'body-lg reveal-text', {
      text: withDynamicDays(description),
      style: { marginTop: '1rem', maxWidth: '500px', marginInline: 'auto' },
    }));
    inner.appendChild(header);

    // --- Chapter-specific content ---
    switch (id) {
      case 'uncertain-beginning':
        renderUncertainBeginning(inner, chapterData);
        break;
      case 'growing-clear':
        renderGrowingClear(inner, chapterData);
        break;
      case 'nanjing':
        renderNanjing(inner, chapterData);
        break;
      case 'announcement':
        renderAnnouncement(inner, chapterData);
        break;
      case 'good-times-1':
      case 'good-times-2':
        renderGoodTimes(inner, chapterData);
        break;
      case 'unexpected-challenge':
        renderUnexpectedChallenge(inner, chapterData);
        break;
      case 'now':
        renderNow(inner, chapterData);
        break;
    }

    // Chapter photo showcase is only available for photo chapters.
    if (chapterData.hasPhotos !== false && photoChapterIds.has(id)) {
      renderChapterPhotos(inner, id);
    }

    // End text
    if (endText) {
      inner.appendChild(el('p', 'reveal-blur body-sm', {
        text: withDynamicDays(endText),
        style: { textAlign: 'center', marginTop: '3rem', color: 'var(--warm-gold)', opacity: '0.7' },
      }));
    }

    section.appendChild(inner);
    return section;
  }

  // ==========================================
  // Chapter Content Renderers
  // ==========================================

  function renderUncertainBeginning(container, data) {
    // Chat bubbles
    if (data.chatBubbles && data.chatBubbles.length) {
      const chatContainer = el('div', '', {
        style: { maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
      });
      data.chatBubbles.forEach((bubble) => {
        chatContainer.appendChild(
          el('div', `chat-bubble ${bubble.type}`, { text: bubble.text })
        );
      });
      container.appendChild(chatContainer);
    }

    // Floating words
    if (data.floatingWords && data.floatingWords.length) {
      const wordsRow = el('div', '', {
        style: { display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '4rem', flexWrap: 'wrap' },
      });
      data.floatingWords.forEach((word, i) => {
        wordsRow.appendChild(el('span', 'reveal-blur body-sm', {
          text: word,
          style: { opacity: '0.5', transitionDelay: `${i * 0.2}s` },
        }));
      });
      container.appendChild(wordsRow);
    }
  }

  function renderGrowingClear(container, data) {
    const card = GlassCard(
      el('div', 'reveal-stagger', {
        html: data.struggleLines ? data.struggleLines.map((line, i) => {
          const cls = i === data.struggleLines.length - 1
            ? 'body-lg'
            : 'body-lg';
          const style = i === data.struggleLines.length - 1
            ? 'margin-top:1.5rem;color:var(--warm-gold-light)'
            : 'color:var(--cinema-white-dim)';
          return `<p class="${cls}" style="${style}">${line}</p>`;
        }).join('') : '',
      }),
      { style: { maxWidth: '650px', margin: '0 auto' } }
    );
    container.appendChild(card);

    // Transition text
    if (data.transitionText) {
      container.appendChild(el('p', 'reveal-blur body-sm', {
        text: data.transitionText,
        style: { textAlign: 'center', marginTop: '4rem', color: 'var(--warm-gold)', opacity: '0.6' },
      }));
    }
  }

  function renderNanjing(container, data) {
    // Timeline
    if (data.timelineNodes && data.timelineNodes.length) {
      const tlWrapper = el('div', '', { style: { maxWidth: '700px', margin: '3rem auto' } });
      const tlPath = el('div', 'timeline-path reveal-text');
      data.timelineNodes.forEach((node) => {
        tlPath.appendChild(el('div', 'timeline-dot', { style: { left: `${node.position}%` } }));
      });
      tlWrapper.appendChild(tlPath);

      const labelsRow = el('div', '', {
        style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--cinema-gray)', padding: '0 5%' },
      });
      data.timelineNodes.forEach((node) => {
        labelsRow.appendChild(el('span', 'reveal-text', { text: node.label }));
      });
      tlWrapper.appendChild(labelsRow);
      container.appendChild(tlWrapper);
    }

    // Quote card
    if (data.quote) {
      const quoteCard = GlassCard(
        el('p', 'body-lg', {
          html: data.quote.replace(/\n/g, '<br>'),
          style: { color: 'var(--warm-gold-light)', fontStyle: 'italic', fontFamily: 'var(--font-cn)', textAlign: 'center' },
        }),
        { style: { maxWidth: '600px', margin: '3rem auto', textAlign: 'center' } }
      );
      container.appendChild(quoteCard);
    }
  }

  function renderAnnouncement(container, data) {
    // Announcement card
    if (data.announcementText) {
      const announceCard = GlassCard(
        el('p', '', {
          html: `${data.announcementText}<br><span style="font-size:0.9rem;color:var(--cinema-white-dim)">— ${data.announcementDate}</span>`,
          style: { fontFamily: 'var(--font-cn)', fontSize: '1.5rem', fontWeight: '300', color: 'var(--cinema-white)', lineHeight: '1.8', textAlign: 'center' },
        }),
        { style: { maxWidth: '550px', margin: '3rem auto', textAlign: 'center' } }
      );
      container.appendChild(announceCard);
    }

    // Floating words
    if (data.floatingWords && data.floatingWords.length) {
      const wordsRow = el('div', '', {
        style: { display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' },
      });
      data.floatingWords.forEach((word, i) => {
        wordsRow.appendChild(el('span', 'reveal-blur', {
          text: word,
          style: { fontFamily: 'var(--font-cn)', color: 'var(--warm-gold-light)', fontSize: '1rem', opacity: '0.7', transitionDelay: `${i * 0.2}s` },
        }));
      });
      container.appendChild(wordsRow);
    }
  }

  function renderNow(container, data) {
    const stats = D.getDashboardStats();
    const highMemories = D.getHighImportanceMemories();
    const chapterMemories = D.getMemoriesByChapter('six-hundred-days');

    const grid = el('div', 'bento-grid');

    // Card: Days Together
    grid.appendChild(makeBentoCard({
      icon: '💛', label: '在一起', value: stats.totalDays, unit: '天',
      colSpan: 2,
    }));

    // Card: Seasons
    grid.appendChild(makeBentoCard({
      icon: '🍂', label: '一起经历', value: stats.seasons, unit: '个季节',
    }));

    // Card: Cities
    grid.appendChild(makeBentoCard({
      icon: '📍', label: '一起去过', value: stats.cities, unit: '座城市',
    }));

    // Card: Photos
    grid.appendChild(makeBentoCard({
      icon: '📸', label: '拍过的照片', value: stats.photos, unit: '张回忆',
      colSpan: 2,
    }));

    // Card: Memories
    grid.appendChild(makeBentoCard({
      icon: '🎵', label: '收藏的记忆', value: stats.memories, unit: '个瞬间',
    }));

    // Card: High Moments
    grid.appendChild(makeBentoCard({
      icon: '💬', label: '重要的时刻', value: stats.highMoments, unit: '个节点',
      colSpan: 2,
    }));

    // Card: Memorable Moments
    const momentsCard = el('div', `bento-card col-span-4 reveal-blur`);
    momentsCard.appendChild(el('div', 'bento-icon', { text: '✨' }));
    momentsCard.appendChild(el('div', 'bento-card-label', { text: '最难忘的瞬间' }));

    const momentsRow = el('div', '', {
      style: { display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' },
    });
    highMemories.slice(0, 3).forEach((mem) => {
      const item = el('div', 'glass-card-sm', {
        style: { flex: '1', minWidth: '150px', textAlign: 'center' },
      });
      item.appendChild(el('p', '', {
        text: withDynamicDays(mem.title),
        style: { fontFamily: 'var(--font-cn)', color: 'var(--warm-gold-light)' },
      }));
      item.appendChild(el('p', 'body-sm', {
        text: withDynamicDays(mem.description).substring(0, 30) + '...',
        style: { marginTop: '0.25rem' },
      }));
      momentsRow.appendChild(item);
    });
    momentsCard.appendChild(momentsRow);
    grid.appendChild(momentsCard);

    // Card: Total count
    const totalCard = el('div', 'bento-card col-span-4 reveal-blur', {
      style: { textAlign: 'center' },
    });
    totalCard.appendChild(el('div', 'bento-card-label', { text: '已经走过' }));
    totalCard.appendChild(el('div', '', {
      text: formatDays(),
      style: { fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '200', color: 'var(--warm-gold)', lineHeight: '1', margin: '0.5rem 0' },
    }));
    totalCard.appendChild(el('div', 'bento-card-subtitle', {
      text: `\u4ece 2024.9.21 \u5f00\u59cb · \u7b2c ${formatDays()} \u5929`,
    }));
    grid.appendChild(totalCard);

    container.appendChild(grid);
  }

  // ==========================================
  // Good Times chapters (simple — photos + atmosphere)
  // ==========================================
  function renderGoodTimes(container, data) {
    // Good times chapters are primarily photo-driven.
    // The chapter header and photos (handled by renderChapterPhotos) carry the content.
    // Add a subtle atmosphere note if there's a quote
    if (data.quote) {
      const quoteCard = GlassCard(
        el('p', 'body-lg', {
          html: data.quote.replace(/\n/g, '<br>'),
          style: { color: 'var(--warm-gold-light)', fontStyle: 'italic', fontFamily: 'var(--font-cn)', textAlign: 'center' },
        }),
        { style: { maxWidth: '600px', margin: '2rem auto', textAlign: 'center' } }
      );
      container.appendChild(quoteCard);
    }
  }

  // ==========================================
  // Unexpected Challenge chapter (dark, emotional)
  // ==========================================
  function renderUnexpectedChallenge(container, data) {
    const card = GlassCard(
      el('div', 'reveal-stagger', {
        html: data.struggleLines ? data.struggleLines.map((line, i) => {
          const isLast = i === data.struggleLines.length - 1;
          const style = isLast
            ? 'margin-top:1.5rem;color:var(--warm-gold-light);font-weight:400'
            : 'color:var(--cinema-white-dim)';
          return `<p class="body-lg" style="${style}">${line}</p>`;
        }).join('') : '',
      }),
      { style: { maxWidth: '650px', margin: '0 auto' } }
    );
    container.appendChild(card);

    // Transition text (redemption moment)
    if (data.transitionText) {
      container.appendChild(el('p', 'reveal-blur body-sm', {
        text: data.transitionText,
        style: { textAlign: 'center', marginTop: '4rem', color: 'var(--warm-gold)', opacity: '0.7' },
      }));
    }
  }

  // ==========================================
  // Bento Card helper
  // ==========================================
  function makeBentoCard({ icon, label, value, unit, colSpan }) {
    const spanClass = colSpan ? `col-span-${colSpan}` : '';
    const card = el('div', `bento-card ${spanClass} reveal-blur`);

    card.appendChild(el('div', 'bento-icon', { text: icon }));
    card.appendChild(el('div', 'bento-card-label', { text: label }));
    card.appendChild(el('div', 'bento-card-value numbers', {
      'data-count': value,
      text: '0',
    }));
    card.appendChild(el('div', 'bento-card-subtitle', { text: unit }));

    return card;
  }

  // ==========================================
  // Render photos for a chapter
  // ==========================================
  function renderChapterPhotos(container, chapterId) {
    const chapterPhotos = D.getPhotosByChapter(chapterId);
    const chapter = D.getChapterById(chapterId);
    const showcase = el('section', `chapter-showcase showcase-${chapterId} reveal-blur`, {
      'data-photo-count': chapterPhotos.length,
    });

    const top = el('div', 'showcase-top');
    top.appendChild(el('div', '', {
      html: `
        <p class="showcase-kicker">Private Gallery</p>
        <h3>${getShowcaseTitle(chapterId)}</h3>
      `,
    }));
    top.appendChild(el('button', 'showcase-upload-button', {
      type: 'button',
      'data-upload-chapter': chapterId,
      'data-chapter-title': chapter?.title || chapterId,
      text: '添加照片',
    }));
    showcase.appendChild(top);

    if (!chapterPhotos.length) {
      showcase.appendChild(renderEmptyShowcase(chapterId));
    } else {
      const stage = el('div', `showcase-stage stage-${chapterId}`);
      chapterPhotos.forEach((photo, i) => {
        stage.appendChild(renderShowcasePhoto(photo, i));
      });
      showcase.appendChild(stage);
    }

    container.appendChild(showcase);
  }

  function getShowcaseTitle(chapterId) {
    const titles = {
      'growing-clear': '碎片里变清晰的我们',
      nanjing: '金陵电影胶片',
      announcement: '官宣光晕',
      'good-times-1': '日常礼物盒',
      'good-times-2': '雨后晴天照片墙',
      now: `${formatDays()} \u5929\u7eaa\u5ff5\u5c55\u5385`,
    };
    return titles[chapterId] || '照片展厅';
  }

  function renderEmptyShowcase(chapterId) {
    const empty = el('button', `showcase-empty empty-${chapterId}`, {
      type: 'button',
      'data-upload-chapter': chapterId,
    });
    empty.appendChild(el('span', 'empty-orbit'));
    empty.appendChild(el('span', 'empty-glass-title', { text: '为这一章添加一张记忆' }));
    empty.appendChild(el('span', 'empty-glass-subtitle', { text: '让照片、地点和那一句话一起留在这里' }));
    return empty;
  }

  function renderShowcasePhoto(photo, index) {
    const item = el('article', `showcase-photo-card reveal-blur photo-${photo.displayType || 'card'} ${photo.remote ? 'remote-photo' : 'json-photo'}`, {
      style: { '--i': index },
    });
    const media = el('div', 'showcase-photo-media', {
      style: {
        backgroundImage: `linear-gradient(180deg, rgba(6,6,9,0.04), rgba(6,6,9,0.34)), url(${photo.src})`,
      },
    });
    item.appendChild(media);

    const captionText = withDynamicDays(photo.caption || photo.title || '这一刻也在故事里');
    const metaText = [photo.date, photo.location].filter(Boolean).join(' · ');
    item.appendChild(el('div', 'floating-caption', {
      html: `
        ${photo.title ? `<p class="floating-caption-title">${escapeHtml(withDynamicDays(photo.title))}</p>` : ''}
        <p>${escapeHtml(captionText)}</p>
        ${metaText ? `<span>${escapeHtml(metaText)}</span>` : ''}
      `,
    }));

    return item;
  }

  // ==========================================
  // Component: MemoryTimeline
  // ==========================================
  function MemoryTimeline(memories) {
    const container = el('div', 'memory-timeline');
    const path = el('div', 'timeline-path reveal-text');
    const labelsRow = el('div', '', {
      style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--cinema-gray)', flexWrap: 'wrap', gap: '0.5rem' },
    });

    memories.forEach((mem, i) => {
      const pos = ((i + 1) / memories.length) * 100;
      path.appendChild(el('div', 'timeline-dot', {
        style: { left: `${pos}%` },
        'data-memory-id': mem.id,
      }));
      labelsRow.appendChild(el('span', 'reveal-text', { text: withDynamicDays(mem.title).substring(0, 8) }));
    });

    container.appendChild(path);
    container.appendChild(labelsRow);
    return container;
  }

  // ==========================================
  // Render entire page from data
  // ==========================================
  function renderAll() {
    if (!D.getStatus().isLoaded) {
      console.warn('[Renderer] Data not loaded yet. Call DataLoader.loadAll() first.');
      return;
    }

    const chapters = D.getAllChapters();

    // Find the main content area — the body's direct scroll content
    const body = document.body;

    // Chapters 1-5 are rendered into the main flow
    // Instead of replacing the entire HTML, we insert chapters after the hero
    const hero = document.getElementById('hero');
    if (!hero) {
      console.warn('[Renderer] Hero section not found, cannot render chapters.');
      return;
    }

    // Remove existing hardcoded chapters (if any) after hero
    let nextEl = hero.nextElementSibling;
    while (nextEl) {
      const toRemove = nextEl;
      nextEl = nextEl.nextElementSibling;
      if (toRemove.tagName === 'SECTION' && toRemove.id !== 'hero') {
        toRemove.remove();
      }
    }

    // Render each chapter
    chapters.forEach((chapterData) => {
      const section = ChapterSection(chapterData);
      body.appendChild(section);
    });

    // Render ending
    renderEnding();

    // Re-init observers after DOM update
    if (window.scrollManager && window.scrollManager.setupRevealText) {
      window.scrollManager.setupRevealText();
    }
  }

  // ==========================================
  // Render Ending
  // ==========================================
  function renderEnding() {
    const existingEnding = document.getElementById('ending');
    if (existingEnding) existingEnding.remove();

    const endingChapter = D.getChapterById('now');
    const endingData = endingChapter || { endingQuote: '故事还在继续。', endingSubtext: `谢谢你，陪我走过这 ${formatDays()} 天。` };

    const section = el('section', 'ending-section', { id: 'ending' });
    section.appendChild(el('div', 'ending-bg'));
    section.appendChild(el('div', 'ending-ascend-particles'));

    const inner = el('div', 'section-inner', { style: { textAlign: 'center' } });
    inner.appendChild(el('p', 'reveal-blur chapter-label', {
      text: 'To Be Continued',
      style: { marginBottom: '2rem' },
    }));
    inner.appendChild(el('h2', 'display-xl reveal-blur text-gradient-gold', {
      text: endingData.endingQuote || '故事还在继续。',
      style: { marginBottom: '2rem' },
    }));
    inner.appendChild(el('p', 'body-lg reveal-blur', {
      text: `${formatDays()} 天只是一个开始。还有更多的日子，更多的城市，更多的早安与晚安。`,
      style: { maxWidth: '500px', marginInline: 'auto', transitionDelay: '0.3s' },
    }));
    inner.appendChild(el('p', 'reveal-blur', {
      text: `谢谢你，陪我走过这 ${formatDays()} 天。`,
      style: { marginTop: '3rem', fontFamily: 'var(--font-cn)', fontSize: '1.25rem', color: 'var(--warm-gold)', opacity: '0.8', transitionDelay: '0.6s' },
    }));
    inner.appendChild(el('p', 'reveal-blur', {
      text: `— 我们的第 ${formatDays()} 天 —`,
      style: { marginTop: '1.5rem', fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--cinema-white-dim)', fontStyle: 'italic', transitionDelay: '0.8s' },
    }));
    inner.appendChild(el('div', 'reveal-blur', {
      html: `<p style="margin-top:5rem;opacity:0.4;font-size:0.75rem;color:var(--cinema-gray);transition-delay:1s">Made with love · Our ${formatDays()}th Day Anniversary</p>`,
    }));

    section.appendChild(inner);
    document.body.appendChild(section);
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    el,
    GlassCard,
    PhotoScene,
    ChapterSection,
    MemoryTimeline,
    renderAll,
    renderEnding,
    makeBentoCard,
    renderChapterPhotos,
  };
})();

window.Renderer = Renderer;
