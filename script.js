// 1. Empty Default Data (কোনো বাই-ডিফল্ট ভার্সিটি থাকবে না)
const initialPrograms = [];

// LocalStorage Sync Key
const STORAGE_KEY = 'global_uni_tracker_data_v2';

let programs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialPrograms;

const tableBody = document.getElementById('universityTableBody');
const searchInput = document.getElementById('searchInput');
const countryFilter = document.getElementById('countryFilter');
const scholarshipFilter = document.getElementById('scholarshipFilter');
const sortBy = document.getElementById('sortBy');
const showingCountEl = document.getElementById('showing-count');

// Google Calendar URL Generator
function createGoogleCalendarUrl(uni, program, deadlineDate) {
    if(!deadlineDate) return '#';
    try {
        const dateObj = new Date(deadlineDate);
        const startDate = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8);
        const title = encodeURIComponent(`Deadline: ${uni} (${program})`);
        const details = encodeURIComponent(`Application Deadline for ${program} at ${uni}.`);
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${startDate}&details=${details}`;
    } catch (e) {
        return '#';
    }
}

// 2. Render Table Data
function renderPrograms(dataList) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const pdfContainer = document.getElementById('pdfPrintContainer');
    if(pdfContainer) pdfContainer.innerHTML = '';

    if (dataList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-slate-400">
                    <div class="text-sm">No programs found. Click <strong class="text-indigo-400">+ Add program</strong> to add your first application!</div>
                </td>
            </tr>`;
        return;
    }

    dataList.forEach(item => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-800/40 transition border-b border-slate-800";

        const calendarUrl = createGoogleCalendarUrl(item.university, item.program, item.deadline);

        row.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-white text-sm">${item.university || 'N/A'}</div>
                <div class="text-[11px] text-teal-400 font-medium">${item.country || 'N/A'}</div>
                ${item.link ? `<a href="${item.link}" target="_blank" class="text-[10px] text-indigo-400 hover:underline">Link ↗</a>` : ''}
            </td>
            <td class="p-4">
                <div class="font-medium text-slate-200">${item.program || 'N/A'}</div>
                <div class="text-[10px] text-slate-400">${item.profName ? 'Prof: ' + item.profName : 'Prof: N/A'}</div>
                <div class="text-[10px] text-slate-500 italic">${item.researchArea || ''}</div>
            </td>
            <td class="p-4">
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded ${item.scholarship === 'Fully Funded' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'}">
                    ${item.scholarship || 'Self'}
                </span>
                <div class="text-[11px] text-slate-300 font-medium mt-1">Fee: ${item.feeAmount ? item.feeAmount + ' ' + (item.feeCurrency || '') : 'Free'}</div>
            </td>
            <td class="p-4">
                <div class="text-[11px] text-slate-300">IELTS: <span class="font-semibold text-white">${item.ieltsScore || 'N/A'}</span> | GRE: <span class="font-semibold text-white">${item.greScore || 'N/A'}</span></div>
                <div class="text-[10px] text-slate-400 mt-0.5">LOR: ${item.lorAcademic || '-'} (Acad) / ${item.lorProfessional || '-'} (Prof)</div>
            </td>
            <td class="p-4">
                <div class="font-semibold text-white">${item.deadline || 'N/A'}</div>
                ${item.deadline ? `<a href="${calendarUrl}" target="_blank" class="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium mt-0.5">📅 Add to Calendar</a>` : ''}
            </td>
            <td class="p-4 text-center">
                <button onclick="deleteProgram(${item.id})" class="text-red-400 hover:text-red-300 font-semibold text-[11px] bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);

        // PDF Print Grid
        if(pdfContainer) {
            const pdfCard = document.createElement('div');
            pdfCard.className = "pdf-card bg-slate-50 rounded p-3 text-xs border border-slate-300";
            pdfCard.innerHTML = `
                <h3 class="font-bold text-slate-900 text-sm">${item.university} (${item.country})</h3>
                <div class="text-indigo-700 font-semibold mb-1">${item.program}</div>
                <div class="text-[11px] text-slate-600">Professor: ${item.profName || 'N/A'}</div>
                <div class="text-[11px] text-slate-600">Deadline: ${item.deadline} | Funding: ${item.scholarship}</div>
            `;
            pdfContainer.appendChild(pdfCard);
        }
    });

    populateCountryOptions();
}

