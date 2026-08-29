CmsPage.init({
  sheetNames: ['Gallery'],
  loadedMessage: 'Gallery CMS content loaded.'
})
  .then(() => {
    CalendarComponent.init();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);
