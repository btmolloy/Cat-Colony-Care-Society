CmsPage.init({
  sheetNames: ['Events', 'Meeting_Calendar'],
  loadedMessage: 'Events CMS content loaded.'
})
  .then(() => {
    CalendarComponent.init();
    EventsCalendar.init();
    SiteInteractions.init();
  })
  .catch(CmsPage.showError);

const EventsCalendar = (() => {
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const dayLabelFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const eventDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const rangeMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

  function init(root = document) {
    root.querySelectorAll('[data-events-calendar]').forEach((calendar) => {
      if (calendar.dataset.eventsCalendarReady === 'true') {
        return;
      }

      const calendarGrid = calendar.querySelector('[data-events-calendar-grid]');

      if (!calendarGrid) {
        return;
      }

      calendar.dataset.eventsCalendarReady = 'true';
      renderCalendar(calendar, calendarGrid, getCalendarEvents());
      initPopovers(calendar);
    });
  }

  function getCalendarEvents() {
    const calendarData = window.cmsArrays?.meetingcalendar;

    if (!calendarData || typeof calendarData !== 'object') {
      return [];
    }

    return Object.entries(calendarData)
      .filter(([, item]) => item && typeof item === 'object' && item.display !== false)
      .map(([key, item]) => ({
        key,
        date: CalendarComponent.parseEventDate(item.EventDate),
        description: cleanText(item.EventDescription),
        location: cleanText(item.EventLocation),
        name: cleanText(item.EventName)
      }))
      .filter((event) => event.date && event.name);
  }

  function renderCalendar(calendar, calendarGrid, events) {
    const today = startOfDay(new Date());
    const calendarStart = new Date(today);
    calendarStart.setDate(today.getDate() - today.getDay());
    const calendarEnd = addDays(calendarStart, 27);
    const eventsByDate = groupEventsByDate(events);
    const rangeLabel = calendar.querySelector('[data-events-calendar-range]');

    calendarGrid.replaceChildren();
    calendarGrid.setAttribute('aria-label', `Four weeks beginning ${eventDateFormatter.format(calendarStart)}`);

    if (rangeLabel) {
      rangeLabel.textContent = formatCalendarRange(calendarStart, calendarEnd);
    }

    for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex += 1) {
      const weekdayDate = addDays(calendarStart, weekdayIndex);
      const weekday = document.createElement('div');

      weekday.className = 'events-calendar-weekday';
      weekday.setAttribute('role', 'columnheader');
      weekday.textContent = weekdayFormatter.format(weekdayDate);
      calendarGrid.appendChild(weekday);
    }

    for (let dayIndex = 0; dayIndex < 28; dayIndex += 1) {
      const date = addDays(calendarStart, dayIndex);
      const dateKey = toDateKey(date);
      const dayEvents = eventsByDate.get(dateKey) || [];
      const day = buildDay(date, dayIndex, dayEvents, today);

      calendarGrid.appendChild(day);
    }
  }

  function buildDay(date, dayIndex, events, today) {
    const day = document.createElement('div');
    const dayHeading = document.createElement('div');
    const dayNumber = document.createElement('time');
    const eventList = document.createElement('div');
    const isToday = toDateKey(date) === toDateKey(today);
    const columnIndex = dayIndex % 7;
    const weekIndex = Math.floor(dayIndex / 7);

    day.className = 'events-calendar-day';
    day.setAttribute('role', 'gridcell');
    day.setAttribute('aria-label', dayLabelFormatter.format(date));
    day.classList.toggle('is-today', isToday);
    day.classList.toggle('is-edge-right', columnIndex >= 5);
    day.classList.toggle('is-edge-bottom', weekIndex >= 2);

    dayHeading.className = 'events-calendar-day-heading';
    dayNumber.className = 'events-calendar-day-number';
    dayNumber.dateTime = toDateKey(date);
    dayNumber.textContent = String(date.getDate());
    dayHeading.appendChild(dayNumber);

    if (date.getDate() === 1 || dayIndex === 0) {
      const month = document.createElement('span');
      month.className = 'events-calendar-month';
      month.textContent = monthFormatter.format(date);
      dayHeading.appendChild(month);
    }

    eventList.className = 'events-calendar-events';

    events.forEach((event, eventIndex) => {
      eventList.appendChild(buildEvent(event, date, dayIndex, eventIndex));
    });

    day.append(dayHeading, eventList);
    return day;
  }

  function buildEvent(event, date, dayIndex, eventIndex) {
    const shell = document.createElement('div');
    const trigger = document.createElement('button');
    const popover = document.createElement('aside');
    const title = document.createElement('h3');
    const description = document.createElement('p');
    const details = document.createElement('dl');
    const popoverId = `calendar-event-${dayIndex}-${eventIndex}`;

    shell.className = 'events-calendar-event';
    trigger.className = 'events-calendar-event-trigger';
    trigger.type = 'button';
    trigger.textContent = event.name;
    trigger.setAttribute('aria-controls', popoverId);
    trigger.setAttribute('aria-expanded', 'false');

    popover.className = 'events-calendar-popover';
    popover.id = popoverId;
    popover.setAttribute('aria-hidden', 'true');
    popover.setAttribute('role', 'tooltip');

    title.textContent = event.name;
    description.textContent = event.description;
    appendDetail(details, 'Date', eventDateFormatter.format(date));
    appendDetail(details, 'Location', event.location);
    popover.append(title, description, details);
    shell.append(trigger, popover);

    return shell;
  }

  function appendDetail(list, label, value) {
    if (!value) {
      return;
    }

    const row = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');

    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    list.appendChild(row);
  }

  function initPopovers(calendar) {
    const shells = Array.from(calendar.querySelectorAll('.events-calendar-event'));

    shells.forEach((shell) => {
      const trigger = shell.querySelector('.events-calendar-event-trigger');

      shell.addEventListener('mouseenter', () => {
        const pinned = calendar.querySelector('.events-calendar-event.is-pinned');

        if (!pinned || pinned === shell) {
          setOpen(shell, true);
        }
      });

      shell.addEventListener('mouseleave', () => {
        if (!shell.classList.contains('is-pinned') && !shell.contains(document.activeElement)) {
          setOpen(shell, false);
        }
      });

      shell.addEventListener('focusin', () => setOpen(shell, true));
      shell.addEventListener('focusout', (event) => {
        if (!shell.classList.contains('is-pinned') && !shell.contains(event.relatedTarget)) {
          setOpen(shell, false);
        }
      });

      trigger?.addEventListener('click', (event) => {
        const willPin = !shell.classList.contains('is-pinned');

        event.stopPropagation();
        closeAllPopovers(calendar);

        if (willPin) {
          shell.classList.add('is-pinned');
          setOpen(shell, true);
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (!calendar.contains(event.target) || !event.target.closest('.events-calendar-event')) {
        closeAllPopovers(calendar, true);
      }
    });

    calendar.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      const openShell = calendar.querySelector('.events-calendar-event.is-open');

      if (openShell) {
        event.preventDefault();
        closeAllPopovers(calendar);
      }
    });
  }

  function setOpen(shell, isOpen) {
    const trigger = shell.querySelector('.events-calendar-event-trigger');
    const popover = shell.querySelector('.events-calendar-popover');

    shell.classList.toggle('is-open', isOpen);
    shell.closest('.events-calendar-day')?.classList.toggle('is-popover-active', isOpen);
    trigger?.setAttribute('aria-expanded', String(isOpen));
    popover?.setAttribute('aria-hidden', String(!isOpen));
  }

  function closeAllPopovers(calendar, blurTriggers = false) {
    calendar.querySelectorAll('.events-calendar-event.is-open, .events-calendar-event.is-pinned').forEach((shell) => {
      shell.classList.remove('is-pinned');
      setOpen(shell, false);

      if (blurTriggers && shell.contains(document.activeElement)) {
        shell.querySelector('.events-calendar-event-trigger')?.blur();
      }
    });
  }

  function groupEventsByDate(events) {
    const groupedEvents = new Map();

    events.forEach((event) => {
      const dateKey = toDateKey(event.date);

      if (!groupedEvents.has(dateKey)) {
        groupedEvents.set(dateKey, []);
      }

      groupedEvents.get(dateKey).push(event);
    });

    return groupedEvents;
  }

  function formatCalendarRange(start, end) {
    if (start.getFullYear() !== end.getFullYear()) {
      return `${rangeMonthFormatter.format(start)} ${start.getDate()}, ${start.getFullYear()} — ${rangeMonthFormatter.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
    }

    if (start.getMonth() !== end.getMonth()) {
      return `${rangeMonthFormatter.format(start)} ${start.getDate()} — ${rangeMonthFormatter.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${rangeMonthFormatter.format(start)} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }

  function addDays(date, amount) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount);
    return newDate;
  }

  function startOfDay(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  function toDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function cleanText(value) {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  return { init };
})();
