const CmsPage = (() => {
  const sharedSheetNames = ['Contact', 'Site_Branding'];

  function unique(values) {
    return Array.from(new Set(values));
  }

  async function init(options = {}) {
    const status = document.getElementById('cms-status');
    const pageSheetNames = options.sheetNames || [];
    const sheetNames = unique([...sharedSheetNames, ...pageSheetNames]);

    await ComponentLoader.loadSharedComponents();
    markActiveNavLink();
    await CmsCache.loadPageContent(sheetNames);
    CmsBinder.bind(document);

    if (status) {
      status.textContent = options.loadedMessage || 'CMS content loaded.';
      status.classList.remove('alert-secondary');
      status.classList.add('alert-success');
    }
  }

  function markActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const href = link.getAttribute('href');

      if (href === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  function showError(error) {
    const status = document.getElementById('cms-status');

    if (status) {
      status.textContent = `Failed to load CMS content: ${error.message}`;
      status.classList.remove('alert-secondary');
      status.classList.add('alert-danger');
    }
  }

  return {
    init,
    showError
  };
})();
