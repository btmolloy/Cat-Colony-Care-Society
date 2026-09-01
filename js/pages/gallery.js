CmsPage.init({
  sheetNames: ['Gallery'],
  loadedMessage: 'Gallery CMS content loaded.'
})
  .then(() => {
    GalleryPage.init();
    CalendarComponent.init();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);

const GalleryPage = (() => {
  const pageSize = 12;

  function init(root = document) {
    root.querySelectorAll('.gallery-grid[data-cms-repeat]').forEach((galleryGrid) => {
      if (galleryGrid.dataset.galleryReady === 'true') {
        return;
      }

      const items = Array.from(galleryGrid.querySelectorAll('.gallery-item[data-cms-repeat-item]'));

      galleryGrid.dataset.galleryReady = 'true';
      sortNewestFirst(galleryGrid, items);
      initPagination(galleryGrid);
    });
  }

  function sortNewestFirst(galleryGrid, items) {
    items
      .map((item, index) => ({
        date: getItemDate(item),
        index,
        item
      }))
      .sort((firstItem, secondItem) => {
        const firstTime = firstItem.date?.getTime() ?? Number.NEGATIVE_INFINITY;
        const secondTime = secondItem.date?.getTime() ?? Number.NEGATIVE_INFINITY;

        return secondTime - firstTime || firstItem.index - secondItem.index;
      })
      .forEach(({ item }) => galleryGrid.appendChild(item));
  }

  function getItemDate(item) {
    const dateElement = item.querySelector('[data-calendar-date]');
    const rawDate = dateElement?.getAttribute('datetime') || dateElement?.textContent || '';

    return CalendarComponent.parseEventDate(rawDate);
  }

  function initPagination(galleryGrid) {
    const items = Array.from(galleryGrid.querySelectorAll('.gallery-item[data-cms-repeat-item]'));
    const pagination = galleryGrid.parentElement?.querySelector('[data-gallery-pagination]');

    if (!pagination || !items.length) {
      return;
    }

    const pageNumbers = pagination.querySelector('[data-gallery-page-numbers]');
    const previousButton = pagination.querySelector('[data-gallery-previous]');
    const nextButton = pagination.querySelector('[data-gallery-next]');
    const status = pagination.querySelector('[data-gallery-page-status]');
    const totalPages = Math.ceil(items.length / pageSize);
    let currentPage = getPageFromUrl(totalPages);

    pagination.hidden = totalPages <= 1;
    buildPageButtons(pageNumbers, totalPages, (page) => showPage(page, true, true));

    function showPage(page, updateUrl = false, scrollToGrid = false) {
      const nextPage = clampPage(page, totalPages);
      const firstVisibleIndex = (nextPage - 1) * pageSize;
      const lastVisibleIndex = Math.min(firstVisibleIndex + pageSize, items.length);

      currentPage = nextPage;

      items.forEach((item, index) => {
        const isVisible = index >= firstVisibleIndex && index < lastVisibleIndex;

        item.hidden = !isVisible;

        if (isVisible) {
          window.requestAnimationFrame(() => item.classList.add('is-visible'));
        }
      });

      previousButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === totalPages;

      pageNumbers?.querySelectorAll('[data-gallery-page]').forEach((button) => {
        const isCurrent = Number(button.dataset.galleryPage) === currentPage;

        button.classList.toggle('is-current', isCurrent);

        if (isCurrent) {
          button.setAttribute('aria-current', 'page');
        } else {
          button.removeAttribute('aria-current');
        }
      });

      if (status) {
        status.textContent = `Showing photographs ${firstVisibleIndex + 1}–${lastVisibleIndex} of ${items.length}`;
      }

      if (updateUrl) {
        updatePageUrl(currentPage);
      }

      if (scrollToGrid) {
        scrollGalleryIntoView(galleryGrid);
      }
    }

    previousButton?.addEventListener('click', () => showPage(currentPage - 1, true, true));
    nextButton?.addEventListener('click', () => showPage(currentPage + 1, true, true));

    window.addEventListener('popstate', () => {
      showPage(getPageFromUrl(totalPages));
    });

    showPage(currentPage);
  }

  function buildPageButtons(container, totalPages, onSelect) {
    if (!container) {
      return;
    }

    container.replaceChildren();

    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement('button');

      button.type = 'button';
      button.dataset.galleryPage = String(page);
      button.textContent = String(page);
      button.setAttribute('aria-label', `Page ${page}`);
      button.addEventListener('click', () => onSelect(page));
      container.appendChild(button);
    }
  }

  function getPageFromUrl(totalPages) {
    const requestedPage = Number(new URL(window.location.href).searchParams.get('page'));

    return clampPage(Number.isInteger(requestedPage) ? requestedPage : 1, totalPages);
  }

  function clampPage(page, totalPages) {
    return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
  }

  function updatePageUrl(page) {
    const url = new URL(window.location.href);

    if (page === 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(page));
    }

    window.history.pushState({ galleryPage: page }, '', url);
  }

  function scrollGalleryIntoView(galleryGrid) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = galleryGrid.getBoundingClientRect().top + window.scrollY - 118;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  }

  return { init };
})();
