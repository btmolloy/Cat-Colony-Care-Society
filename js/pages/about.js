CmsPage.init({
  sheetNames: ['About_E_Board', 'About_Mission', 'Campus_Cats'],
  loadedMessage: 'About page CMS content loaded.'
})
  .then(() => {
    renderMissionStory();
    renderBoardMembers();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);

function renderMissionStory() {
  const story = document.querySelector('[data-about-mission]');
  const template = story?.querySelector('template');
  const source = window.cmsArrays?.aboutmission;

  if (!story || !template || !source || typeof source !== 'object') {
    return;
  }

  story.querySelectorAll('[data-mission-entry]').forEach((entry) => entry.remove());

  const entriesByNumber = new Map();

  Object.entries(source).forEach(([key, value]) => {
    const match = key.match(/^(Image|Paragraph)(\d+)$/i);
    const content = String(value ?? '').trim();

    if (!match || !content) {
      return;
    }

    const number = Number(match[2]);
    const entry = entriesByNumber.get(number) || { number, image: '', paragraph: '' };

    if (match[1].toLowerCase() === 'image') {
      entry.image = content;
    } else {
      entry.paragraph = content;
    }

    entriesByNumber.set(number, entry);
  });

  const entries = Array.from(entriesByNumber.values())
    .sort((firstEntry, secondEntry) => firstEntry.number - secondEntry.number);
  let pairedEntryIndex = 0;

  entries.forEach((entry) => {
    const fragment = template.content.cloneNode(true);
    const row = fragment.querySelector('[data-mission-entry]');
    const photo = fragment.querySelector('[data-mission-photo]');
    const copyWrap = fragment.querySelector('[data-mission-copy-wrap]');
    const copy = fragment.querySelector('[data-mission-copy]');
    const hasImage = Boolean(entry.image);
    const hasParagraph = Boolean(entry.paragraph);

    if (hasImage && hasParagraph) {
      row.classList.add(pairedEntryIndex % 2 === 0 ? 'image-left' : 'image-right');
      pairedEntryIndex += 1;
    } else {
      row.classList.add(hasImage ? 'only-image' : 'only-copy');
    }

    photo.hidden = !hasImage;
    copyWrap.hidden = !hasParagraph;
    copy.textContent = entry.paragraph;
    CmsBinder.bind(fragment, { item: { Image: entry.image } });
    story.appendChild(fragment);
  });

  story.hidden = entries.length === 0;
}

function renderBoardMembers() {
  const board = document.querySelector('[data-board-members]');
  const template = board?.querySelector('template');
  const source = window.cmsArrays?.abouteboard;

  if (!board || !template || !source || typeof source !== 'object') {
    return;
  }

  board.querySelectorAll('[data-board-member]').forEach((member) => member.remove());

  const members = Object.entries(source)
    .map(([key, item], index) => ({
      item,
      order: Number(key.match(/(\d+)$/)?.[1] || index + 1)
    }))
    .filter(({ item }) => item && typeof item === 'object')
    .filter(({ item }) => [item.Name, item.Position, item.AboutParagraph].some((value) => String(value ?? '').trim()))
    .sort((firstMember, secondMember) => firstMember.order - secondMember.order);

  members.forEach(({ item }, index) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('[data-board-member]');
    const photo = fragment.querySelector('[data-board-photo]');
    const hasImage = Boolean(String(item.Image ?? '').trim());

    card.classList.toggle('has-image', hasImage);
    photo.hidden = !hasImage;
    CmsBinder.bind(fragment, { item, index });
    board.appendChild(fragment);
  });

  board.hidden = members.length === 0;
}
