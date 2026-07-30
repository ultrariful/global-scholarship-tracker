// ১. প্রাথমিক ডেটা সেট (Sample Global University Data)
const initialPrograms = [
    {
        id: 1,
        university: "Harvard University",
        country: "USA",
        qsRank: "4",
        program: "M.Sc. Computer Science",
        degree: "Masters",
        research: "Artificial Intelligence",
        scholarship: "Fully Funded",
        appFee: "$105",
        profStatus: "Positive Reply",
        portal: "Direct Portal",
        deadline: "2026-12-15",
        link: "https://www.harvard.edu",
        applied: true
    },
    {
        id: 2,
        university: "Technical University of Munich",
        country: "Germany",
        qsRank: "28",
        program: "M.Sc. Data Engineering",
        degree: "Masters",
        research: "Data Science",
        scholarship: "Fully Funded",
        appFee: "Free",
        profStatus: "Emailed",
        portal: "Uni-Assist",
        deadline: "2026-05-31",
        link: "https://www.tum.de",
        applied: false
    },
    {
        id: 3,
        university: "University of Oxford",
        country: "UK",
        qsRank: "3",
        program: "B.Sc. Artificial Intelligence",
        degree: "Bachelors",
        research: "Machine Learning",
        scholarship: "Partial",
        appFee: "£75",
        profStatus: "Not Required",
        portal: "UCAS",
        deadline: "2026-10-15",
        link: "https://www.ox.ac.uk",
        applied: false
    }
];

// LocalStorage থেকে ডাটা লোড করা অথবা ডিফল্ট ডাটা সেট করা
let programs = JSON.parse(localStorage.getItem('myGlobalTrackerData')) || initialPrograms;

// HTML Elements Selection
const tableBody = document.getElementById('universityTableBody');
const searchInput = document.getElementById('searchInput');
const countryFilter = document.getElementById('countryFilter');
const scholarshipFilter = document.getElementById('scholarshipFilter');
const degreeFilter = document.getElementById('degreeFilter');
const sortBy = document.getElementById('sortBy');

// Stats Elements
const totalProgramsEl = document.getElementById('total-programs');
const fullyFundedCountEl = document.getElementById('fully-funded-count');
const partialCountEl = document.getElementById('partial-count');
const freeAppCountEl = document.getElementById('free-app-count');
const showingCountEl = document.getElementById('showing-count');

