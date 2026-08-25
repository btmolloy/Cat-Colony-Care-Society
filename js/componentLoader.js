const ComponentLoader = (() => {
  const componentPaths = {
    header: 'components/header.html?v=4',
    footer: 'components/footer.html?v=4',
    calendar: 'components/calendar.html?v=4'
  };

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

  async function loadComponentElement(target) {
    const componentName = target.dataset.component;
    const componentPath = componentPaths[componentName];

    if (!componentPath) {
      return;
    }

    target.innerHTML = await getText(componentPath);
  }

  async function loadSharedComponents() {
    const componentTargets = Array.from(document.querySelectorAll('[data-component]'));

    if (componentTargets.length) {
      await Promise.all(componentTargets.map(loadComponentElement));
      return;
    }

    await Promise.all([
      loadComponent('[data-component="header"]', componentPaths.header),
      loadComponent('[data-component="footer"]', componentPaths.footer)
    ]);
  }

  return {
    loadSharedComponents
  };
})();
