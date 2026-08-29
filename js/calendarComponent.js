const CalendarComponent = (() => {
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
  const shortMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const compactDateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  function init(options = {}) {
    const root = options.root || document;

    formatDateElements(root);
    initCalendarDownloads(root);
  }

  function formatDateElements(root) {
    root.querySelectorAll('[data-calendar-date], .event-date, .date-block').forEach((element) => {
      if (element.dataset.calendarFormatted === 'true') {
        return;
      }

      const rawDate = getRawDate(element);
      const date = parseEventDate(rawDate);

      element.dataset.calendarRawDate = rawDate;
      element.dataset.calendarFormatted = 'true';

      if (!date) {
        return;
      }

      const style = element.dataset.calendarDateStyle
        || (element.classList.contains('date-block') ? 'block' : 'row');

      element.setAttribute('datetime', toIsoDate(date));
      renderDate(element, date, style);
    });
  }

  function renderDate(element, date, style) {
    if (style === 'block') {
      const day = document.createElement('strong');
      const month = document.createElement('span');

      day.textContent = String(date.getDate());
      month.textContent = shortMonthFormatter.format(date).toUpperCase();
      element.replaceChildren(day, month);
      return;
    }

    if (style === 'full') {
      element.textContent = fullDateFormatter.format(date);
      return;
    }

    if (style === 'compact') {
      element.textContent = compactDateFormatter.format(date);
      return;
    }

    const day = document.createElement('strong');

    day.textContent = String(date.getDate());
    element.replaceChildren(document.createTextNode(monthFormatter.format(date)), day);
  }

  function initCalendarDownloads(root) {
    root.querySelectorAll('[data-calendar-download], button.calendar-button, button[data-calendar-event]').forEach((button) => {
      if (button.dataset.calendarDownloadReady === 'true') {
        return;
      }

      const eventData = getEventData(button);

      button.dataset.calendarDownloadReady = 'true';

      if (!eventData.date) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        return;
      }

      button.addEventListener('click', () => downloadCalendarEvent(getEventData(button)));
    });
  }

  function getEventData(control) {
    const eventRow = control.closest('[data-calendar-row], .event-row');
    const legacyData = parseLegacyEventData(control.dataset.calendarEvent);
    const dateElement = eventRow?.querySelector('[data-calendar-date], .event-date, .date-block');
    const rawDate = dateElement?.dataset.calendarRawDate
      || dateElement?.getAttribute('datetime')
      || legacyData.date
      || '';

    return {
      date: parseEventDate(rawDate),
      description: getElementText(eventRow, '[data-calendar-description], .event-info p') || cleanText(legacyData.description),
      location: getElementText(eventRow, '[data-calendar-location], .event-location') || cleanText(legacyData.location),
      title: getElementText(eventRow, '[data-calendar-title], .event-info h3') || cleanText(legacyData.title)
    };
  }

  function parseLegacyEventData(value) {
    if (!value) {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  }

  function getElementText(root, selector) {
    return cleanText(root?.querySelector(selector)?.textContent);
  }

  function downloadCalendarEvent(eventData) {
    if (!eventData.date) {
      return;
    }

    const date = toCompactDate(eventData.date);
    const endDateValue = new Date(eventData.date);
    endDateValue.setDate(endDateValue.getDate() + 1);
    const endDate = toCompactDate(endDateValue);
    const title = eventData.title || 'Calendar event';
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'calendar-event';
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//CCCS//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${date}-${slug}@cccs`,
      `DTSTAMP:${toUtcTimestamp(new Date())}`,
      `DTSTART;VALUE=DATE:${date}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${escapeCalendarText(title)}`,
      `DESCRIPTION:${escapeCalendarText(eventData.description)}`,
      `LOCATION:${escapeCalendarText(eventData.location)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = `${slug}.ics`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function parseEventDate(rawDate) {
    const originalDate = cleanText(rawDate);

    if (!originalDate) {
      return null;
    }

    if (/^\d{4,5}(?:\.\d+)?$/.test(originalDate)) {
      const serial = Number(originalDate);
      const utcDate = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);

      return buildDate(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
    }

    const normalizedDate = originalDate
      .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    const googleDateMatch = normalizedDate.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)$/i);

    if (googleDateMatch) {
      return buildDate(Number(googleDateMatch[1]), Number(googleDateMatch[2]), Number(googleDateMatch[3]));
    }

    const compactMatch = normalizedDate.match(/^(\d{4})(\d{2})(\d{2})$/);

    if (compactMatch) {
      return buildDate(Number(compactMatch[1]), Number(compactMatch[2]) - 1, Number(compactMatch[3]));
    }

    const isoMatch = normalizedDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (isoMatch) {
      return buildDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    const slashMatch = normalizedDate.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);

    if (slashMatch) {
      return buildDate(normalizeYear(slashMatch[3]), Number(slashMatch[1]) - 1, Number(slashMatch[2]));
    }

    const monthNameMatch = normalizedDate.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{2,4}))?/);

    if (monthNameMatch) {
      const parsedDate = new Date(`${monthNameMatch[1]} ${monthNameMatch[2]}, ${normalizeYear(monthNameMatch[3])}`);

      if (!Number.isNaN(parsedDate.getTime())) {
        return buildDate(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      }
    }

    const parsedDate = new Date(normalizedDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return buildDate(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  }

  function normalizeYear(rawYear) {
    if (!rawYear) {
      return new Date().getFullYear();
    }

    const year = Number(rawYear);
    return year < 100 ? 2000 + year : year;
  }

  function buildDate(year, monthIndex, day) {
    const date = new Date(year, monthIndex, day);

    if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
      return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
  }

  function getRawDate(element) {
    return cleanText(
      element.dataset.calendarRawDate
      || element.dataset.calendarDateValue
      || element.textContent
      || element.getAttribute('datetime')
    );
  }

  function toIsoDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function toCompactDate(date) {
    return toIsoDate(date).replace(/-/g, '');
  }

  function toUtcTimestamp(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  function escapeCalendarText(value) {
    return cleanText(value)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function cleanText(value) {
    if (value === undefined || value === null) {
      return '';
    }

    return String(value).trim();
  }

  return {
    init,
    parseEventDate
  };
})();
