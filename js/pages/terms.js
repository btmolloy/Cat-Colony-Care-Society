CmsPage.init({
  loadedMessage: 'Terms page CMS content loaded.'
})
  .then(() => SiteInteractions.init())
  .catch(CmsPage.showError);
