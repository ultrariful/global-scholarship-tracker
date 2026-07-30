// ১. ডিফল্ট ডাটা
const initialPrograms = [
    { id: 1, university: "Technical University of Munich", country: "Germany", program: "M.Sc. Data Engineering", scholarship: "Fully Funded", portal: "Uni-Assist", deadline: "2026-08-31", link: "https://www.tum.de" },
    { id: 2, university: "Heidelberg University", country: "Germany", program: "M.Sc. Data and Computer Science", scholarship: "Fully Funded", portal: "University Portal", deadline: "2026-09-15", link: "https://www.uni-heidelberg.de" }
];

let programs = JSON.parse(localStorage.getItem('myGlobalTrackerData')) || initialPrograms;

// HTML Elements
const tableBody = document.getElementById('universityTableBody');
const searchInput = document.getElementById('searchInput');
const countryFilter = document.getElementById('countryFilter');
const scholarshipFilter = document.getElementById('scholarshipFilter');
const sortBy = document.getElementById('sortBy');
const showingCountEl = document.getElementById('showing-count');

// 📅 গুগল ক্যালেন্ডারে অটো ইভেন্ট যোগ করার লিংক তৈরি করার ফাংশন
function createGoogleCalendarUrl(uni, program, deadlineDate) {
    if(!deadlineDate) return '#';
    const dateObj = new Date(deadlineDate);
    const startDate = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8);
    
    const title = encodeURIComponent(`Application Deadline: ${uni} (${program})`);
    const details = encodeURIComponent(`Reminder: Application deadline for ${program} at ${uni}. Make sure all documents are submitted.`);
    
    // Google Calendar Event URL with Default Notifications
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${startDate}&details=${details}`;
}

// ২. টেবিল ও পিডিএফ প্রিন্ট ভিউ রেন্ডার
function renderPrograms(dataList) {
    tableBody.innerHTML = '';
    const pdfContainer = document.getElementById('pdfPrintContainer');
    if(pdfContainer) pdfContainer.innerHTML = '';

    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No programs found matching your criteria.</td></tr>`;
        return;
    }

    dataList.forEach(item => {
        // Table Row Generation
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-700/30 transition border-b border-slate-700/40";

        const calendarUrl = createGoogleCalendarUrl(item.university, item.program, item.deadline);

        row.innerHTML = `
            <td class="p-3.5">
                <div class="font-bold text-white">${item.university}</div>
                <div class="text-[10px] text-slate-400">${item.country}</div>
            </td>
            <td class="p-3.5">
                <div class="font-medium text-slate-200">${item.program}</div>
            </td>
            <td class="p-3.5">
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded ${item.scholarship === 'Fully Funded' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'}">
                    ${item.scholarship}
                </span>
            </td>
            <td class="p-3.5">
                ${item.link && item.link !== "#" ? `<a href="${item.link}" target="_blank" class="text-cyan-400 hover:underline font-medium">${item.portal || 'Portal Link ↗'}</a>` : `<span class="text-slate-400">${item.portal || 'N/A'}</span>`}
            </td>
            <td class="p-3.5">
                <div class="font-semibold text-slate-200">${item.deadline}</div>
                <!-- 📅 Calendar Reminder Link -->
                <a href="${calendarUrl}" target="_blank" class="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium mt-0.5">
                    📅 Add to Calendar
                </a>
            </td>
            <td class="p-3.5 text-center">
                <button onclick="deleteProgram(${item.id})" class="text-red-400 hover:text-red-300 font-semibold text-[11px] bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded transition">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);

        // PDF Print Grid Item Generation (Matching Image 2)
        if(pdfContainer) {
            const pdfCard = document.createElement('div');
            pdfCard.className = "pdf-card bg-slate-50 rounded p-3 text-xs border border-slate-300";
            pdfCard.innerHTML = `
                <h3 class="font-bold text-slate-900 text-sm">${item.university}</h3>
                <div class="text-cyan-700 font-semibold mb-2">${item.program}</div>
                <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                    <div><strong>End Date:</strong> ${item.deadline}</div>
                    <div><strong>Funding:</strong> ${item.scholarship}</div>
                    <div><strong>Portal:</strong> ${item.portal || 'N/A'}</div>
                    <div><strong>Link:</strong> ${item.link || 'N/A'}</div>
                </div>
            `;
            pdfContainer.appendChild(pdfCard);
        }
    });

    populateCountryOptions();
}

// ৩. কান্ট্রি ফিল্টার ডাইনামিক করা
function populateCountryOptions() {
    const countries = [...new Set(programs.map(p => p.country))];
    const currentVal = countryFilter.value;
    countryFilter.innerHTML = '<option value="all">All Countries</option>';
    countries.forEach(c => {
        countryFilter.innerHTML += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`;
    });
}

