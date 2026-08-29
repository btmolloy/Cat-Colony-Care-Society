CmsPage.init({
  sheetNames: ['Call_To_Action', 'Go_Fund_Me'],
  loadedMessage: 'Get involved CMS content loaded.'
})
  .then(() => SiteInteractions.init())
  .catch(CmsPage.showError);
