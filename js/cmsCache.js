const CmsCache = (() => {
  const cacheKeyPrefix = 'cccsCmsSheet:';
  const defaultCacheMinutes = 10;

  function getCacheKey(sheetName) {
    return `${cacheKeyPrefix}${sheetName}`;
  }

  function readSheet(sheetName, cacheMinutes = defaultCacheMinutes) {
    const rawCache = localStorage.getItem(getCacheKey(sheetName));

    if (!rawCache) {
      return null;
    }

    try {
      const cached = JSON.parse(rawCache);
      const cacheAge = Date.now() - cached.savedAt;
      const cacheMaxAge = cacheMinutes * 60 * 1000;

      if (cacheAge > cacheMaxAge) {
        return null;
      }

      return cached.parsedSheet;
    } catch (error) {
      return null;
    }
  }

  function writeSheet(sheetName, parsedSheet) {
    localStorage.setItem(getCacheKey(sheetName), JSON.stringify({
      savedAt: Date.now(),
      parsedSheet
    }));
  }

  async function getSheet(sheetName, options = {}) {
    const cacheMinutes = options.cacheMinutes ?? defaultCacheMinutes;
    const forceRefresh = options.forceRefresh ?? false;
    const cachedSheet = forceRefresh ? null : readSheet(sheetName, cacheMinutes);

    if (cachedSheet) {
      return cachedSheet;
    }

    const parsedSheet = await CmsContentLoader.loadParsedSheet(sheetName);
    writeSheet(sheetName, parsedSheet);
    return parsedSheet;
  }

  async function loadPageContent(sheetNames, options = {}) {
    const cmsArrays = {};

    for (const sheetName of sheetNames) {
      const parsedSheet = await getSheet(sheetName, options);
      cmsArrays[parsedSheet.name] = parsedSheet.value;
    }

    window.cmsArrays = {
      ...(window.cmsArrays || {}),
      ...cmsArrays
    };

    Object.assign(window, cmsArrays);
    return cmsArrays;
  }

  function clear() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(cacheKeyPrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  return {
    loadPageContent,
    clear
  };
})();
