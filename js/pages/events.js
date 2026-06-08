CmsPage.init({
  sheetNames: ['Events', 'Meeting_Calendar'],
  loadedMessage: 'Events CMS content loaded.'
}).catch(CmsPage.showError);
