CmsPage.init({
  sheetNames: ['About_E_Board', 'About_Mission', 'Call_To_Action'],
  loadedMessage: 'About page CMS content loaded.'
})
  .then(() => SiteInteractions.init())
  .catch(CmsPage.showError);
