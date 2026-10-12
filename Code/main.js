import './style.css';
import { api } from './api.js';

let loadedClinicalCases = [];
let loadedAutopsyCases = [];
const casePhotosMap = {};

function initApp() {
  // --- Elements ---
  const loginOverlay = document.getElementById('loginOverlay');
  const appContainer = document.getElementById('appContainer');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('pageTitle');
  
  // --- Init Auth ---
  if (api.isLoggedIn()) {
    showApp();
  } else {
    showLogin();
  }
  
  function showApp() {
    if (loginOverlay) {
      loginOverlay.classList.add('hidden');
      loginOverlay.classList.remove('flex');
      loginOverlay.style.display = 'none';
    }
    if (appContainer) {
      appContainer.classList.remove('opacity-0', 'pointer-events-none');
      appContainer.classList.add('opacity-100');
      appContainer.style.opacity = '1';
      appContainer.style.visibility = 'visible';
    }
    loadDashboard();
    populateCaseDatalist();
  }
  
  function showLogin() {
    if (loginOverlay) {
      loginOverlay.classList.remove('hidden');
      loginOverlay.classList.add('flex');
      loginOverlay.style.display = 'flex';
    }
    if (appContainer) {
      appContainer.classList.add('opacity-0', 'pointer-events-none');
      appContainer.classList.remove('opacity-100');
      appContainer.style.opacity = '0';
      appContainer.style.visibility = 'hidden';
    }
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = loginForm.username.value;
      const password = loginForm.password.value;
      const btn = loginForm.querySelector('button[type="submit"]');
      
      try {
        if (btn) {
          btn.textContent = 'Logging in...';
          btn.disabled = true;
        }
        await api.login(username, password);
        showApp();
      } catch (err) {
        alert(err.message || 'Login failed');
      } finally {
        if (btn) {
          btn.textContent = 'Secure Login';
          btn.disabled = false;
        }
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      api.clearToken();
      showLogin();
    });
  }
  
  // --- Navigation Logic ---
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      navLinks.forEach(l => l.classList.remove('bg-navy-800', 'text-white'));
      link.classList.add('bg-navy-800', 'text-white');
      
      const targetView = link.getAttribute('data-view');
      viewSections.forEach(sec => {
        if (sec.id === `view-${targetView}`) {
          sec.classList.remove('hidden');
          sec.classList.add('active');
          sec.style.display = 'block';
        } else {
          sec.classList.add('hidden');
          sec.classList.remove('active');
          sec.style.display = 'none';
        }
      });
      
      const addPatientBtn = document.getElementById('addPatientBtn');
      if (targetView === 'clinical') {
        if (addPatientBtn) addPatientBtn.style.display = 'inline-flex';
        const clinicalList = document.getElementById('clinicalList');
        const patientView = document.getElementById('clinicalPatientView');
        if (patientView) patientView.classList.add('hidden');
        if (clinicalList) clinicalList.classList.remove('hidden');
      } else {
        if (addPatientBtn) addPatientBtn.style.display = 'none';
      }

      if (pageTitle) pageTitle.textContent = link.textContent.trim();
      
      if (targetView === 'dashboard') loadDashboard();
      if (targetView === 'clinical') loadClinicalCases();
      if (targetView === 'autopsy') loadAutopsyCases();
      if (targetView === 'court') {
        populateCaseDatalist();
        loadCourtRecords();
      }
      if (targetView === 'search') loadSearch();
    });
  });
  
  viewSections.forEach(sec => {
    if (sec.id !== 'view-dashboard') {
      sec.style.display = 'none';
    }
  });
  
  // --- Data Loading ---
  async function loadDashboard() {
    try {
      const [statsRes, courtRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: {} })),
        api.getCourtRecords().catch(() => ({ data: [] }))
      ]);
      const data = statsRes.data || {};
      const courtData = courtRes.data || [];

      const dds = document.querySelectorAll('#view-dashboard dd');
      if (dds.length >= 4) {
        dds[0].textContent = (data.total_clinical || 0) + (data.total_autopsy || 0);
        dds[1].textContent = courtData.length || data.pending_reports || 0;
        dds[2].textContent = data.overdue_specimens || 0;
        dds[3].textContent = 0;
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    }
  }

  async function loadClinicalCases() {
    try {
      const { data } = await api.getClinicalCases();
      loadedClinicalCases = data || [];
      const tbody = document.getElementById('clinicalTableBody');
      const emptyRow = document.getElementById('clinicalEmptyRow');
      
      if (!tbody) return;
      
      if (loadedClinicalCases.length === 0) {
        if (emptyRow) emptyRow.style.display = 'table-row';
        return;
      }
      
      if (emptyRow) emptyRow.style.display = 'none';
      
      Array.from(tbody.children).forEach(child => {
        if (child.id !== 'clinicalEmptyRow') child.remove();
      });
      
      loadedClinicalCases.forEach(cCase => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">${cCase.cme_no}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${cCase.patient_name}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">${cCase.case_status}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${cCase.patient_type}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onclick="window.viewClinicalCase(${cCase.case_id}); return false;" class="text-primary-600 hover:text-primary-900 font-semibold">View Case</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Failed to load clinical cases', err);
    }
  }

  window.viewClinicalCase = function(caseId) {
    const cCase = loadedClinicalCases.find(c => c.case_id == caseId);
    if (!cCase) return;

    const mlefTitle = document.getElementById('mlefTitle');
    const mlefPatientStatus = document.getElementById('mlefPatientStatus');
    const mlefName = document.getElementById('mlefName');
    const mlefId = document.getElementById('mlefId');
    const mlefContact = document.getElementById('mlefContact');
    const mlefAddress = document.getElementById('mlefAddress');

    if (mlefTitle) mlefTitle.textContent = cCase.cme_no || 'MLEF';
    if (mlefPatientStatus) mlefPatientStatus.textContent = cCase.patient_type || 'Outpatient';
    if (mlefName) mlefName.textContent = cCase.patient_name || 'N/A';
    if (mlefId) mlefId.textContent = cCase.nic || 'N/A';
    if (mlefContact) mlefContact.textContent = cCase.contact_no || 'N/A';
    if (mlefAddress) mlefAddress.textContent = cCase.address || 'N/A';

    const photoGrid = document.getElementById('photoGrid');
    if (photoGrid) {
      const existingCards = photoGrid.querySelectorAll('.dynamic-photo-card');
      existingCards.forEach(card => card.remove());

      const photos = casePhotosMap[caseId] || [];
      photos.forEach(src => {
        const div = document.createElement('div');
        div.className = 'dynamic-photo-card border border-slate-200 rounded-xl overflow-hidden aspect-square bg-slate-100 cursor-pointer shadow-sm hover:opacity-90 transition-opacity';
        div.onclick = () => window.openLightbox?.(src);
        div.innerHTML = `<img src="${src}" class="w-full h-full object-cover">`;
        photoGrid.insertBefore(div, photoGrid.firstChild);
      });
    }
    window.currentActiveCaseId = caseId;

    viewSections.forEach(sec => {
      if (sec.id === 'view-clinical') {
        sec.classList.remove('hidden');
        sec.classList.add('active');
        sec.style.display = 'block';
      } else {
        sec.classList.add('hidden');
        sec.classList.remove('active');
        sec.style.display = 'none';
      }
    });

    navLinks.forEach(l => l.classList.remove('bg-navy-800', 'text-white'));
    const clinicalNav = document.querySelector('.nav-link[data-view="clinical"]');
    if (clinicalNav) clinicalNav.classList.add('bg-navy-800', 'text-white');

    if (pageTitle) pageTitle.textContent = 'Clinical Registry';

    const addPatientBtn = document.getElementById('addPatientBtn');
    if (addPatientBtn) addPatientBtn.style.display = 'none';

    const clinicalList = document.getElementById('clinicalList');
    const patientView = document.getElementById('clinicalPatientView');
    
    if (clinicalList) clinicalList.classList.add('hidden');
    if (patientView) patientView.classList.remove('hidden');

    if (typeof feather !== 'undefined') feather.replace();
  };

  const backToListBtn = document.getElementById('backToListBtn');
  if (backToListBtn) {
    backToListBtn.addEventListener('click', () => {
      const clinicalList = document.getElementById('clinicalList');
      const patientView = document.getElementById('clinicalPatientView');
      if (patientView) patientView.classList.add('hidden');
      if (clinicalList) clinicalList.classList.remove('hidden');
    });
  }

  // Section Row Builders
  const addReportRowBtn = document.getElementById('addReportRowBtn');
  const reportsList = document.getElementById('reportsList');
  if (addReportRowBtn && reportsList) {
    addReportRowBtn.addEventListener('click', () => {
      const newRow = document.createElement('div');
      newRow.className = 'flex items-center gap-4 p-3 border border-slate-200 rounded-lg bg-white shadow-sm';
      newRow.innerHTML = `
        <div class="w-1/3">
          <select class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white py-1.5">
            <option>Blood Examination</option>
            <option>Toxicology Analysis</option>
            <option>X-Ray / Radiological</option>
            <option>Histopathology</option>
          </select>
        </div>
        <div class="flex-1 flex items-center">
          <label class="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 shadow-sm flex items-center cursor-pointer text-xs font-semibold border border-slate-200">
            <i data-feather="upload" class="w-3.5 h-3.5 mr-1.5"></i> Upload Scan
            <input type="file" class="hidden" />
          </label>
        </div>
      `;
      reportsList.appendChild(newRow);
      if (typeof feather !== 'undefined') feather.replace();
    });
  }

  const addReferralRowBtn = document.getElementById('addReferralRowBtn');
  const referralsList = document.getElementById('referralsList');
  if (addReferralRowBtn && referralsList) {
    addReferralRowBtn.addEventListener('click', () => {
      const newRow = document.createElement('div');
      newRow.className = 'flex items-center gap-4 p-3 border border-slate-200 rounded-lg bg-white shadow-sm';
      newRow.innerHTML = `
        <div class="w-1/3">
          <input type="text" placeholder="Specialization (e.g. ENT / Neuro)" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5">
        </div>
        <div class="w-1/3">
          <input type="text" placeholder="Consultant Name" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5">
        </div>
        <div class="flex-1 flex items-center">
          <label class="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 shadow-sm flex items-center cursor-pointer text-xs font-semibold border border-slate-200">
            <i data-feather="upload" class="w-3.5 h-3.5 mr-1.5"></i> Referral Note
            <input type="file" class="hidden" />
          </label>
        </div>
      `;
      referralsList.appendChild(newRow);
      if (typeof feather !== 'undefined') feather.replace();
    });
  }

  const addCourtSummonsBtn = document.getElementById('addCourtSummonsBtn');
  const courtSummonsList = document.getElementById('courtSummonsList');
  if (addCourtSummonsBtn && courtSummonsList) {
    addCourtSummonsBtn.addEventListener('click', () => {
      const newRow = document.createElement('div');
      newRow.className = 'flex items-center gap-4 p-3 border border-purple-200 rounded-lg bg-purple-50/50 shadow-sm';
      newRow.innerHTML = `
        <div class="w-1/3">
          <input type="text" placeholder="Court Name (e.g. High Court)" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5">
        </div>
        <div class="w-1/3">
          <input type="date" class="block w-full border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-1.5 bg-white">
        </div>
        <div class="flex-1 flex items-center">
          <label class="px-4 py-1.5 bg-white text-purple-700 rounded-md hover:bg-purple-100 shadow-sm flex items-center cursor-pointer text-xs font-semibold border border-purple-300">
            <i data-feather="upload" class="w-3.5 h-3.5 mr-1.5"></i> Summons Scan
            <input type="file" class="hidden" />
          </label>
        </div>
      `;
      courtSummonsList.appendChild(newRow);
      if (typeof feather !== 'undefined') feather.replace();
    });
  }

  const photoFileInput = document.getElementById('photoFileInput');
  if (photoFileInput) {
    photoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const objectUrl = URL.createObjectURL(file);
        const caseId = window.currentActiveCaseId;
        if (caseId) {
          if (!casePhotosMap[caseId]) casePhotosMap[caseId] = [];
          casePhotosMap[caseId].push(objectUrl);
          window.viewClinicalCase(caseId);
        }
      }
    });
  }
  
  async function loadAutopsyCases() {
    try {
      const { data } = await api.getAutopsyCases();
      loadedAutopsyCases = data || [];
      const tbody = document.getElementById('autopsyTableBody');
      const emptyRow = document.getElementById('autopsyEmptyRow');
      
      if (!tbody) return;
      
      if (loadedAutopsyCases.length === 0) {
        if (emptyRow) emptyRow.style.display = 'table-row';
        return;
      }
      
      if (emptyRow) emptyRow.style.display = 'none';
      
      Array.from(tbody.children).forEach(child => {
        if (child.id !== 'autopsyEmptyRow') child.remove();
      });
      
      loadedAutopsyCases.forEach(aCase => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">${aCase.pm_no || aCase.morgue_no}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${aCase.patient_name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${aCase.verdict || 'Pending'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${aCase.pm_date ? aCase.pm_date.split('T')[0] : 'N/A'}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">${aCase.case_status}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-400">
            Active
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Failed to load autopsy cases', err);
    }
  }

  async function loadCourtRecords() {
    try {
      const { data } = await api.getCourtRecords();
      const tbody = document.getElementById('courtRecordsTableBody');
      const emptyRow = document.getElementById('courtEmptyRow');
      if (!tbody) return;

      if (data.length === 0) {
        if (emptyRow) emptyRow.style.display = 'table-row';
        return;
      }

      if (emptyRow) emptyRow.style.display = 'none';

      Array.from(tbody.children).forEach(child => {
        if (child.id !== 'courtEmptyRow') child.remove();
      });

      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">${item.case_ref || 'N/A'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${item.court_name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${item.case_number || 'N/A'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${item.date_of_court_visit ? item.date_of_court_visit.split('T')[0] : 'N/A'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-medium">${item.document_name ? `📄 ${item.document_name}` : 'None'}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Summons Logged</span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Failed to load court records', err);
    }
  }
  
  async function loadSearch() {
    try {
      const [clinical, autopsy] = await Promise.all([
        api.getClinicalCases().catch(() => ({ data: [] })),
        api.getAutopsyCases().catch(() => ({ data: [] }))
      ]);
      
      const tbody = document.getElementById('searchResultsTableBody');
      const queryInput = document.getElementById('searchQueryInput')?.value.toLowerCase().trim() || '';
      const typeFilter = document.getElementById('searchTypeSelect')?.value || 'All';
      const statusFilter = document.getElementById('searchStatusSelect')?.value || 'All';
      const dateFrom = document.getElementById('searchDateFromInput')?.value || '';
      const dateTo = document.getElementById('searchDateToInput')?.value || '';

      if (!tbody) return;
      tbody.innerHTML = '';
      
      let allCases = [
        ...(clinical.data || []).map(c => ({
          _type: 'Clinical',
          _no: c.cme_no || 'N/A',
          _name: c.patient_name || 'N/A',
          _nic: c.nic || '',
          _date: c.examined_date ? c.examined_date.split('T')[0] : 'N/A',
          _status: c.case_status || 'Active',
          _id: c.case_id
        })),
        ...(autopsy.data || []).map(a => ({
          _type: 'Autopsy',
          _no: a.pm_no || a.morgue_no || 'N/A',
          _name: a.patient_name || 'Deceased',
          _nic: '',
          _date: a.pm_date ? a.pm_date.split('T')[0] : 'N/A',
          _status: a.case_status || 'Closed',
          _id: a.case_id
        }))
      ];

      const datalist = document.getElementById('globalSearchDatalist');
      if (datalist) {
        const suggestions = new Set();
        allCases.forEach(c => {
          if (c._no && c._no !== 'N/A') suggestions.add(c._no);
          if (c._name && c._name !== 'N/A' && c._name !== 'Deceased') suggestions.add(c._name);
          if (c._nic) suggestions.add(c._nic);
        });
        datalist.innerHTML = Array.from(suggestions)
          .map(s => `<option value="${s}"></option>`)
          .join('');
      }

      if (typeFilter !== 'All') {
        allCases = allCases.filter(c => c._type === typeFilter);
      }
      if (statusFilter !== 'All') {
        allCases = allCases.filter(c => c._status.toLowerCase().includes(statusFilter.toLowerCase()));
      }
      if (dateFrom) {
        allCases = allCases.filter(c => c._date !== 'N/A' && c._date >= dateFrom);
      }
      if (dateTo) {
        allCases = allCases.filter(c => c._date !== 'N/A' && c._date <= dateTo);
      }
      if (queryInput) {
        allCases = allCases.filter(c => 
          c._no.toLowerCase().includes(queryInput) ||
          c._name.toLowerCase().includes(queryInput) ||
          c._nic.toLowerCase().includes(queryInput)
        );
      }

      if (allCases.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="px-6 py-10 text-center text-sm text-slate-400">
              No matching records found for the selected filters.
            </td>
          </tr>
        `;
        return;
      }

      allCases.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">${c._no}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-slate-900 font-medium">${c._name}</div>
            ${c._nic ? `<div class="text-xs text-slate-500">${c._nic}</div>` : ''}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${c._type === 'Clinical' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">
              ${c._type}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${c._date}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">${c._status}</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button onclick="if('${c._type}'==='Clinical'){ window.viewClinicalCase(${c._id}); } else { alert('Opening Autopsy case: ${c._no}'); }" class="text-primary-600 hover:text-primary-900 font-semibold">View Case</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
    } catch (err) {
      console.error('Search failed', err);
    }
  }

  // Live search bindings
  const searchQueryInput = document.getElementById('searchQueryInput');
  searchQueryInput?.addEventListener('input', loadSearch);

  const searchTypeSelect = document.getElementById('searchTypeSelect');
  searchTypeSelect?.addEventListener('change', loadSearch);

  const searchStatusSelect = document.getElementById('searchStatusSelect');
  searchStatusSelect?.addEventListener('change', loadSearch);

  const searchDateFromInput = document.getElementById('searchDateFromInput');
  searchDateFromInput?.addEventListener('change', loadSearch);

  const searchDateToInput = document.getElementById('searchDateToInput');
  searchDateToInput?.addEventListener('change', loadSearch);

  const searchResetBtn = document.getElementById('searchResetBtn');
  searchResetBtn?.addEventListener('click', () => {
    document.getElementById('globalSearchForm')?.reset();
    loadSearch();
  });

  async function populateCaseDatalist() {
    const datalist = document.getElementById('caseRefDatalist');
    if (!datalist) return;
    datalist.innerHTML = '';

    try {
      const [clinical, autopsy] = await Promise.all([
        api.getClinicalCases().catch(() => ({ data: [] })),
        api.getAutopsyCases().catch(() => ({ data: [] }))
      ]);

      const cases = [
        ...(clinical.data || []).map(c => c.cme_no).filter(Boolean),
        ...(autopsy.data || []).map(a => a.pm_no || a.morgue_no).filter(Boolean)
      ];

      cases.forEach(caseNo => {
        const option = document.createElement('option');
        option.value = caseNo;
        datalist.appendChild(option);
      });
    } catch (err) {
      console.error('Failed to populate case reference datalist', err);
    }
  }

  // --- Onboarding Modal Logic & Step Navigation ---
  const onboardingModal = document.getElementById('onboardingModal');
  const addPatientBtns = document.querySelectorAll('#addPatientBtn, #addPatientBtn2');
  const closeOnboardingBtn = document.getElementById('closeOnboarding');
  
  const obStepLabel = document.getElementById('obStepLabel');
  const obProgress = document.getElementById('obProgress');
  const obStep1 = document.getElementById('obStep1');
  const obStep2 = document.getElementById('obStep2');
  const obStep3 = document.getElementById('obStep3');
  const obBtnClinical = document.getElementById('obBtnClinical');
  const obBtnAutopsy = document.getElementById('obBtnAutopsy');
  const obBackTo1 = document.getElementById('obBackTo1');
  const obBackTo2 = document.getElementById('obBackTo2');
  const obNextTo3 = document.getElementById('obNextTo3');
  const obStatusRadios = document.querySelectorAll('input[name="obStatus"]');
  const obInwardDetails = document.getElementById('obInwardDetails');
  const obDropzone = document.getElementById('obDropzone');
  const obFileInput = document.getElementById('obFileInput');
  const obPreview = document.getElementById('obPreview');
  const obPreviewImg = document.getElementById('obPreviewImg');
  const obFinish = document.getElementById('obConfirmSave') || document.getElementById('obFinish');

  function resetOnboarding() {
    if (!onboardingModal) return;
    obStep1?.classList.remove('hidden');
    obStep2?.classList.add('hidden');
    obStep3?.classList.add('hidden');
    if (obProgress) obProgress.style.width = '33.3%';
    if (obStepLabel) obStepLabel.textContent = 'Step 1 of 3 — Select Registry Type';
    obStatusRadios.forEach(r => r.checked = false);
    obInwardDetails?.classList.add('hidden');
    if (obNextTo3) obNextTo3.disabled = true;
    obDropzone?.classList.remove('hidden');
    obPreview?.classList.remove('hidden');
    obFinish?.classList.remove('hidden');

    const prevName = document.getElementById('prevName');
    const prevId = document.getElementById('prevId');
    const prevContact = document.getElementById('prevContact');
    const prevAddress = document.getElementById('prevAddress');
    const prevPoliceStation = document.getElementById('prevPoliceStation');
    const prevExaminedDate = document.getElementById('prevExaminedDate');

    if (prevName) prevName.value = '';
    if (prevId) prevId.value = '';
    if (prevContact) prevContact.value = '';
    if (prevAddress) prevAddress.value = '';
    if (prevPoliceStation) prevPoliceStation.value = '';
    if (prevExaminedDate) prevExaminedDate.value = new Date().toISOString().split('T')[0];
  }

  if (onboardingModal) {
    addPatientBtns.forEach(btn => btn?.addEventListener('click', () => {
      resetOnboarding();
      onboardingModal.classList.remove('hidden');
      onboardingModal.classList.add('flex');
    }));
    
    closeOnboardingBtn?.addEventListener('click', () => {
      onboardingModal.classList.add('hidden');
      onboardingModal.classList.remove('flex');
    });
  }

  if (obBtnClinical) {
    obBtnClinical.addEventListener('click', () => {
      obStep1?.classList.add('hidden');
      obStep2?.classList.remove('hidden');
      if (obProgress) obProgress.style.width = '66.6%';
      if (obStepLabel) obStepLabel.textContent = 'Step 2 of 3 — Clinical Patient Status';
    });
  }

  if (obBtnAutopsy) {
    obBtnAutopsy.addEventListener('click', () => {
      alert('Autopsy onboarding flow is coming soon.');
    });
  }

  if (obBackTo1) {
    obBackTo1.addEventListener('click', () => {
      obStep2?.classList.add('hidden');
      obStep1?.classList.remove('hidden');
      if (obProgress) obProgress.style.width = '33.3%';
      if (obStepLabel) obStepLabel.textContent = 'Step 1 of 3 — Select Registry Type';
    });
  }

  if (obStatusRadios.length) {
    obStatusRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (obNextTo3) obNextTo3.disabled = false;
        if (e.target.value === 'inward') {
          obInwardDetails?.classList.remove('hidden');
        } else {
          obInwardDetails?.classList.add('hidden');
        }
      });
    });
  }

  if (obNextTo3) {
    obNextTo3.addEventListener('click', () => {
      obStep2?.classList.add('hidden');
      obStep3?.classList.remove('hidden');
      if (obProgress) obProgress.style.width = '100%';
      if (obStepLabel) obStepLabel.textContent = 'Step 3 of 3 — Patient Details & MLEF Form';
      obPreview?.classList.remove('hidden');
      obFinish?.classList.remove('hidden');
    });
  }

  if (obBackTo2) {
    obBackTo2.addEventListener('click', () => {
      obStep3?.classList.add('hidden');
      obStep2?.classList.remove('hidden');
      if (obProgress) obProgress.style.width = '66.6%';
      if (obStepLabel) obStepLabel.textContent = 'Step 2 of 3 — Clinical Patient Status';
    });
  }

  if (obDropzone && obFileInput) {
    obDropzone.addEventListener('click', (e) => {
      if (e.target !== obFileInput) obFileInput.click();
    });

    obFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(file);
          if (obPreviewImg) obPreviewImg.src = objectUrl;
        }
        obDropzone.classList.add('hidden');
        obPreview?.classList.remove('hidden');
        obFinish?.classList.remove('hidden');
      }
    });
  }

  if (obFinish) {
    obFinish.addEventListener('click', async () => {
      const name = document.getElementById('prevName')?.value?.trim();
      const nic = document.getElementById('prevId')?.value?.trim() || 'N/A';
      const contact = document.getElementById('prevContact')?.value?.trim() || 'N/A';
      const address = document.getElementById('prevAddress')?.value?.trim() || 'N/A';
      const examinedDate = document.getElementById('prevExaminedDate')?.value || new Date().toISOString().split('T')[0];
      const patientType = document.querySelector('input[name="obStatus"]:checked')?.value === 'inward' ? 'Inward' : 'Outpatient';

      if (!name) {
        alert('Please enter a patient name before registering.');
        return;
      }

      try {
        obFinish.innerHTML = '<i data-feather="loader" class="w-4 h-4 animate-spin"></i> Registering Patient...';
        obFinish.disabled = true;

        // 1. Create Patient in DB
        const pRes = await api.createPatient({
          full_name: name,
          nic: nic,
          sex: 'Male',
          address: address,
          contact_no: contact
        });

        const patientId = pRes.data.patient_id;

        // 2. Create Clinical Case in DB
        const cRes = await api.createClinicalCase({
          patient_id: patientId,
          patient_type: patientType,
          examined_date: examinedDate
        });

        const newCaseId = cRes.data?.case_id;
        const uploadedImgSrc = obPreviewImg?.src;
        if (newCaseId && uploadedImgSrc) {
          casePhotosMap[newCaseId] = [uploadedImgSrc];
        }

        // 3. Close Modal & Refresh Clinical List
        onboardingModal?.classList.add('hidden');
        onboardingModal?.classList.remove('flex');
        
        await loadClinicalCases();
        await loadDashboard();

        // 4. Immediately open Stage 2 Case Management Page for this new case!
        if (newCaseId) {
          window.viewClinicalCase(newCaseId);
        }
      } catch (err) {
        alert(`Failed to save patient: ${err.message}`);
      } finally {
        obFinish.innerHTML = '<i data-feather="check-circle" class="w-4 h-4"></i> Confirm &amp; Register Patient';
        obFinish.disabled = false;
        if (typeof feather !== 'undefined') feather.replace();
      }
    });
  }

  // --- Court Tracking Modal Logic ---
  const courtDropzone = document.getElementById('courtDropzone');
  const receiptUpload = document.getElementById('receipt-upload');
  const courtFilePreviewText = document.getElementById('courtFilePreviewText');

  if (courtDropzone && receiptUpload) {
    courtDropzone.addEventListener('click', (e) => {
      if (e.target !== receiptUpload) receiptUpload.click();
    });

    receiptUpload.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (courtFilePreviewText) {
          courtFilePreviewText.textContent = `✓ Attached File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
          courtFilePreviewText.className = 'text-xs text-emerald-600 font-semibold mt-1 block';
        }
      }
    });
  }

  const courtSummonsModal = document.getElementById('courtSummonsModal');
  const openCourtModalBtn = document.getElementById('openCourtModalBtn');
  const closeCourtModalBtn = document.getElementById('closeCourtModalBtn');
  const courtTrackingForm = document.getElementById('courtTrackingForm');

  if (openCourtModalBtn && courtSummonsModal) {
    openCourtModalBtn.addEventListener('click', () => {
      courtSummonsModal.classList.remove('hidden');
      courtSummonsModal.classList.add('flex');
    });
  }

  function closeCourtModal() {
    if (courtSummonsModal) {
      courtSummonsModal.classList.add('hidden');
      courtSummonsModal.classList.remove('flex');
    }
    if (courtTrackingForm) courtTrackingForm.reset();
    if (courtFilePreviewText) {
      courtFilePreviewText.textContent = 'Supports PDF, JPEG, PNG up to 25MB';
      courtFilePreviewText.className = 'text-xs text-slate-500 mt-1 font-medium';
    }
  }

  if (closeCourtModalBtn) {
    closeCourtModalBtn.addEventListener('click', closeCourtModal);
  }

  const courtCancelBtn = document.getElementById('courtCancelBtn');
  if (courtCancelBtn) {
    courtCancelBtn.addEventListener('click', closeCourtModal);
  }

  if (courtTrackingForm) {
    courtTrackingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const caseRef = document.getElementById('courtCaseRefInput')?.value;
      const courtName = document.getElementById('courtNameInput')?.value;
      const courtCaseNo = document.getElementById('courtCaseNoInput')?.value;
      const trialDate = document.getElementById('courtTrialDateInput')?.value;
      const attachedFile = receiptUpload?.files?.[0]?.name;

      if (!caseRef || !courtName) {
        alert('Please enter both the Case Reference and Court Name.');
        return;
      }

      try {
        await api.createCourtRecord({
          case_ref: caseRef,
          court_name: courtName,
          case_number: courtCaseNo,
          date_of_court_visit: trialDate,
          document_name: attachedFile
        });

        alert(`Court Summons Record Saved to Database Successfully!\n\nReference: ${caseRef}\nCourt: ${courtName}\nCourt Case No: ${courtCaseNo || 'N/A'}\nTrial Date: ${trialDate || 'N/A'}\nAttached Document: ${attachedFile || 'None'}`);
        closeCourtModal();
        await loadCourtRecords();
      } catch (err) {
        alert(`Failed to save court record: ${err.message}`);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
