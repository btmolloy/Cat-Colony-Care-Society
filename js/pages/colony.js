CmsPage.init({
  sheetNames: ['Campus_Cats'],
  loadedMessage: 'Colony CMS content loaded.'
})
  .then(() => SiteInteractions.init())
  .catch(CmsPage.showError);
