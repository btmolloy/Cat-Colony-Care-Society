CmsPage.init({
  sheetNames: ['Events', 'Meeting_Calendar'],
  loadedMessage: 'Events CMS content loaded.'
})
  .then(() => {
    CalendarComponent.init();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);