// ২. টেবিল ডিসপ্লে করার ফাংশন
function renderPrograms(dataList) {
    tableBody.innerHTML = '';

    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">No programs found matching your criteria.</td></tr>`;
        return;
    }

    dataList.forEach(item => {
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50/80 transition border-b border-slate-100";

        // Supervisor Status Badge Color
        let profBadge = "bg-slate-100 text-slate-600";
        if(item.profStatus === "Positive Reply" || item.profStatus === "Positive Response") profBadge = "bg-emerald-100 text-emerald-700 font-bold";
        if(item.profStatus === "Emailed") profBadge = "bg-amber-100 text-amber-700";

        // Link Button
        const linkBtn = item.link && item.link !== "#" && item.link !== ""
            ? `<a href="${item.link}" target="_blank" class="inline-block bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 rounded-lg text-xs font-semibold">Portal Link ↗</a>` 
            : `<span class="text-xs text-slate-400">${item.portal || 'N/A'}</span>`;

        row.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-slate-900">${item.university}</div>
                <div class="text-xs text-slate-500">${item.country} ${item.qsRank ? `• QS #${item.qsRank}` : ''}</div>
            </td>
            <td class="p-4">
                <div class="font-semibold text-slate-800">${item.program}</div>
                <div class="text-xs text-slate-500"><span class="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">${item.degree}</span> ${item.research ? `• ${item.research}` : ''}</div>
            </td>
            <td class="p-4">
                <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${item.scholarship === 'Fully Funded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                    ${item.scholarship}
                </span>
                <div class="text-xs text-slate-500 mt-1">Fee: ${item.appFee}</div>
            </td>
            <td class="p-4">
                <span class="inline-block px-2.5 py-1 rounded-lg text-xs ${profBadge}">
                    ${item.profStatus || 'N/A'}
                </span>
            </td>
            <td class="p-4">
                ${linkBtn}
            </td>
            <td class="p-4 font-medium text-slate-700">
                ${item.deadline}
                ${item.applied ? '<div class="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">✓ Applied</div>' : ''}
            </td>
            <td class="p-4 text-center">
                <button onclick="deleteProgram(${item.id})" class="text-red-500 hover:text-red-700 font-semibold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ৩. ড্যাশবোর্ড আপডেট করার ফাংশন
function updateDashboardStats(data) {
    if(totalProgramsEl) totalProgramsEl.innerText = programs.length;
    if(fullyFundedCountEl) fullyFundedCountEl.innerText = programs.filter(p => p.scholarship === 'Fully Funded').length;
    if(partialCountEl) partialCountEl.innerText = programs.filter(p => p.scholarship === 'Partial').length;
    if(freeAppCountEl) freeAppCountEl.innerText = programs.filter(p => p.appFee.toLowerCase() === 'free').length;
    
    if(showingCountEl) showingCountEl.innerText = `Showing ${data.length} of ${programs.length} programs`;
}

// ৪. ফিল্টারিং ও সর্টিং ফাংশন
function filterAndSortData() {
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCountry = countryFilter ? countryFilter.value : 'all';
    const selectedScholarship = scholarshipFilter ? scholarshipFilter.value : 'all';
    const selectedDegree = degreeFilter ? degreeFilter.value : 'all';
    const selectedSort = sortBy ? sortBy.value : 'uni';

    let filtered = programs.filter(item => {
        const matchesSearch = item.university.toLowerCase().includes(searchValue) || 
                              item.program.toLowerCase().includes(searchValue);
        const matchesCountry = selectedCountry === 'all' || item.country === selectedCountry;
        const matchesScholarship = selectedScholarship === 'all' || item.scholarship === selectedScholarship;
        const matchesDegree = selectedDegree === 'all' || item.degree === selectedDegree;

        return matchesSearch && matchesCountry && matchesScholarship && matchesDegree;
    });

    // Sort
    if (selectedSort === 'uni') {
        filtered.sort((a, b) => a.university.localeCompare(b.university));
    } else if (selectedSort === 'deadline') {
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    renderPrograms(filtered); // সংশোধিত নাম
    updateDashboardStats(filtered);
}

// ৫. প্রোগ্রাম ডিলিট করা
function deleteProgram(id) {
    programs = programs.filter(p => p.id !== id);
    localStorage.setItem('myGlobalTrackerData', JSON.stringify(programs));
    filterAndSortData();
}

// Event Listeners (ইনপুট চেঞ্জের সাথে সাথে ফিল্টার চালু হবে)
if(searchInput) searchInput.addEventListener('input', filterAndSortData);
if(countryFilter) countryFilter.addEventListener('change', filterAndSortData);
if(scholarshipFilter) scholarshipFilter.addEventListener('change', filterAndSortData);
if(degreeFilter) degreeFilter.addEventListener('change', filterAndSortData);
if(sortBy) sortBy.addEventListener('change', filterAndSortData);

// Modal Elements
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const programForm = document.getElementById('programForm');

// Open Modal
if(addBtn) {
    addBtn.addEventListener('click', () => {
        addModal.classList.remove('hidden');
    });
}

// Close Modal Function
const hideModal = () => {
    addModal.classList.add('hidden');
    programForm.reset();
};

if(closeModal) closeModal.addEventListener('click', hideModal);
if(cancelBtn) cancelBtn.addEventListener('click', hideModal);

// Submit Form (নতুন বিস্তারিত ডাটা যুক্ত করা)
if(programForm) {
    programForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newProgram = {
            id: Date.now(),
            university: document.getElementById('uniName').value,
            country: document.getElementById('uniCountry').value,
            program: document.getElementById('uniProgram').value,
            degree: document.getElementById('uniDegree').value,
            scholarship: document.getElementById('uniScholarship').value,
            appFee: document.getElementById('uniAppFee').value || "Free",
            qsRank: document.getElementById('uniQsRank').value || "N/A",
            research: document.getElementById('uniResearch').value || "",
            profStatus: document.getElementById('uniProfStatus').value,
            portal: document.getElementById('uniPortal').value || "Direct Portal",
            deadline: document.getElementById('uniDeadline').value,
            link: document.getElementById('uniLink').value || "#",
            applied: document.getElementById('uniApplied').checked
        };

        programs.unshift(newProgram);
        localStorage.setItem('myGlobalTrackerData', JSON.stringify(programs));

        filterAndSortData();
        hideModal();
    });
}

// পেজ লোড হওয়ার সময় ফার্স্ট রান
filterAndSortData();