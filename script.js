// =====================================================
// Global Scholarship Tracker - COMPLETE RECODED script.js
// =====================================================

// 1) Default data
const initialPrograms = [];
const STORAGE_KEY = 'global_uni_tracker_data_v2';

// load data
let programs = [];
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  programs = saved ? JSON.parse(saved) : initialPrograms;
  if (!Array.isArray(programs)) programs = [];
} catch (e) {
  programs = [];
}

const tableBody = document.getElementById('universityTableBody');
const searchInput = document.getElementById('searchInput');
const countryFilter = document.getElementById('countryFilter');
const scholarshipFilter = document.getElementById('scholarshipFilter');
const sortBy = document.getElementById('sortBy');
const showingCountEl = document.getElementById('showing-count');

const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const programForm = document.getElementById('programForm');

// ---------------- Utilities ----------------
function savePrograms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

function escapeHtml(str) {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeKey(s) {
  return (s ?? '').toString().trim().toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[^a-z0-9]/g, '');
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
  return val.toString().trim();
}

function scholarshipClass(label) {
  if (label === 'Fully Funded') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (label === 'Partially Funded') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
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

function normalizeDateForSort(dateStr) {
  if (!dateStr) return new Date('2099-12-31');
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? new Date('2099-12-31') : d;
}

// ---------------- Calendar URL ----------------
function createGoogleCalendarUrl(uni, program, deadlineDate) {
  if (!deadlineDate) return '#';
  try {
    const dateObj = new Date(deadlineDate);
    if (Number.isNaN(dateObj.getTime())) return '#';
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    const date = `${y}${m}${d}`;
    const title = encodeURIComponent(`Deadline: ${uni} (${program})`);
    const details = encodeURIComponent(`Application Deadline for ${program} at ${uni}.`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}`;
  } catch {
    return '#';
  }
}

// ---------------- Render ----------------
function populateCountryOptions() {
  if (!countryFilter) return;
  const current = countryFilter.value || 'all';
  const countries = [...new Set(programs.map(p => (p.country || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  countryFilter.innerHTML = '<option value="all">All Countries</option>';
  countries.forEach(c => {
    countryFilter.innerHTML += `<option value="${escapeHtml(c)}" ${c === current ? 'selected' : ''}>${escapeHtml(c)}</option>`;
  });
}

function renderPrograms(dataList) {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const pdfContainer = document.getElementById('pdfPrintContainer');
  if (pdfContainer) pdfContainer.innerHTML = '';

  if (!dataList || dataList.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400">
          <div class="text-sm">No programs found. Click <strong class="text-indigo-400">+ Add program</strong> to add your first application!</div>
        </td>
      </tr>
    `;
    return;
  }

  dataList.forEach(item => {
    const scholarship = normalizeScholarship(item.scholarship);
    const calendarUrl = createGoogleCalendarUrl(item.university, item.program, item.deadline);

    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-800/40 transition border-b border-slate-800';
    row.innerHTML = `
      <td class="p-4">
        <div class="font-bold text-white text-sm">${escapeHtml(item.university || 'N/A')}</div>
        <div class="text-[11px] text-teal-400 font-medium">${escapeHtml(item.country || 'N/A')}</div>
        ${isValidUrl(item.link) ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="text-[10px] text-indigo-400 hover:underline">Link ↗</a>` : ''}
      </td>
      <td class="p-4">
        <div class="font-medium text-slate-200">${escapeHtml(item.program || 'N/A')}</div>
        <div class="text-[10px] text-slate-400">${item.profName ? `Prof: ${escapeHtml(item.profName)}` : 'Prof: N/A'}</div>
        <div class="text-[10px] text-slate-500 italic">${escapeHtml(item.researchArea || '')}</div>
      </td>
      <td class="p-4">
        <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded ${scholarshipClass(scholarship)}">${escapeHtml(scholarship)}</span>
        <div class="text-[11px] text-slate-300 font-medium mt-1">Fee: ${escapeHtml(item.feeAmount ? `${item.feeAmount} ${item.feeCurrency || ''}` : 'Free')}</div>
      </td>
      <td class="p-4">
        <div class="text-[11px] text-slate-300">IELTS: <span class="font-semibold text-white">${escapeHtml(item.ieltsScore || 'N/A')}</span> | GRE: <span class="font-semibold text-white">${escapeHtml(item.greScore || 'N/A')}</span></div>
        <div class="text-[10px] text-slate-400 mt-0.5">LOR: ${escapeHtml(item.lorAcademic || '-')} (Acad) / ${escapeHtml(item.lorProfessional || '-')} (Prof)</div>
      </td>
      <td class="p-4">
        <div class="font-semibold text-white">${escapeHtml(item.deadline || 'N/A')}</div>
        ${item.deadline ? `<a href="${calendarUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium mt-0.5">📅 Add to Calendar</a>` : ''}
      </td>
      <td class="p-4 text-center">
        <button onclick="deleteProgram('${escapeHtml(item.id)}')" class="text-red-400 hover:text-red-300 font-semibold text-[11px] bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);

    if (pdfContainer) {
      const card = document.createElement('div');
      card.className = 'pdf-card bg-slate-50 rounded p-3 text-xs border border-slate-300';
      card.innerHTML = `
        <h3 class="font-bold text-slate-900 text-sm">${escapeHtml(item.university || '')} (${escapeHtml(item.country || '')})</h3>
        <div class="text-indigo-700 font-semibold mb-1">${escapeHtml(item.program || '')}</div>
        <div class="text-[11px] text-slate-600">Professor: ${escapeHtml(item.profName || 'N/A')}</div>
        <div class="text-[11px] text-slate-600">Deadline: ${escapeHtml(item.deadline || 'N/A')} | Funding: ${escapeHtml(scholarship)}</div>
      `;
      pdfContainer.appendChild(card);
    }
  });

  populateCountryOptions();
}

