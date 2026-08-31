CmsPage.init({
  sheetNames: ['Landing_Carousel', 'Call_To_Action', 'Go_Fund_Me', 'Club_Rules'],
  loadedMessage: 'Homepage CMS content loaded.'
})
  .then(() => {
    document.querySelectorAll('.hero-glass').forEach((highlight, index) => {
      highlight.hidden = index !== 0;
    });
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);
