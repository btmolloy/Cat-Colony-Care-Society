CmsPage.init({
  sheetNames: ['Go_Fund_Me'],
  loadedMessage: 'GoFundMe preview CMS content loaded.'
})
  .then(() => SiteInteractions.init())
  .catch(CmsPage.showError);