function filterAndSortData() {
  const searchValue = (searchInput?.value || '').toLowerCase().trim();
  const selectedCountry = countryFilter?.value || 'all';
  const selectedScholarship = scholarshipFilter?.value || 'all';
  const selectedSort = sortBy?.value || 'uni';

  let filtered = programs.filter(item => {
    const uni = (item.university || '').toLowerCase();
    const prog = (item.program || '').toLowerCase();
    const prof = (item.profName || '').toLowerCase();
    const matchesSearch = !searchValue || uni.includes(searchValue) || prog.includes(searchValue) || prof.includes(searchValue);
    const matchesCountry = selectedCountry === 'all' || (item.country || '') === selectedCountry;
    const normalizedFunding = normalizeScholarship(item.scholarship);

    // HTML dropdown has "Partial / Self"
    const matchesScholarship =
      selectedScholarship === 'all' ||
      normalizedFunding === selectedScholarship ||
      (selectedScholarship === 'Partial / Self' && (normalizedFunding === 'Partially Funded' || normalizedFunding === 'Self'));

    return matchesSearch && matchesCountry && matchesScholarship;
  });

  if (selectedSort === 'uni') {
    filtered.sort((a, b) => (a.university || '').localeCompare(b.university || ''));
  } else if (selectedSort === 'deadline') {
    filtered.sort((a, b) => normalizeDateForSort(a.deadline) - normalizeDateForSort(b.deadline));
  }

  renderPrograms(filtered);
  if (showingCountEl) {
    showingCountEl.innerText = `Showing ${filtered.length} of ${programs.length} programs`;
  }
}

// ---------------- CRUD ----------------
function deleteProgram(id) {
  if (!confirm('Are you sure you want to delete this program?')) return;
  programs = programs.filter(p => String(p.id) !== String(id));
  savePrograms();
  filterAndSortData();
}

