const CmsContentLoader = (() => {
  const spreadsheetId = '1QZtmlsuTkXGAFxonQ1n-gZLTUU_5Jr0D';

  function loadSheet(sheetName) {
    return new Promise((resolve, reject) => {
      const callbackName = `cmsCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const url = new URL(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq`);

      url.searchParams.set('sheet', sheetName);
      url.searchParams.set('headers', '0');
      url.searchParams.set('tqx', `out:json;responseHandler:${callbackName}`);

      window[callbackName] = (data) => {
        delete window[callbackName];
        script.remove();

        if (data.status === 'error') {
          reject(new Error(`Google returned an error for ${sheetName}.`));
          return;
        }

        resolve(data);
      };

      script.onerror = () => {
        delete window[callbackName];
        script.remove();
        reject(new Error(`Could not load ${sheetName}.`));
      };

      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function cellToText(cell) {
    if (!cell) {
      return '';
    }

    const value = cell.f ?? cell.v ?? '';
    return String(value).trim();
  }

  function tableToRows(table) {
    const columnCount = table.cols.length;

    return table.rows.map((row) => {
      const cells = [];

      for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
        cells.push(cellToText(row.c[columnIndex]));
      }

      return cells;
    });
  }

  function isNA(value) {
    return String(value).trim().toUpperCase() === 'N/A';
  }

  function parseDisplay(value) {
    const normalizedValue = String(value).trim().toUpperCase();
    return normalizedValue === 'TRUE' || normalizedValue === '1';
  }

  function parseSheetRows(rows) {
    const display = parseDisplay(rows[1]?.[1]);
    const topArrayName = rows[2]?.[1]?.trim();
    const complexity = rows[3]?.[1]?.trim().toLowerCase();
    const contentType = rows[4]?.[1]?.trim().toLowerCase();
    const array = { display };
    let started = false;

    rows.forEach((row, rowIndex) => {
      if (rowIndex < 6) {
        return;
      }

      const command = row[0].trim().toUpperCase();

      if (command === 'START') {
        started = true;
        return;
      }

      if (command === 'END') {
        started = false;
        return;
      }

      if (!started || command !== 'FIELD') {
        return;
      }

      if (complexity === 'basic' || contentType === 'static') {
        const variableName = row[2].trim();
        const value = row[3];

        if (variableName && !isNA(variableName)) {
          array[variableName] = value;
        }

        return;
      }

      const subArrayName = row[2].trim();
      const variableName = row[3].trim();
      const value = row[4];

      if (!variableName || isNA(variableName)) {
        return;
      }

      if (contentType === 'hybrid' && (!subArrayName || isNA(subArrayName))) {
        array[variableName] = value;
        return;
      }

      if (!subArrayName || isNA(subArrayName)) {
        return;
      }

      if (!array[subArrayName]) {
        array[subArrayName] = {};
      }

      array[subArrayName][variableName] = value;
    });

    return {
      name: topArrayName,
      value: array
    };
  }

  async function loadParsedSheet(sheetName) {
    const data = await loadSheet(sheetName);
    const rows = tableToRows(data.table);
    return parseSheetRows(rows);
  }

  async function loadParsedSheets(sheetNames) {
    const cmsArrays = {};

    for (const sheetName of sheetNames) {
      const parsedSheet = await loadParsedSheet(sheetName);
      cmsArrays[parsedSheet.name] = parsedSheet.value;
    }

    return cmsArrays;
  }

  return {
    loadParsedSheet,
    loadParsedSheets
  };
})();
