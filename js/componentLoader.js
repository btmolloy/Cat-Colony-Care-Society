const ComponentLoader = (() => {
  function getText(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.onload = () => {
        if ((request.status >= 200 && request.status < 300) || (request.status === 0 && request.responseText)) {
          resolve(request.responseText);
          return;
        }

        reject(new Error(`Could not load ${url}.`));
      };
      request.onerror = () => reject(new Error(`Could not load ${url}.`));
      request.send();
    });
  }

  async function loadComponent(targetSelector, componentPath) {
    const target = document.querySelector(targetSelector);

    if (!target) {
      return;
    }

    target.innerHTML = await getText(componentPath);
  }

  async function loadSharedComponents() {
    await Promise.all([
      loadComponent('[data-component="header"]', 'components/header.html'),
      loadComponent('[data-component="footer"]', 'components/footer.html')
    ]);
  }

  return {
    loadSharedComponents
  };
})();
