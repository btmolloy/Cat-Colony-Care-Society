const SiteInteractions = (() => {
  const mobileBreakpoint = 840;

  function init(root = document) {
    updateDocumentTitle();
    initHeaders(root);
    initNavigation(root);
    initCarousels(root);
    initReveals(root);
  }

  function updateDocumentTitle() {
    const titlePath = document.body?.dataset.titlePath;

    if (!titlePath || typeof CmsBinder === 'undefined') {
      return;
    }

    const pageTitle = cleanText(CmsBinder.resolvePath(titlePath));
    const brandTitle = cleanText(CmsBinder.resolvePath(document.body.dataset.titleBrandPath || 'branding.Title'));

    if (!pageTitle) {
      return;
    }

    document.title = brandTitle && brandTitle.toLowerCase() !== pageTitle.toLowerCase()
      ? `${pageTitle} | ${brandTitle}`
      : pageTitle;
  }

  function initHeaders(root) {
    root.querySelectorAll('[data-header]').forEach((header) => {
      if (header.dataset.headerReady === 'true') {
        return;
      }

      const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);

      header.dataset.headerReady = 'true';
      updateHeader();
      window.addEventListener('scroll', updateHeader, { passive: true });
    });
  }

  function initNavigation(root) {
    root.querySelectorAll('.menu-toggle').forEach((menuButton) => {
      if (menuButton.dataset.menuReady === 'true') {
        return;
      }

      const navigationId = menuButton.getAttribute('aria-controls');
      const primaryNav = navigationId ? document.getElementById(navigationId) : null;

      if (!primaryNav) {
        return;
      }

      const setMenuOpen = (isOpen) => {
        menuButton.setAttribute('aria-expanded', String(isOpen));
        primaryNav.classList.toggle('is-open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
      };

      menuButton.dataset.menuReady = 'true';
      setMenuOpen(false);
      menuButton.addEventListener('click', () => {
        setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
      });

      primaryNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
          setMenuOpen(false);
          menuButton.focus();
        }
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > mobileBreakpoint && menuButton.getAttribute('aria-expanded') === 'true') {
          setMenuOpen(false);
        }
      }, { passive: true });
    });
  }

  function initCarousels(root) {
    root.querySelectorAll('[data-carousel]').forEach((carousel, carouselIndex) => {
      if (carousel.dataset.carouselReady === 'true') {
        return;
      }

      const slides = Array.from(carousel.querySelectorAll('[data-slide]'));
      const controls = carousel.querySelector('[data-carousel-controls], .carousel-controls');

      if (!slides.length) {
        controls?.replaceChildren();
        return;
      }

      const tabs = buildCarouselTabs(controls, slides, carouselIndex);
      let activeIndex = 0;

      const setSlide = (nextIndex, options = {}) => {
        activeIndex = (nextIndex + slides.length) % slides.length;

        slides.forEach((slide, index) => {
          const isActive = index === activeIndex;

          slide.classList.toggle('is-active', isActive);
          slide.setAttribute('aria-hidden', String(!isActive));
        });

        tabs.forEach((tab, index) => {
          const isActive = index === activeIndex;

          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
          tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        if (options.focusTab) {
          tabs[activeIndex]?.focus();
        }
      };

      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => setSlide(index));
      });

      carousel.addEventListener('keydown', (event) => {
        let nextIndex = null;

        if (event.key === 'ArrowRight') {
          nextIndex = activeIndex + 1;
        } else if (event.key === 'ArrowLeft') {
          nextIndex = activeIndex - 1;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = slides.length - 1;
        }

        if (nextIndex === null) {
          return;
        }

        event.preventDefault();
        setSlide(nextIndex, { focusTab: true });
      });

      carousel.dataset.carouselReady = 'true';
      setSlide(0);
    });
  }

  function buildCarouselTabs(controls, slides, carouselIndex) {
    if (!controls) {
      return [];
    }

    controls.replaceChildren();

    return slides.map((slide, slideIndex) => {
      const slideId = slide.id || `featured-slide-${carouselIndex + 1}-${slideIndex + 1}`;
      const title = cleanText(slide.querySelector('[data-slide-title], .hero-title')?.textContent);
      const tab = document.createElement('button');

      slide.id = slideId;
      tab.className = 'carousel-tab';
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', slideId);
      tab.setAttribute('aria-label', title ? `Show ${title}` : `Show slide ${slideIndex + 1}`);
      tab.dataset.slideTo = String(slideIndex);
      tab.textContent = String(slideIndex + 1).padStart(2, '0');
      controls.appendChild(tab);

      return tab;
    });
  }

  function initReveals(root) {
    const revealItems = Array.from(root.querySelectorAll('[data-reveal]'))
      .filter((item) => item.dataset.revealReady !== 'true');

    if (!revealItems.length) {
      return;
    }

    revealItems.forEach((item) => {
      item.dataset.revealReady = 'true';
    });

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
  }

  function cleanText(value) {
    if (value === undefined || value === null) {
      return '';
    }

    return String(value).replace(/\s+/g, ' ').trim();
  }

  return {
    init
  };
})();
