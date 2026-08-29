const CmsTheme = (() => {
  const colorProperties = {
    PrimaryColor: '--brand-primary',
    SecondaryColor: '--brand-secondary',
    ThirdColor: '--brand-third',
    ForthColor: '--brand-fourth'
  };

  const imageProperties = {
    backgroundimage1: '--brand-image-1',
    backgroundimage2: '--brand-image-2',
    backgroundimage3: '--brand-image-3',
    backgroundimage4: '--brand-image-4',
    backgroundimage5: '--brand-image-5',
    backgroundimage6: '--brand-image-6'
  };

  function normalizeHexColor(value) {
    const normalizedValue = String(value || '').trim().replace(/^#/, '');

    if (/^[0-9a-f]{3}$/i.test(normalizedValue) || /^[0-9a-f]{6}$/i.test(normalizedValue)) {
      return `#${normalizedValue}`;
    }

    return '';
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

    return '';
  }

  function normalizeImageUrl(value) {
    const url = String(value || '').trim();
    const googleDriveFileId = getGoogleDriveFileId(url);

    if (googleDriveFileId) {
      return `https://lh3.googleusercontent.com/d/${googleDriveFileId}=w1800`;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return '';
  }

  function toCssUrl(value) {
    const escapedValue = value.replace(/(["\\])/g, '\\$1');
    return `url("${escapedValue}")`;
  }

  function apply(branding = {}) {
    const root = document.documentElement;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    Object.entries(colorProperties).forEach(([fieldName, propertyName]) => {
      const color = normalizeHexColor(branding[fieldName]);

      if (color) {
        root.style.setProperty(propertyName, color);

        if (fieldName === 'PrimaryColor' && themeColorMeta) {
          themeColorMeta.setAttribute('content', color);
        }
      }
    });

    Object.entries(imageProperties).forEach(([fieldName, propertyName]) => {
      const imageUrl = normalizeImageUrl(branding[fieldName]);

      if (imageUrl) {
        root.style.setProperty(propertyName, toCssUrl(imageUrl));
      }
    });

    root.dataset.themeReady = 'true';
  }

  function applyCached() {
    try {
      const rawCache = localStorage.getItem('cccsCmsSheet:v3:Site_Branding');

      if (!rawCache) {
        return;
      }

      const cachedSheet = JSON.parse(rawCache)?.parsedSheet;

      if (cachedSheet?.name === 'branding' && cachedSheet.value) {
        apply(cachedSheet.value);
      }
    } catch (error) {
      // A fresh CMS response will replace an unavailable or invalid cached theme.
    }
  }

  applyCached();

  return {
    apply
  };
})();
