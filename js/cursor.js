/* ========================================
   Cursor Glow Effect
   ======================================== */

class CursorEffect {
  constructor() {
    this.glow = document.querySelector('.cursor-glow');
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.targetX = this.mouseX;
    this.targetY = this.mouseY;

    if (this.isMobile()) return;
    this.init();
  }

  isMobile() {
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }

  init() {
    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.targetX = e.clientX;
      this.targetY = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      this.glow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      this.glow.style.opacity = '1';
    });
  }

  animate() {
    // Smooth interpolation for cinematic feel
    this.mouseX += (this.targetX - this.mouseX) * 0.05;
    this.mouseY += (this.targetY - this.mouseY) * 0.05;

    if (this.glow) {
      this.glow.style.setProperty('--mouse-x', `${this.mouseX}px`);
      this.glow.style.setProperty('--mouse-y', `${this.mouseY}px`);
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.cursorEffect = new CursorEffect();
});

/* ========================================
   Bento Card Hover Tilt Effect
   ======================================== */
function initBentoCardEffects() {
  const cards = document.querySelectorAll('.bento-card');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update gradient position CSS variable
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Subtle 3D tilt
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * 3;
      const rotateY = ((x - centerX) / centerX) * -3;

      card.style.transform = `translateY(-2px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    });
  });
}

window.addEventListener('DOMContentLoaded', initBentoCardEffects);
window.initBentoCardEffects = initBentoCardEffects;