// ৪. ফিল্টারিং ও সার্চিং
function filterAndSortData() {
    const searchValue = searchInput.value.toLowerCase();
    const selectedCountry = countryFilter.value;
    const selectedScholarship = scholarshipFilter.value;
    const selectedSort = sortBy.value;

    let filtered = programs.filter(item => {
        const matchesSearch = item.university.toLowerCase().includes(searchValue) || item.program.toLowerCase().includes(searchValue);
        const matchesCountry = selectedCountry === 'all' || item.country === selectedCountry;
        const matchesScholarship = selectedScholarship === 'all' || item.scholarship === selectedScholarship;
        return matchesSearch && matchesCountry && matchesScholarship;
    });

    if (selectedSort === 'uni') filtered.sort((a, b) => a.university.localeCompare(b.university));
    if (selectedSort === 'deadline') filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    renderPrograms(filtered);
    if(showingCountEl) showingCountEl.innerText = `Showing ${filtered.length} of ${programs.length} programs`;
}

// 📥 CSV ফাইল আপলোড ও অটো-প্রসেসিং ফাংশন
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length >= 3) {
                programs.unshift({
                    id: Date.now() + i,
                    university: cols[0]?.trim() || "Unknown",
                    program: cols[1]?.trim() || "N/A",
                    country: cols[2]?.trim() || "Global",
                    scholarship: cols[3]?.trim() || "Partial",
                    portal: cols[4]?.trim() || "Direct",
                    deadline: cols[5]?.trim() || "2026-12-31"
                });
            }
        }
        localStorage.setItem('myGlobalTrackerData', JSON.stringify(programs));
        filterAndSortData();
        alert('CSV file imported successfully!');
    };
    reader.readAsText(file);
}

// 🔄 ডাটা রিসেট করার ফাংশন
function resetPersonalData() {
    if(confirm("Are you sure you want to reset all your saved data to default?")) {
        localStorage.removeItem('myGlobalTrackerData');
        programs = [...initialPrograms];
        filterAndSortData();
    }
}

// ৫. প্রোগ্রাম মোডাল হ্যান্ডলিং
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const programForm = document.getElementById('programForm');

if(addBtn) addBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
const hideModal = () => { addModal.classList.add('hidden'); programForm.reset(); };
if(closeModal) closeModal.addEventListener('click', hideModal);
if(cancelBtn) cancelBtn.addEventListener('click', hideModal);

if(programForm) {
    programForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProgram = {
            id: Date.now(),
            university: document.getElementById('uniName').value,
            program: document.getElementById('uniProgram').value,
            country: document.getElementById('uniCountry').value,
            scholarship: document.getElementById('uniScholarship').value,
            portal: document.getElementById('uniPortal').value || "Direct",
            deadline: document.getElementById('uniDeadline').value,
            link: document.getElementById('uniLink').value || "#"
        };
        programs.unshift(newProgram);
        localStorage.setItem('myGlobalTrackerData', JSON.stringify(programs));
        filterAndSortData();
        hideModal();
    });
}

// Event Listeners
if(searchInput) searchInput.addEventListener('input', filterAndSortData);
if(countryFilter) countryFilter.addEventListener('change', filterAndSortData);
if(scholarshipFilter) scholarshipFilter.addEventListener('change', filterAndSortData);
if(sortBy) sortBy.addEventListener('change', filterAndSortData);

// Initial Run
filterAndSortData();