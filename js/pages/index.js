CmsPage.init({
  sheetNames: ['Landing_Carousel', 'Call_To_Action', 'Go_Fund_Me', 'Club_Rules'],
  loadedMessage: 'Homepage CMS content loaded.'
})
  .then(() => {
    document.querySelectorAll('.hero-glass').forEach((highlight, index) => {
      highlight.hidden = index !== 0;
    });

    renderClubRules();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);

function renderClubRules() {
  const rulesContainer = document.querySelector('[data-club-rules]');
  const template = rulesContainer?.querySelector('template');
  const rulesSource = window.cmsArrays?.clubrules;

  if (!rulesContainer || !template || !rulesSource || typeof rulesSource !== 'object') {
    return;
  }

  rulesContainer.querySelectorAll('[data-club-rule]').forEach((rule) => rule.remove());

  const rules = Object.entries(rulesSource)
    .map(([key, value]) => {
      const match = key.match(/^Rule(\d+)$/i);

      return match && String(value ?? '').trim()
        ? { number: Number(match[1]), text: String(value).trim() }
        : null;
    })
    .filter(Boolean)
    .sort((firstRule, secondRule) => firstRule.number - secondRule.number);

  rules.forEach((rule, index) => {
    const fragment = template.content.cloneNode(true);
    const number = fragment.querySelector('[data-rule-number]');
    const copy = fragment.querySelector('[data-rule-copy]');

    number.textContent = String(index + 1).padStart(2, '0');
    copy.textContent = rule.text;
    rulesContainer.appendChild(fragment);
  });

  rulesContainer.hidden = rules.length === 0;
}
