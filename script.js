// =======================
// CSV Parsing + Smart Import (FINAL FIXED)
// =======================

const HEADER_ALIASES = {
  university: ['university', 'scholarshipname', 'institution', 'institute', 'uni', 'universityname'],
  program: ['program', 'progra', 'relevantfields', 'course', 'degree', 'subject', 'major', 'field'],
  country: ['country', 'region', 'location', 'destinationcountry'],
  scholarship: ['fundingtype', 'scholarship', 'funding', 'fundingstatus', 'financialsupport'],
  profName: ['profname', 'professor', 'host', 'supervisor', 'faculty'],
  researchArea: ['researcharea', 'relevantfields', 'researchfield', 'focusarea'],
  link: ['officialwebsite', 'link', 'website', 'url', 'applylink', 'source'],
  remarks: ['notes', 'remarks', 'otherbenefits', 'comment', 'details'],
  ieltsScore: ['ieltsscore', 'languagerequirement', 'requiredtest', 'ielts'],
  greScore: ['grescore', 'gre', 'requiredtest'],
  lorAcademic: ['loracademic', 'otherkeyrequirements', 'academiclor', 'academicrecommendation', 'loracademic'],
  lorProfessional: ['lorprofessional', 'professionallor', 'professionalrecommendation', 'lorprofessional'],
  sopInfo: ['sopinfo', 'sop', 'statementofpurpose'],
  proposalInfo: ['proposalinfo', 'researchproposal', 'proposal'],
  startDate: ['applicationstartdate', 'startdate', 'start', 'openingdate', 'startdate'],
  deadline: ['applicationdeadline', 'deadline', 'lastdate', 'closingdate', 'applyby'],
  feeAmount: ['feeamount', 'tuitioncoverage', 'fee', 'amount', 'tuition'],
  feeCurrency: ['feecurrency', 'currency', 'moneytype']
};

function normalizeKey(s) {
  return (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseCSVText(text) {
  // Normalize line endings + remove BOM
  text = (text || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Find first non-empty line
  const firstLine = (text.split('\n').find(l => l.trim().length > 0) || '');

  // Auto-detect delimiter
  const delimiters = [',', ';', '\t', '|'];

  function countOutsideQuotes(line, delimiter) {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const next = line[i + 1];

      if (c === '"' && inQuotes && next === '"') {
        i++;
      } else if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === delimiter && !inQuotes) {
        count++;
      }
    }
    return count;
  }

  let detectedDelimiter = ',';
  let maxCount = -1;
  for (const d of delimiters) {
    const c = countOutsideQuotes(firstLine, d);
    if (c > maxCount) {
      maxCount = c;
      detectedDelimiter = d;
    }
  }

  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === detectedDelimiter && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(current.trim());
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some(v => v !== '')) rows.push(row);
  }

  return rows;
}

function buildHeaderIndexMap(headerRow) {
  const normalizedHeaders = headerRow.map(h => normalizeKey(h));
  const indexMap = {};

  for (const [targetField, aliases] of Object.entries(HEADER_ALIASES)) {
    let found = -1;

    // exact
    for (const alias of aliases) {
      const a = normalizeKey(alias);
      const idx = normalizedHeaders.findIndex(h => h === a);
      if (idx !== -1) {
        found = idx;
        break;
      }
    }

    // partial fallback
    if (found === -1) {
      for (const alias of aliases) {
        const a = normalizeKey(alias);
        const idx = normalizedHeaders.findIndex(h => h.includes(a) || a.includes(h));
        if (idx !== -1) {
          found = idx;
          break;
        }
      }
    }

    if (found !== -1) indexMap[targetField] = found;
  }

  return indexMap;
}

function getRowValue(row, indexMap, field, fallback = '') {
  const idx = indexMap[field];
  if (idx === undefined || idx < 0 || idx >= row.length) return fallback;
  const value = (row[idx] ?? '').toString().trim();
  return value || fallback;
}

function isValidUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeScholarship(val) {
  const s = (val ?? '').toString().trim().toLowerCase();
  if (!s) return 'Self';
  if (s.includes('full') || s.includes('fully') || s.includes('100%')) return 'Fully Funded';
  if (s.includes('partial') || s.includes('partially') || s.includes('50%') || s.includes('waiver')) return 'Partially Funded';
  if (s.includes('self') || s.includes('no funding')) return 'Self';
  return (val ?? 'Self').toString().trim();
}

function normalizeProgramKey(item) {
  const uni = (item.university || '').trim().toLowerCase();
  const prog = (item.program || '').trim().toLowerCase();
  const country = (item.country || '').trim().toLowerCase();
  const deadline = (item.deadline || '').trim().toLowerCase();
  return `${uni}__${prog}__${country}__${deadline}`;
}

function generateId(seed = '') {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}-${seed}`;
}

function savePrograms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

// Main handler
function handleCSVUpload(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const text = (e?.target?.result ?? '').toString();
      const rows = parseCSVText(text);

      if (!rows || rows.length < 2) {
        alert('CSV file seems empty or invalid.');
        return;
      }

      const headerRow = rows[0];
      const dataRows = rows.slice(1);
      const indexMap = buildHeaderIndexMap(headerRow);

      // Must map at least core fields
      if (indexMap.university === undefined && indexMap.program === undefined) {
        alert('CSV headers not recognized. Please include at least university/program columns.');
        return;
      }

      const existingKeys = new Set((programs || []).map(p => normalizeProgramKey(p)));
      let addedCount = 0;
      let duplicateCount = 0;
      let skippedEmpty = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!Array.isArray(row) || row.length === 0 || !row.join('').trim()) {
          skippedEmpty++;
          continue;
        }

        const newProgram = {
          id: generateId(`csv-${i}`),
          university: getRowValue(row, indexMap, 'university', 'Unknown University'),
          program: getRowValue(row, indexMap, 'program', 'Higher Study Program'),
          country: getRowValue(row, indexMap, 'country', 'Global'),
          scholarship: normalizeScholarship(getRowValue(row, indexMap, 'scholarship', 'Fully Funded')),
          profName: getRowValue(row, indexMap, 'profName', ''),
          researchArea: getRowValue(row, indexMap, 'researchArea', ''),
          link: getRowValue(row, indexMap, 'link', ''),
          remarks: getRowValue(row, indexMap, 'remarks', ''),
          ieltsScore: getRowValue(row, indexMap, 'ieltsScore', 'N/A'),
          greScore: getRowValue(row, indexMap, 'greScore', 'N/A'),
          lorAcademic: getRowValue(row, indexMap, 'lorAcademic', ''),
          lorProfessional: getRowValue(row, indexMap, 'lorProfessional', ''),
          sopInfo: getRowValue(row, indexMap, 'sopInfo', ''),
          proposalInfo: getRowValue(row, indexMap, 'proposalInfo', ''),
          startDate: getRowValue(row, indexMap, 'startDate', ''),
          deadline: getRowValue(row, indexMap, 'deadline', ''),
          feeAmount: getRowValue(row, indexMap, 'feeAmount', '0'),
          feeCurrency: getRowValue(row, indexMap, 'feeCurrency', 'USD')
        };

        if (newProgram.link && !isValidUrl(newProgram.link)) {
          newProgram.link = '';
        }

        const uniqueKey = normalizeProgramKey(newProgram);
        if (existingKeys.has(uniqueKey)) {
          duplicateCount++;
          continue;
        }

        existingKeys.add(uniqueKey);
        programs.unshift(newProgram);
        addedCount++;
      }

      savePrograms();
      if (typeof filterAndSortData === 'function') filterAndSortData();

      alert(
        `🎉 CSV Import Complete!\n` +
        `Added: ${addedCount}\n` +
        `Duplicates skipped: ${duplicateCount}\n` +
        `Empty rows skipped: ${skippedEmpty}`
      );

      if (event?.target) event.target.value = '';
    } catch (err) {
      console.error('CSV import failed:', err);
      alert('CSV import failed. Please check file format and try again.');
    }
  };

  reader.onerror = function () {
    alert('Could not read the file. Please try again.');
  };

  reader.readAsText(file);
}

// Make handler available for inline HTML onchange="handleCSVUpload(event)"
window.handleCSVUpload = handleCSVUpload;
