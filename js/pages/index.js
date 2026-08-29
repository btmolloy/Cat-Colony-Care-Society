CmsPage.init({
  sheetNames: ['Landing_Carousel', 'Call_To_Action', 'Meeting_Calendar', 'Gallery', 'Campus_Cats'],
  loadedMessage: 'Homepage CMS content loaded.'
})
  .then(() => {
    document.querySelectorAll('.hero-glass').forEach((highlight, index) => {
      highlight.hidden = index !== 0;
    });

    CalendarComponent.init();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);
