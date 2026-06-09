CmsPage.init({
  sheetNames: ['Events', 'Meeting_Calendar'],
  loadedMessage: 'Events CMS content loaded.'
})
  .then(() => CalendarComponent.init())
  .catch(CmsPage.showError);
