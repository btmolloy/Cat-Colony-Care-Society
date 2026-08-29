const CmsBinder = (() => {
  function resolvePath(path, context = {}) {
    if (!path) {
      return undefined;
    }

    if (path === '$key') {
      return context.key;
    }

    if (path === '$index') {
      return Number.isInteger(context.index) ? context.index : undefined;
    }

    if (path === '$number') {
      return Number.isInteger(context.index) ? context.index + 1 : undefined;
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

  function isPlaceholderValue(value) {
    return /temporary[_\s-]*value[_\s-]*here/i.test(String(value || ''));
  }

  function normalizeHref(value) {
    const url = String(value || '').trim();

    if (!url || isPlaceholderValue(url)) {
      return '';
    }

    if (/^(?:https?:|mailto:|tel:|#|\/)/i.test(url) || /^[^.\/]+\.html(?:[?#].*)?$/i.test(url)) {
      return url;
    }

    if (/^[\w.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(url)) {
      return `https://${url}`;
    }

    return '';
  }

  function bindHref(element, context) {
    if (!element.dataset.cmsHref) {
      return;
    }

    const rawValue = resolvePath(element.dataset.cmsHref, context);

    if (element.dataset.cmsHref.startsWith('$item') && !context.item) {
      return;
    }

    const href = normalizeHref(rawValue);

    if (href) {
      element.setAttribute('href', href);
      element.removeAttribute('aria-disabled');
      element.classList.remove('is-placeholder');
      return;
    }

    element.removeAttribute('href');
    element.setAttribute('aria-disabled', 'true');
    element.classList.add('is-placeholder');
  }

  function bindMailto(element, context) {
    if (!element.dataset.cmsMailto) {
      return;
    }

    if (element.dataset.cmsMailto.startsWith('$item') && !context.item) {
      return;
    }

    const email = String(resolvePath(element.dataset.cmsMailto, context) || '').trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      element.removeAttribute('href');
      element.setAttribute('aria-disabled', 'true');
      return;
    }

    const parameters = new URLSearchParams();

    if (element.dataset.cmsMailtoSubject) {
      parameters.set('subject', element.dataset.cmsMailtoSubject);
    }

    if (element.dataset.cmsMailtoBody) {
      parameters.set('body', element.dataset.cmsMailtoBody);
    }

    const query = parameters.toString();
    element.setAttribute('href', `mailto:${email}${query ? `?${query}` : ''}`);
    element.removeAttribute('aria-disabled');
  }

  function isBindableImage(value) {
    const url = String(value || '').trim();

    return Boolean(url) && !/instagram\.com\/(?:p|reel)\//i.test(url) && !isPlaceholderValue(url);
  }

  function bindBackground(element, context) {
    if (!element.dataset.cmsBg) {
      return;
    }

    const rawValue = resolvePath(element.dataset.cmsBg, context);

    if (!isBindableImage(rawValue)) {
      return;
    }

    const imageUrl = normalizeImageSrc(rawValue);
    const propertyName = element.dataset.cmsBgVar || '--photo';
    const escapedImageUrl = imageUrl.replace(/(["\\])/g, '\\$1');

    element.style.setProperty(propertyName, `url("${escapedImageUrl}")`);
  }

  function bindCount(element, context) {
    if (!element.dataset.cmsCount) {
      return;
    }

    const value = resolvePath(element.dataset.cmsCount, context);
    const count = getRepeatItems(value).length;
    const singular = element.dataset.cmsCountSingular || '';
    const plural = element.dataset.cmsCountPlural || singular;
    const label = count === 1 ? singular : plural;

    element.textContent = `${count}${label ? ` ${label}` : ''}`;
  }

  function normalizeImageSrc(value) {
    const url = String(value).trim();
    const googleDriveFileId = getGoogleDriveFileId(url);

    if (googleDriveFileId) {
      return `https://lh3.googleusercontent.com/d/${googleDriveFileId}=w1200`;
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

    bindHref(element, context);
    bindMailto(element, context);
    bindAttribute(element, 'cmsSrc', 'src', context);
    bindAttribute(element, 'cmsAlt', 'alt', context);
    bindAttribute(element, 'cmsTitle', 'title', context);
    bindAttribute(element, 'cmsDatetime', 'datetime', context);
    bindAttribute(element, 'cmsContent', 'content', context);
    bindBackground(element, context);
    bindCount(element, context);
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

    root.querySelectorAll('[data-cms-text], [data-cms-html], [data-cms-href], [data-cms-mailto], [data-cms-src], [data-cms-alt], [data-cms-title], [data-cms-datetime], [data-cms-content], [data-cms-bg], [data-cms-count], [data-cms-first-class]').forEach((element) => {
      if (!context.item && element.closest('[data-cms-repeat-item]')) {
        return;
      }

      bindElement(element, context);
    });
  }

  return {
    bind,
    resolvePath
  };
})();
