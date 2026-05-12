/* ========================================
   Smooth Scroll & Scene Management
   Uses GSAP ScrollTrigger for cinematic scroll-driven animations
   Progress dots dynamically populated from chapter data
   ======================================== */

class ScrollManager {
  constructor() {
    this.progressDots = [];
    this.sectionIds = [];
    this.currentSection = 0;
    this.isAnimating = false;

    // Wait for DataLoader, then init
    this.waitForData();
  }

  waitForData() {
    if (window.DataLoader && window.DataLoader.getStatus().isLoaded) {
      this.buildSectionIds();
      this.init();
      return;
    }

    if (window.DataLoader) {
      window.DataLoader.onReady(() => {
        this.buildSectionIds();
        this.init();
      });
    } else {
      // Fallback: try after a short delay
      setTimeout(() => {
        this.buildSectionIds();
        this.init();
      }, 500);
    }
  }

  buildSectionIds() {
    // Always start with hero
    this.sectionIds = ['hero'];

    // Add chapter sections from data
    if (window.DataLoader && window.DataLoader.getStatus().isLoaded) {
      const chapters = window.DataLoader.getAllChapters();
      chapters.forEach((ch) => {
        this.sectionIds.push(`chapter-${ch.id}`);
      });
    } else {
      // Fallback: scan DOM for chapter sections
      document.querySelectorAll('[id^="chapter-"]').forEach((el) => {
        if (el.id !== 'chapters-container') {
          this.sectionIds.push(el.id);
        }
      });
    }

    // Always end with ending
    this.sectionIds.push('ending');
  }

  init() {
    this.createProgressDots();
    this.progressDots = document.querySelectorAll('.scroll-progress-dot');

    // Only init GSAP if available
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      this.setupScrollTriggers();
    } else {
      this.initBasic();
    }

    this.setupProgressDots();
    this.setupParallax();
    this.setupRevealText();

    // Section tracking on scroll
    window.addEventListener('scroll', () => {
      this.updateActiveSection();
    }, { passive: true });
  }

  initBasic() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('.reveal-text, .reveal-blur').forEach((el) => {
      observer.observe(el);
    });
  }

  createProgressDots() {
    const nav = document.getElementById('scroll-progress-nav');
    if (!nav) return;

    nav.innerHTML = '';
    this.sectionIds.forEach((id, i) => {
      const dot = document.createElement('div');
      dot.className = 'scroll-progress-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('data-section', i);
      nav.appendChild(dot);
    });
  }

  setupScrollTriggers() {
    // Hero section animation
    ScrollTrigger.create({
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.to('.hero-number', {
          scale: 1 + progress * 0.15,
          opacity: 1 - progress * 0.5,
          duration: 0,
        });
      },
    });

    // Parallax for all section backgrounds
    document.querySelectorAll('.section-bg').forEach((bg) => {
      ScrollTrigger.create({
        trigger: bg.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          gsap.to(bg, { y: self.progress * 100, duration: 0 });
        },
      });
    });
  }

  setupProgressDots() {
    this.progressDots = document.querySelectorAll('.scroll-progress-dot');
    this.progressDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const target = document.getElementById(this.sectionIds[i]);
        if (target) {
          this.scrollTo(target);
        }
      });
    });
  }

  setupParallax() {
    const rain = document.querySelector('.rain-overlay');
    if (rain) {
      window.addEventListener('scroll', () => {
        rain.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }, { passive: true });
    }
  }

  setupRevealText() {
    document.querySelectorAll('.reveal-stagger').forEach((container) => {
      const children = container.children;
      Array.from(children).forEach((child, i) => {
        child.style.transitionDelay = `${i * 0.1}s`;
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              Array.from(children).forEach((child) => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
              });
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(container);
    });
  }

  updateActiveSection() {
    let activeIndex = 0;
    const viewportMiddle = window.scrollY + window.innerHeight / 2;

    this.sectionIds.forEach((id, i) => {
      const section = document.getElementById(id);
      if (section) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = sectionTop + rect.height;
        if (viewportMiddle >= sectionTop && viewportMiddle < sectionBottom) {
          activeIndex = i;
        }
      }
    });

    if (activeIndex !== this.currentSection) {
      this.currentSection = activeIndex;
      this.updateDots();
    }
  }

  updateDots() {
    const dots = document.querySelectorAll('.scroll-progress-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentSection);
    });
  }

  scrollTo(target) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    if (typeof gsap !== 'undefined') {
      gsap.to(window, {
        scrollTo: {
          y: target,
          offsetY: 0,
        },
        duration: 1.2,
        ease: 'power3.inOut',
        onComplete: () => { this.isAnimating = false; },
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { this.isAnimating = false; }, 1200);
    }
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.scrollManager = new ScrollManager();
});
