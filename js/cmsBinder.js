const CmsBinder = (() => {
  function resolvePath(path, context = {}) {
    if (!path) {
      return undefined;
    }

    if (path === '$key') {
      return context.key;
    }

    if (path === '$index') {
      return context.index;
    }

    if (path === '$number') {
      return context.index + 1;
    }

    if (path.startsWith('$item.')) {
      return getNestedValue(context.item, path.slice(6));
    }

    if (path === '$item') {
      return context.item;
    }

    return getNestedValue(window.cmsArrays || {}, path);
  }

  function getNestedValue(source, path) {
    return path.split('.').reduce((value, key) => {
      if (value === undefined || value === null) {
        return undefined;
      }

      return value[key];
    }, source);
  }

  function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
  }

  function bindText(element, context) {
    const value = resolvePath(element.dataset.cmsText, context);

    if (hasValue(value)) {
      element.textContent = value;
    }
  }

  function bindHtml(element, context) {
    const value = resolvePath(element.dataset.cmsHtml, context);

    if (hasValue(value)) {
      element.innerHTML = value;
    }
  }

  function bindAttribute(element, datasetKey, attributeName, context) {
    let value = resolvePath(element.dataset[datasetKey], context);

    if (hasValue(value)) {
      if (attributeName === 'src') {
        value = normalizeImageSrc(value);
      }

      element.setAttribute(attributeName, value);
    }
  }

  function normalizeImageSrc(value) {
    const url = String(value).trim();
    const googleDriveFileId = getGoogleDriveFileId(url);

    if (googleDriveFileId) {
      return `https://drive.google.com/thumbnail?id=${googleDriveFileId}&sz=w1200`;
    }

    return url;
  }

  function getGoogleDriveFileId(url) {
    const filePathMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);

    if (filePathMatch) {
      return filePathMatch[1];
    }

    const queryIdMatch = url.match(/[?&]id=([^&]+)/);

    if (url.includes('drive.google.com') && queryIdMatch) {
      return queryIdMatch[1];
    }

    return null;
  }

  function bindFirstClass(element, context) {
    const className = element.dataset.cmsFirstClass;

    if (className && context.index === 0) {
      element.classList.add(className);
    }
  }

  function bindElement(element, context = {}) {
    if (element.dataset.cmsText) {
      bindText(element, context);
    }

    if (element.dataset.cmsHtml) {
      bindHtml(element, context);
    }

    bindAttribute(element, 'cmsHref', 'href', context);
    bindAttribute(element, 'cmsSrc', 'src', context);
    bindAttribute(element, 'cmsAlt', 'alt', context);
    bindAttribute(element, 'cmsTitle', 'title', context);
    bindFirstClass(element, context);
  }

  function getRepeatItems(value) {
    if (Array.isArray(value)) {
      return value.map((item, index) => ({ key: String(index), item }));
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    return Object.entries(value)
      .filter(([, item]) => item && typeof item === 'object')
      .filter(([, item]) => item.display !== false)
      .map(([key, item]) => ({ key, item }));
  }

  function bindRepeater(repeater) {
    const template = repeater.querySelector('template');
    const repeatSource = resolvePath(repeater.dataset.cmsRepeat);

    if (!template) {
      return;
    }

    repeater.querySelectorAll('[data-cms-repeat-item]').forEach((element) => element.remove());

    getRepeatItems(repeatSource).forEach(({ key, item }, index) => {
      const fragment = template.content.cloneNode(true);
      const context = { key, item, index };

      Array.from(fragment.children).forEach((element) => {
        element.dataset.cmsRepeatItem = 'true';
      });

      bind(fragment, context);
      repeater.appendChild(fragment);
    });
  }

  function bind(root = document, context = {}) {
    root.querySelectorAll('[data-cms-repeat]').forEach(bindRepeater);

    root.querySelectorAll('[data-cms-text], [data-cms-html], [data-cms-href], [data-cms-src], [data-cms-alt], [data-cms-title], [data-cms-first-class]').forEach((element) => {
      bindElement(element, context);
    });
  }

  return {
    bind,
    resolvePath
  };
})();
