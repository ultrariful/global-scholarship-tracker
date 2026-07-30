// ১. প্রাথমিক ডেটা সেট (Sample Global University Data)
const initialPrograms = [
    {
        id: 1,
        university: "Harvard University",
        country: "USA",
        program: "M.Sc. Computer Science",
        degree: "Masters",
        scholarship: "Fully Funded",
        appFee: "$105",
        deadline: "2026-12-15"
    },
    {
        id: 2,
        university: "Technical University of Munich",
        country: "Germany",
        program: "M.Sc. Data Engineering",
        degree: "Masters",
        scholarship: "Fully Funded",
        appFee: "Free",
        deadline: "2026-05-31"
    },
    {
        id: 3,
        university: "University of Oxford",
        country: "UK",
        program: "B.Sc. Artificial Intelligence",
        degree: "Bachelors",
        scholarship: "Partial",
        appFee: "£75",
        deadline: "2026-10-15"
    },
    {
        id: 4,
        university: "University of Toronto",
        country: "Canada",
        program: "PhD in Bio-Engineering",
        degree: "PhD",
        scholarship: "Fully Funded",
        appFee: "Free",
        deadline: "2026-01-15"
    },
    {
        id: 5,
        university: "University of Tokyo",
        country: "Japan",
        program: "M.Sc. Robotics",
        degree: "Masters",
        scholarship: "Partial",
        appFee: "Free",
        deadline: "2026-04-30"
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

// ২. ডাটা টেবিলে রেন্ডার করার ফাংশন
function renderTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-6 text-slate-400">No matching programs found!</td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        // Scholarship Badge Color
        let badgeClass = "bg-slate-100 text-slate-700";
        if (item.scholarship === 'Fully Funded') badgeClass = "bg-emerald-100 text-emerald-800 border border-emerald-300";
        if (item.scholarship === 'Partial') badgeClass = "bg-amber-100 text-amber-800 border border-amber-300";

        const row = document.createElement('tr');
        row.className = "border-b border-slate-100 hover:bg-slate-50 transition";
        row.innerHTML = `
            <td class="p-3">
                <div class="font-bold text-slate-800">${item.university}</div>
                <div class="text-xs text-slate-400">${item.country}</div>
            </td>
            <td class="p-3">
                <div class="font-medium text-slate-700">${item.program}</div>
                <span class="inline-block bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded">${item.degree}</span>
            </td>
            <td class="p-3">
                <span class="text-xs px-2.5 py-1 rounded-full font-semibold ${badgeClass}">
                    ${item.scholarship}
                </span>
            </td>
            <td class="p-3 text-slate-600 font-medium">${item.appFee}</td>
            <td class="p-3 text-slate-500 text-xs">${item.deadline}</td>
            <td class="p-3 text-center">
                <button onclick="deleteProgram(${item.id})" class="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded border border-red-200 hover:bg-red-50">
                    Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ৩. ড্যাশবোর্ড আপডেট করার ফাংশন
function updateDashboardStats(data) {
    totalProgramsEl.innerText = programs.length;
    fullyFundedCountEl.innerText = programs.filter(p => p.scholarship === 'Fully Funded').length;
    partialCountEl.innerText = programs.filter(p => p.scholarship === 'Partial').length;
    freeAppCountEl.innerText = programs.filter(p => p.appFee.toLowerCase() === 'free').length;
    
    showingCountEl.innerText = `Showing ${data.length} of ${programs.length} programs`;
}

// ৪. ফিল্টারিং ও সার্টিং ফাংশন
function filterAndSortData() {
    const searchValue = searchInput.value.toLowerCase();
    const selectedCountry = countryFilter.value;
    const selectedScholarship = scholarshipFilter.value;
    const selectedDegree = degreeFilter.value;
    const selectedSort = sortBy.value;

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

    renderTable(filtered);
    updateDashboardStats(filtered);
}

// ৫. প্রোগ্রাম ডিলিট করা
function deleteProgram(id) {
    programs = programs.filter(p => p.id !== id);
    localStorage.setItem('myGlobalTrackerData', JSON.stringify(programs));
    filterAndSortData();
}

// Event Listeners (ইনপুট চেঞ্জের সাথে সাথে ফিল্টার চালু হবে)
searchInput.addEventListener('input', filterAndSortData);
countryFilter.addEventListener('change', filterAndSortData);
scholarshipFilter.addEventListener('change', filterAndSortData);
degreeFilter.addEventListener('change', filterAndSortData);
sortBy.addEventListener('change', filterAndSortData);

// পেজ লোড হওয়ার সময় ফার্স্ট রান
filterAndSortData();
// Modal Elements
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const programForm = document.getElementById('programForm');

// Open Modal
addBtn.addEventListener('click', () => {
    addModal.classList.remove('hidden');
});

// Close Modal Function
const hideModal = () => {
    addModal.classList.add('hidden');
    programForm.reset();
};

closeModal.addEventListener('click', hideModal);
cancelBtn.addEventListener('click', hideModal);

// Submit Form (নতুন ডাটা যুক্ত করা)
programForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newProgram = {
        id: Date.now(), // ইউনিক আইডি
        university: document.getElementById('uniName').value,
        country: document.getElementById('uniCountry').value,
        program: document.getElementById('uniProgram').value,
        degree: document.getElementById('uniDegree').value,
        scholarship: document.getElementById('uniScholarship').value,
        appFee: document.getElementById('uniAppFee').value,
        deadline: document.getElementById('uniDeadline').value
    };

    // তালিকায় ডাটা যোগ ও LocalStorage-এ সেভ
    programs.unshift(newProgram); // একদম শুরুতে দেখাবে
    localStorage.setItem('myGlobalTrackerData', JSON.stringify(programs));

    // টেবিল ও ড্যাশবোর্ড আপডেট
    filterAndSortData();

    // মোডাল বন্ধ করা
    hideModal();
});