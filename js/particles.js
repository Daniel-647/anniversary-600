/* ========================================
   Particle System - Ambient floating particles
   ======================================== */

class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    this.scrollY = 0;
    this.particleCount = this.isMobile() ? 40 : 100;

    this.init();
  }

  isMobile() {
    return window.innerWidth < 768;
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15 - 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.01 + 0.005,
        baseOpacity: Math.random() * 0.4 + 0.1,
        twinkle: Math.random() > 0.7,
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.tx = e.clientX / window.innerWidth;
      this.mouse.ty = e.clientY / window.innerHeight;
    });
    document.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
    }, { passive: true });
  }

  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Smooth mouse follow
    this.mouse.x += (this.mouse.tx - this.mouse.x) * 0.03;
    this.mouse.y += (this.mouse.ty - this.mouse.y) * 0.03;

    this.particles.forEach((p, i) => {
      // Subtle mouse attraction
      const dx = this.mouse.x * this.canvas.width - p.x;
      const dy = this.mouse.y * this.canvas.height - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300) {
        p.speedX += (dx / dist) * 0.003;
        p.speedY += (dy / dist) * 0.003;
      }

      // Update position
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.x < -20) p.x = this.canvas.width + 20;
      if (p.x > this.canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.canvas.height + 20;
      if (p.y > this.canvas.height + 20) p.y = -20;

      // Damping
      p.speedX *= 0.999;
      p.speedY *= 0.999;

      // Twinkling
      p.pulse += p.pulseSpeed;
      p.opacity = p.baseOpacity + Math.sin(p.pulse) * 0.15;

      // Draw
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      // Color shifts based on scroll position (colder at top, warmer later)
      const scrollProgress = Math.min(this.scrollY / 4000, 1);
      const r = 201 + scrollProgress * 30;
      const g = 169 + scrollProgress * 30;
      const b = 110 + scrollProgress * 50;

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, p.opacity)})`;
      this.ctx.fill();

      // Glow for some particles
      if (p.twinkle && p.opacity > 0.3) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.1})`;
        this.ctx.fill();
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.particleSystem = new ParticleSystem();
});
