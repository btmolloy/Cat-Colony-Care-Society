const CalendarComponent = (() => {
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short'
  });
  const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  });
  const shortMonthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short'
  });

  function init(options = {}) {
    const root = document.querySelector('[data-calendar-component]');

    if (!root) {
      return;
    }

    const today = startOfDay(options.today || new Date());
    const calendarData = window.cmsArrays?.meetingcalendar || {};
    const calendarEvents = getCalendarEvents(calendarData, today);

    renderCalendar(root, calendarEvents, today);
  }

  function getCalendarEvents(calendarData, today) {
    return Object.entries(calendarData)
      .filter(([, entryValue]) => isCalendarEvent(entryValue))
      .map(([entryKey, entryValue], eventIndex) => {
        const eventDate = getTextValue(entryValue.EventDate);

        return {
          date: parseEventDate(eventDate, today),
          description: getTextValue(entryValue.EventDescription) || 'No description has been added yet.',
          displayDate: eventDate || 'Date TBD',
          id: `calendar-event-${eventIndex}`,
          key: entryKey,
          location: getTextValue(entryValue.EventLocation) || 'Location TBD',
          name: getTextValue(entryValue.EventName) || entryKey
        };
      })
      .sort((firstEvent, secondEvent) => {
        if (!firstEvent.date && !secondEvent.date) {
          return firstEvent.name.localeCompare(secondEvent.name);
        }

        if (!firstEvent.date) {
          return 1;
        }

        if (!secondEvent.date) {
          return -1;
        }

        return firstEvent.date.getTime() - secondEvent.date.getTime() || firstEvent.name.localeCompare(secondEvent.name);
      });
  }

  function isCalendarEvent(entryValue) {
    if (!entryValue || typeof entryValue !== 'object') {
      return false;
    }

    if (entryValue.display === false || getTextValue(entryValue.display).toUpperCase() === 'FALSE') {
      return false;
    }

    return ['EventName', 'EventDescription', 'EventLocation', 'EventDate'].some((fieldName) => getTextValue(entryValue[fieldName]));
  }

  function renderCalendar(root, calendarEvents, today) {
    const grid = root.querySelector('[data-calendar-grid]');
    const range = root.querySelector('[data-calendar-range]');
    const monthNote = root.querySelector('[data-calendar-month-note]');
    const emptyMessage = root.querySelector('[data-calendar-empty]');
    const weekStart = getStartOfWeek(today);
    const visibleDates = Array.from({ length: 28 }, (unusedValue, dayIndex) => addDays(weekStart, dayIndex));
    const visibleDateKeys = new Set(visibleDates.map(toDateKey));
    const eventsByDate = groupEventsByDate(calendarEvents, visibleDateKeys);
    const visibleEventCount = Array.from(eventsByDate.values()).reduce((eventCount, eventList) => eventCount + eventList.length, 0);

    renderAgenda(root, calendarEvents);

    if (!grid) {
      return;
    }

    grid.innerHTML = '';

    visibleDates.forEach((visibleDate, dayIndex) => {
      const dateKey = toDateKey(visibleDate);
      const dayEvents = eventsByDate.get(dateKey) || [];
      const dayCell = createDayCell(visibleDate, dayIndex, weekStart, today, dayEvents);

      grid.appendChild(dayCell);
    });

    if (range) {
      range.textContent = `Showing ${fullDateFormatter.format(weekStart)} through ${fullDateFormatter.format(visibleDates[visibleDates.length - 1])}.`;
    }

    if (monthNote) {
      monthNote.textContent = getMonthNote(visibleDates, weekStart);
    }

    if (emptyMessage) {
      emptyMessage.hidden = visibleEventCount > 0;
    }
  }

  function renderAgenda(root, calendarEvents) {
    const agenda = root.querySelector('[data-calendar-agenda]');

    if (!agenda) {
      return;
    }

    agenda.innerHTML = '';

    calendarEvents.forEach((calendarEvent) => {
      const article = document.createElement('article');
      const eventName = document.createElement('h3');
      const eventMeta = document.createElement('p');
      const eventDescription = document.createElement('p');

      article.className = 'calendar-agenda-item';
      eventName.textContent = calendarEvent.name;
      eventMeta.className = 'calendar-agenda-meta';
      eventMeta.textContent = `${calendarEvent.displayDate} · ${calendarEvent.location}`;
      eventDescription.textContent = calendarEvent.description;

      article.appendChild(eventName);
      article.appendChild(eventMeta);
      article.appendChild(eventDescription);
      agenda.appendChild(article);
    });
  }

  function createDayCell(visibleDate, dayIndex, weekStart, today, dayEvents) {
    const dayCell = document.createElement('div');
    const dayHeader = document.createElement('div');
    const dayNumber = document.createElement('span');
    const eventList = document.createElement('div');
    const shouldShowMonth = dayIndex === 0 || visibleDate.getDate() === 1 || visibleDate.getDay() === 0;

    dayCell.className = 'cccs-calendar-day';
    dayCell.setAttribute('role', 'gridcell');
    dayCell.setAttribute('aria-label', fullDateFormatter.format(visibleDate));

    if (visibleDate.getMonth() !== weekStart.getMonth()) {
      dayCell.classList.add('cccs-calendar-day-next-month');
    }

    if (toDateKey(visibleDate) === toDateKey(today)) {
      dayCell.classList.add('cccs-calendar-day-current');
    }

    dayHeader.className = 'cccs-calendar-day-header';
    dayNumber.className = 'cccs-calendar-day-number';
    dayNumber.textContent = dayFormatter.format(visibleDate);
    dayHeader.appendChild(dayNumber);

    if (shouldShowMonth) {
      const monthLabel = document.createElement('span');

      monthLabel.className = 'cccs-calendar-month-label';
      monthLabel.textContent = shortMonthFormatter.format(visibleDate);
      dayHeader.appendChild(monthLabel);
    }

    eventList.className = 'cccs-calendar-event-list';
    dayEvents.forEach((calendarEvent) => {
      eventList.appendChild(createEventButton(calendarEvent));
    });

    dayCell.appendChild(dayHeader);
    dayCell.appendChild(eventList);

    return dayCell;
  }

  function createEventButton(calendarEvent) {
    const eventButton = document.createElement('button');
    const eventTitle = document.createElement('span');
    const eventLocation = document.createElement('span');

    eventButton.type = 'button';
    eventButton.className = 'btn btn-success cccs-calendar-event';
    eventButton.setAttribute('aria-label', `${calendarEvent.name}, ${calendarEvent.displayDate}`);
    eventButton.addEventListener('click', () => showEventDetails(calendarEvent));

    eventTitle.className = 'd-block text-truncate';
    eventTitle.textContent = calendarEvent.name;
    eventLocation.className = 'cccs-calendar-event-location text-truncate';
    eventLocation.textContent = calendarEvent.location;

    eventButton.appendChild(eventTitle);
    eventButton.appendChild(eventLocation);

    return eventButton;
  }

  function showEventDetails(calendarEvent) {
    const modal = document.getElementById('calendarEventModal');

    if (!modal) {
      window.alert(`${calendarEvent.name}\n${calendarEvent.displayDate}\n${calendarEvent.location}\n\n${calendarEvent.description}`);
      return;
    }

    modal.querySelector('#calendarEventModalTitle').textContent = calendarEvent.name;
    modal.querySelector('[data-calendar-modal-date]').textContent = calendarEvent.displayDate;
    modal.querySelector('[data-calendar-modal-location]').textContent = calendarEvent.location;
    modal.querySelector('[data-calendar-modal-description]').textContent = calendarEvent.description;

    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    window.alert(`${calendarEvent.name}\n${calendarEvent.displayDate}\n${calendarEvent.location}\n\n${calendarEvent.description}`);
  }

  function groupEventsByDate(calendarEvents, visibleDateKeys) {
    const eventsByDate = new Map();

    calendarEvents.forEach((calendarEvent) => {
      if (!calendarEvent.date) {
        return;
      }

      const dateKey = toDateKey(calendarEvent.date);

      if (!visibleDateKeys.has(dateKey)) {
        return;
      }

      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }

      eventsByDate.get(dateKey).push(calendarEvent);
    });

    return eventsByDate;
  }

  function parseEventDate(rawDate, today) {
    const originalDate = getTextValue(rawDate);

    if (!originalDate) {
      return null;
    }

    const normalizedDate = originalDate
      .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    const isoMatch = normalizedDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (isoMatch) {
      return buildDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    const slashMatch = normalizedDate.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);

    if (slashMatch) {
      const year = normalizeYear(slashMatch[3], today);

      return buildDate(year, Number(slashMatch[1]) - 1, Number(slashMatch[2]));
    }

    const monthNameMatch = normalizedDate.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?/);

    if (monthNameMatch) {
      const year = normalizeYear(monthNameMatch[3], today);
      const parsedDate = new Date(`${monthNameMatch[1]} ${monthNameMatch[2]}, ${year}`);

      if (!Number.isNaN(parsedDate.getTime())) {
        return startOfDay(parsedDate);
      }
    }

    const parsedDate = new Date(normalizedDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return startOfDay(parsedDate);
  }

  function normalizeYear(rawYear, today) {
    if (!rawYear) {
      return today.getFullYear();
    }

    const year = Number(rawYear);

    if (year < 100) {
      return 2000 + year;
    }

    return year;
  }

  function buildDate(year, monthIndex, day) {
    const date = new Date(year, monthIndex, day);

    if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
      return null;
    }

    return startOfDay(date);
  }

  function getStartOfWeek(date) {
    return addDays(startOfDay(date), -date.getDay());
  }

  function addDays(date, days) {
    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + days);
    return startOfDay(nextDate);
  }

  function startOfDay(date) {
    const dayStart = new Date(date);

    dayStart.setHours(0, 0, 0, 0);
    return dayStart;
  }

  function toDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function getMonthNote(visibleDates, weekStart) {
    const nextMonthLabels = Array.from(new Set(
      visibleDates
        .filter((visibleDate) => visibleDate.getMonth() !== weekStart.getMonth())
        .map((visibleDate) => monthFormatter.format(visibleDate))
    ));

    if (!nextMonthLabels.length) {
      return 'All visible days are in the same month.';
    }

    return `${nextMonthLabels.join(', ')} days are shaded.`;
  }

  function getTextValue(value) {
    if (value === undefined || value === null) {
      return '';
    }

    return String(value).trim();
  }

  return {
    init
  };
})();