function resetPersonalData() {
  if (!confirm('Are you sure you want to clear all program data?')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('mySpreadsheetTrackerData');
  programs = [];
  filterAndSortData();
}

window.deleteProgram = deleteProgram;
window.resetPersonalData = resetPersonalData;

// ---------------- Modal/Form ----------------
function hideModal() {
  if (addModal) addModal.classList.add('hidden');
  if (programForm) programForm.reset();
}

if (addBtn && addModal) addBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
if (closeModal) closeModal.addEventListener('click', hideModal);
if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

if (programForm) {
  programForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const newProgram = {
      id: generateId('manual'),
      university: document.getElementById('uniName')?.value?.trim() || 'Unknown University',
      program: document.getElementById('uniProgram')?.value?.trim() || 'Higher Study Program',
      country: document.getElementById('uniCountry')?.value?.trim() || 'Global',
      scholarship: normalizeScholarship(document.getElementById('uniScholarship')?.value?.trim() || 'Self'),
      profName: document.getElementById('profName')?.value?.trim() || '',
      researchArea: document.getElementById('researchArea')?.value?.trim() || '',
      link: document.getElementById('uniLink')?.value?.trim() || '',
      remarks: document.getElementById('remarks')?.value?.trim() || '',
      ieltsScore: document.getElementById('ieltsScore')?.value?.trim() || '',
      greScore: document.getElementById('greScore')?.value?.trim() || '',
      lorAcademic: document.getElementById('lorAcademic')?.value?.trim() || '',
      lorProfessional: document.getElementById('lorProfessional')?.value?.trim() || '',
      sopInfo: document.getElementById('sopInfo')?.value?.trim() || '',
      proposalInfo: document.getElementById('proposalInfo')?.value?.trim() || '',
      startDate: document.getElementById('startDate')?.value?.trim() || '',
      deadline: document.getElementById('uniDeadline')?.value?.trim() || '',
      feeAmount: document.getElementById('feeAmount')?.value?.trim() || '',
      feeCurrency: document.getElementById('feeCurrency')?.value?.trim() || ''
    };

    const key = normalizeProgramKey(newProgram);
    if (programs.some(p => normalizeProgramKey(p) === key)) {
      alert('This program already exists (duplicate skipped).');
      return;
    }

    programs.unshift(newProgram);
    savePrograms();
    filterAndSortData();
    hideModal();
  });
}

// ---------------- CSV Smart Import ----------------
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
  lorAcademic: ['loracademic', 'otherkeyrequirements', 'academiclor', 'academicrecommendation'],
  lorProfessional: ['lorprofessional', 'professionallor', 'professionalrecommendation'],
  sopInfo: ['sopinfo', 'sop', 'statementofpurpose'],
  proposalInfo: ['proposalinfo', 'researchproposal', 'proposal'],
  startDate: ['applicationstartdate', 'startdate', 'start', 'openingdate'],
  deadline: ['applicationdeadline', 'deadline', 'lastdate', 'closingdate', 'applyby'],
  feeAmount: ['feeamount', 'tuitioncoverage', 'fee', 'amount', 'tuition'],
  feeCurrency: ['feecurrency', 'currency', 'moneytype']
};

function parseCSVText(text) {
  text = (text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const firstLine = (text.split('\n').find(l => l.trim().length > 0) || '');
  const delimiters = [',', ';', '\t', '|'];

  function countOutsideQuotes(line, delimiter) {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const next = line[i + 1];
      if (c === '"' && inQuotes && next === '"') i++;
      else if (c === '"') inQuotes = !inQuotes;
      else if (c === delimiter && !inQuotes) count++;
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

    for (const alias of aliases) {
      const a = normalizeKey(alias);
      const idx = normalizedHeaders.findIndex(h => h === a);
      if (idx !== -1) {
        found = idx;
        break;
      }
    }

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

        if (newProgram.link && !isValidUrl(newProgram.link)) newProgram.link = '';

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
      filterAndSortData();

      alert(
        `🎉 CSV Import Complete!\nAdded: ${addedCount}\nDuplicates skipped: ${duplicateCount}\nEmpty rows skipped: ${skippedEmpty}`
      );

      if (event?.target) event.target.value = '';
    } catch (err) {
      console.error('CSV import failed:', err);
      alert('CSV import failed: ' + (err?.message || err));
    }
  };

  reader.onerror = function () {
    alert('Could not read the file. Please try again.');
  };

  reader.readAsText(file);
}

window.handleCSVUpload = handleCSVUpload;

// ---------------- Events ----------------
if (searchInput) searchInput.addEventListener('input', filterAndSortData);
if (countryFilter) countryFilter.addEventListener('change', filterAndSortData);
if (scholarshipFilter) scholarshipFilter.addEventListener('change', filterAndSortData);
if (sortBy) sortBy.addEventListener('change', filterAndSortData);

// Initial load
filterAndSortData();