function populateCountryOptions() {
    if (!countryFilter) return;
    const countries = [...new Set(programs.map(p => p.country).filter(Boolean))];
    const currentVal = countryFilter.value;
    countryFilter.innerHTML = '<option value="all">All Countries</option>';
    countries.forEach(c => {
        countryFilter.innerHTML += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`;
    });
}

function filterAndSortData() {
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCountry = countryFilter ? countryFilter.value : 'all';
    const selectedScholarship = scholarshipFilter ? scholarshipFilter.value : 'all';
    const selectedSort = sortBy ? sortBy.value : 'uni';

    let filtered = programs.filter(item => {
        const matchesSearch = (item.university && item.university.toLowerCase().includes(searchValue)) || 
                              (item.program && item.program.toLowerCase().includes(searchValue)) ||
                              (item.profName && item.profName.toLowerCase().includes(searchValue));
        const matchesCountry = selectedCountry === 'all' || item.country === selectedCountry;
        const matchesScholarship = selectedScholarship === 'all' || item.scholarship === selectedScholarship;
        return matchesSearch && matchesCountry && matchesScholarship;
    });

    if (selectedSort === 'uni') filtered.sort((a, b) => (a.university || '').localeCompare(b.university || ''));
    if (selectedSort === 'deadline') filtered.sort((a, b) => new Date(a.deadline || '2099-12-31') - new Date(b.deadline || '2099-12-31'));

    renderPrograms(filtered);
    if(showingCountEl) showingCountEl.innerText = `Showing ${filtered.length} of ${programs.length} programs`;
}

function deleteProgram(id) {
    if(confirm("Are you sure you want to delete this program?")) {
        programs = programs.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
        filterAndSortData();
    }
}

function resetPersonalData() {
    if(confirm("Are you sure you want to clear all program data?")) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('mySpreadsheetTrackerData'); // Clear old keys too
        programs = [];
        filterAndSortData();
    }
}

// 3. Modal Handlers & Form Submission
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const programForm = document.getElementById('programForm');

if(addBtn) addBtn.addEventListener('click', () => addModal.classList.remove('hidden'));

const hideModal = () => { 
    if(addModal) addModal.classList.add('hidden'); 
    if(programForm) programForm.reset(); 
};

if(closeModal) closeModal.addEventListener('click', hideModal);
if(cancelBtn) cancelBtn.addEventListener('click', hideModal);

if(programForm) {
    programForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Stop Page Refresh

        const newProgram = {
            id: Date.now(),
            university: document.getElementById('uniName').value,
            program: document.getElementById('uniProgram').value,
            country: document.getElementById('uniCountry').value,
            scholarship: document.getElementById('uniScholarship').value,
            profName: document.getElementById('profName').value || '',
            researchArea: document.getElementById('researchArea').value || '',
            link: document.getElementById('uniLink').value || '',
            remarks: document.getElementById('remarks').value || '',
            ieltsScore: document.getElementById('ieltsScore').value || '',
            greScore: document.getElementById('greScore').value || '',
            lorAcademic: document.getElementById('lorAcademic').value || '',
            lorProfessional: document.getElementById('lorProfessional').value || '',
            sopInfo: document.getElementById('sopInfo').value || '',
            proposalInfo: document.getElementById('proposalInfo').value || '',
            startDate: document.getElementById('startDate').value || '',
            deadline: document.getElementById('uniDeadline').value,
            feeAmount: document.getElementById('feeAmount').value || '',
            feeCurrency: document.getElementById('feeCurrency').value || ''
        };

        programs.unshift(newProgram);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
        
        filterAndSortData();
        hideModal();
    });
}

// Search & Filter Event Listeners
if(searchInput) searchInput.addEventListener('input', filterAndSortData);
if(countryFilter) countryFilter.addEventListener('change', filterAndSortData);
if(scholarshipFilter) scholarshipFilter.addEventListener('change', filterAndSortData);
if(sortBy) sortBy.addEventListener('change', filterAndSortData);

// Initial Load
filterAndSortData();
