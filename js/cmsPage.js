const CmsPage = (() => {
  const sharedSheetNames = ['Contact', 'Site_Branding'];

  function unique(values) {
    return Array.from(new Set(values));
  }

  async function init(options = {}) {
    const pageSheetNames = options.sheetNames || [];
    const sheetNames = unique([...sharedSheetNames, ...pageSheetNames]);

    console.info(`Loading CMS sheets: ${sheetNames.join(', ')}`);
    await ComponentLoader.loadSharedComponents();
    markActiveNavLink();
    await CmsCache.loadPageContent(sheetNames);
    CmsTheme.apply(window.cmsArrays?.branding);
    CmsBinder.bind(document);
    console.info(options.loadedMessage || 'CMS content loaded.');
  }

  function markActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const href = link.getAttribute('href');
      const aliases = String(link.dataset.navAlias || '')
        .split(/[\s,]+/)
        .map((alias) => alias.trim())
        .filter(Boolean);
      const isActive = href === currentPage || aliases.includes(currentPage);

      if (isActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  function showError(error) {
    console.error('Failed to load CMS content:', error);
  }

  return {
    init,
    showError
  };
})();
