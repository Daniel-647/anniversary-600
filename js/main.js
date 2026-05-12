/* ========================================
   600 Days Anniversary — Main Orchestration
   Cinematic timeline, hero animation, chapter reveals
   ======================================== */

(function () {
  'use strict';

  // ==========================================
  // Hero Cinematic Intro
  // ==========================================
  function initHero() {
    const subtitle = document.querySelector('.hero-subtitle');
    const title = document.querySelector('.hero-title');
    const number = document.querySelector('.hero-number');
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');

    if (!subtitle || !title || !number) return;

    // Phase 1: Subtitle fades in (like a film opening)
    setTimeout(() => {
      subtitle.style.transition = 'opacity 1.5s ease, transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
      subtitle.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        subtitle.style.opacity = '1';
        subtitle.style.transform = 'translateY(0)';
      });
    }, 600);

    // Phase 2: Title fades in with blur
    setTimeout(() => {
      title.style.transition = 'opacity 1.8s ease, filter 1.8s ease';
      title.style.filter = 'blur(8px)';
      title.style.opacity = '0';
      requestAnimationFrame(() => {
        title.style.opacity = '1';
        setTimeout(() => {
          title.style.filter = 'blur(0)';
        }, 50);
      });
    }, 1800);

    // Phase 3: The number "600" appears — slowly scales up with glow
    setTimeout(() => {
      number.style.transition = 'opacity 2s ease, transform 2.5s cubic-bezier(0.16, 1, 0.3, 1)';
      number.style.transform = 'scale(0.85)';
      number.style.opacity = '0';
      requestAnimationFrame(() => {
        number.style.opacity = '1';
        number.style.transform = 'scale(1)';
      });
    }, 3200);

    // Phase 4: Scroll indicator appears
    setTimeout(() => {
      if (scrollIndicator) {
        scrollIndicator.style.transition = 'opacity 1.2s ease';
        scrollIndicator.style.opacity = '1';
      }
    }, 5000);
  }

  // ==========================================
  // Cinematic Intersection Observer for Chapter Reveals
  // ==========================================
  function initCinematicReveals() {
    // Text reveals
    const revealTexts = document.querySelectorAll('.reveal-text');
    const revealBlurs = document.querySelectorAll('.reveal-blur');

    const textObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    revealTexts.forEach((el) => textObserver.observe(el));
    revealBlurs.forEach((el) => textObserver.observe(el));

    // Glass cards — reveal with stagger
    const glassCards = document.querySelectorAll('.glass-card, .glass-card-sm');
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.transition =
                'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, i * 150);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Initialize glass cards as hidden
    glassCards.forEach((card) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px)';
      cardObserver.observe(card);
    });

    // Chapter section bg color transitions
    const chapters = document.querySelectorAll('.section');
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add subtle class-based ambient changes
            entry.target.style.transition = 'background-color 2s ease';
          }
        });
      },
      { threshold: 0.3 }
    );

    chapters.forEach((ch) => sectionObserver.observe(ch));
  }

  // ==========================================
  // Chat Bubbles Reveal (Chapter 1)
  // ==========================================
  function initChatBubbles() {
    const bubbles = document.querySelectorAll('.chat-bubble');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.transition =
                'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, i * 300);
          }
        });
      },
      { threshold: 0.5 }
    );

    bubbles.forEach((bubble) => {
      bubble.style.transform = 'translateY(20px)';
      observer.observe(bubble);
    });
  }

  // ==========================================
  // Fracture Lines Animation (Chapter 2)
  // ==========================================
  function initFractureLines() {
    const lines = document.querySelectorAll('.fracture-line');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          lines.forEach((line, i) => {
            setTimeout(() => {
              line.style.transition = 'height 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
              line.style.height = `${60 + Math.random() * 200}px`;
            }, i * 200);
          });
        }
      },
      { threshold: 0.3 }
    );

    if (lines.length > 0) {
      observer.observe(lines[0].parentElement);
    }
  }

  // ==========================================
  // Snowflakes (Chapter 3 — Nanjing)
  // ==========================================
  function initSnowflakes() {
    const container = document.querySelector('.chapter-nanjing .section-bg');
    if (!container) return;

    const snowflakeCount = 60;

    for (let i = 0; i < snowflakeCount; i++) {
      const flake = document.createElement('div');
      flake.classList.add('snowflake');
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.top = `${Math.random() * 100}%`;
      flake.style.width = `${Math.random() * 2.5 + 1}px`;
      flake.style.height = flake.style.width;
      flake.style.animationDelay = `${Math.random() * 8}s`;
      flake.style.setProperty('--drift', `${(Math.random() - 0.5) * 100}px`);
      container.appendChild(flake);

      // Animate each flake
      animateSnowflake(flake, Math.random() * 8000 + 6000);
    }
  }

  function animateSnowflake(flake, duration) {
    const startY = parseFloat(flake.style.top);
    const startX = parseFloat(flake.style.left);
    const drift = parseFloat(flake.style.getPropertyValue('--drift'));

    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      const y = startY + progress * 100;
      const x = startX + Math.sin(progress * Math.PI * 3) * (drift / 100);

      flake.style.top = `${y > 100 ? -5 : y}%`;
      flake.style.left = `${x}%`;
      flake.style.opacity = Math.sin(progress * Math.PI);
      flake.style.opacity = Math.max(0, Math.min(0.7, flake.style.opacity));

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // ==========================================
  // Bloom Light Animation (Chapter 4)
  // ==========================================
  function initBloomLights() {
    const lights = document.querySelectorAll('.bloom-light');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          lights.forEach((light, i) => {
            setTimeout(() => {
              light.style.transition = 'opacity 2s ease';
              light.style.opacity = '0.6';
              // Pulsing
              setInterval(() => {
                light.style.opacity = (0.4 + Math.random() * 0.3).toString();
              }, 3000 + i * 1000);
            }, i * 400);
          });
        }
      },
      { threshold: 0.3 }
    );

    if (lights.length > 0) {
      observer.observe(lights[0].parentElement);
    }
  }

  // ==========================================
  // Hero Stars Canvas
  // ==========================================
  function initHeroStars() {
    const container = document.querySelector('.hero-stars');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const stars = [];
    const starCount = 200;

    function resize() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Create stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.6 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.05,
      });
    }

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      stars.forEach((star) => {
        // Subtle drift
        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Twinkle
        const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset);
        const opacity = star.opacity * (0.5 + twinkle * 0.5);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 228, 225, ${opacity})`;
        ctx.fill();

        // Glow for brighter stars
        if (twinkle > 0.7) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(201, 169, 110, ${opacity * 0.1})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(draw);
    }

    draw();
  }

  // ==========================================
  // Bento Dashboard Number Counter Animation
  // ==========================================
  function initNumberCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            const duration = 2000;
            const startTime = performance.now();

            function update(now) {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out expo
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              const current = Math.round(eased * target);

              el.textContent = current.toLocaleString();

              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                el.textContent = target.toLocaleString();
              }
            }

            requestAnimationFrame(update);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  // ==========================================
  // Ending: Ascending Particles
  // ==========================================
  function initEndingParticles() {
    const container = document.querySelector('.ending-ascend-particles');
    if (!container) return;

    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 80;
    let activated = false;

    function resize() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Create initial particles at bottom
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        wobble: Math.random() * 0.5,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          activated = true;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      particles.forEach((p) => {
        if (activated) {
          // Rise upward
          p.y -= p.speed;
          p.x += Math.sin(time * p.wobbleSpeed * 60) * p.wobble;

          // Reset to bottom when reaching top
          if (p.y < p.size * -2) {
            p.y = canvas.height + Math.random() * 50;
            p.x = Math.random() * canvas.width;
          }
        }

        // Fade near top and bottom
        let fadeOpacity = p.opacity;
        if (p.y < canvas.height * 0.15) {
          fadeOpacity = p.opacity * (p.y / (canvas.height * 0.15));
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${fadeOpacity})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${fadeOpacity * 0.08})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }

  // ==========================================
  // Audio Toggle
  // ==========================================
  function initAudioToggle() {
    const toggle = document.querySelector('.audio-toggle');
    const icon = toggle?.querySelector('.audio-icon');
    if (!toggle || !icon) return;

    let isPlaying = false;
    icon.textContent = '♪';

    toggle.addEventListener('click', () => {
      isPlaying = !isPlaying;
      icon.textContent = isPlaying ? '🔊' : '🔇';
      toggle.style.borderColor = isPlaying
        ? 'rgba(201, 169, 110, 0.4)'
        : 'rgba(232, 228, 225, 0.15)';

      // Audio hook — ready for integration
      if (window.audioPlayer) {
        if (isPlaying) {
          window.audioPlayer.play();
        } else {
          window.audioPlayer.pause();
        }
      }
    });
  }

  // ==========================================
  // Photo Scene Animations — observe data-driven photo containers
  // ==========================================
  function initPhotoSceneAnimations() {
    const photoScenes = document.querySelectorAll('.photo-scene-container');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Also mark parent photo-card as visible
            const parentCard = entry.target.closest('.photo-card');
            if (parentCard) parentCard.classList.add('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );

    photoScenes.forEach((scene) => observer.observe(scene));
  }

  // ==========================================
  // ==========================================
  function reinitAnimationObservers() {
    setTimeout(() => {
      initCinematicReveals();
      initChatBubbles();
      initFractureLines();
      initSnowflakes();
      initBloomLights();
      initNumberCounters();
      initEndingParticles();
      initPhotoSceneAnimations();
    }, 100);
  }

  window.reinitAnniversaryAnimations = reinitAnimationObservers;

  // ==========================================
  // Boot Sequence — async, data-driven
  // ==========================================
  async function boot() {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => { loader.classList.add('fade-out'); }, 800);
    }
    initHeroStars();
    initHero();
    initAudioToggle();
    if (window.DataLoader && window.Renderer) {
      try {
        const loaded = await window.DataLoader.loadAll();
        if (loaded) {
          window.Renderer.renderAll();
          reinitAnimationObservers();
        }
      } catch (err) {
        console.error('[Boot] Error:', err);
      }
    }
    document.querySelectorAll('img[data-src]').forEach((img) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });
      observer.observe(img);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
