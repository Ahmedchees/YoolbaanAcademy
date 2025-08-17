// assets/js/results.js
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const LOGIN_PAGE = 'login.html';

  // Session values
  const token = sessionStorage.getItem('yb_token');
  const rollFromSession = (sessionStorage.getItem('yb_roll') || '').trim();

  // Guard: must have token and roll to proceed
  if (!token || !rollFromSession) {
    window.location.href = LOGIN_PAGE;
    return;
  }

  // Elements
  const profileImage = $('#profileImage');
  const studentName = $('#studentName');
  const studentRoll = $('#studentRoll');
  const studentStatus = $('#studentStatus');

  const noRecords = $('#noRecords');
  const table = $('#resultsTable');
  const tableBody = $('#resultsTable tbody');

  const summaryRow = $('#summaryRow');
  const sumTotal = $('#sumTotal');
  const avgScore = $('#avgScore');
  const overallGrade = $('#overallGrade');

  const yearSpan = $('#year');

  const hamburgerBtn = $('#hamburgerBtn');
  const hamburgerMenu = $('#hamburgerMenu');
  const menuInfo = $('#menuInfo');
  const menuLogout = $('#menuLogout');

  const infoModal = $('#infoModal');
  const closeInfo = $('#closeInfo');
  const infoGrid = $('#infoGrid');

  // Footer year
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Hamburger menu toggle
  function toggleMenu(show) {
    if (!hamburgerMenu || !hamburgerBtn) return;
    const willShow = typeof show === 'boolean' ? show : !hamburgerMenu.classList.contains('show');
    hamburgerMenu.classList.toggle('show', willShow);
    hamburgerBtn.setAttribute('aria-expanded', String(willShow));
  }
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    document.addEventListener('click', (e) => {
      if (!hamburgerMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  // Utilities
  function formatDateOnly(v) {
    if (!v) return '';
    if (typeof v === 'string') {
      if (v.includes('T')) return v.split('T')[0];
      if (v.includes(' ')) return v.split(' ')[0];
    }
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function setBusy(el, busy) {
    if (!el) return;
    el.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  // Skeletons
  function showTableSkeleton(rows = 6) {
    if (!tableBody || !table) return;
    setBusy(table, true);
    tableBody.innerHTML = '';
    const cols = 6;
    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        td.innerHTML = '<span class="skeleton-line"></span>';
        tr.appendChild(td);
      }
      tableBody.appendChild(tr);
    }
  }
  function clearTableSkeleton() {
    if (!tableBody || !table) return;
    setBusy(table, false);
    tableBody.innerHTML = '';
  }
  function showSummarySkeleton() {
    if (!summaryRow) return;
    summaryRow.classList.remove('hidden');
    setBusy(summaryRow, true);
    sumTotal.innerHTML = '<span class="skeleton-line short"></span>';
    avgScore.innerHTML = '<span class="skeleton-line short"></span>';
    overallGrade.innerHTML = '<span class="skeleton-line short"></span>';
  }
  function clearSummarySkeleton() {
    if (!summaryRow) return;
    setBusy(summaryRow, false);
    sumTotal.textContent = '';
    avgScore.textContent = '';
    overallGrade.textContent = '';
  }
  function showSummaryLoadingState() {
    if (studentName) studentName.innerHTML = '<span class="skeleton-line long"></span>';
    if (studentRoll) studentRoll.innerHTML = '<span class="skeleton-line short"></span>';
    if (studentStatus) studentStatus.innerHTML = '<span class="skeleton-line short"></span>';
  }
  function clearSummaryLoadingState() {
    if (studentName) studentName.textContent = '—';
    if (studentRoll) studentRoll.textContent = '—';
    if (studentStatus) studentStatus.textContent = '—';
  }

  function setNoRecords(message) {
    if (noRecords) {
      if (message) noRecords.textContent = message;
      noRecords.classList.remove('hidden');
    }
    if (summaryRow) summaryRow.classList.add('hidden');
  }
  function hideNoRecords() {
    if (noRecords) noRecords.classList.add('hidden');
  }

  function setStatusBadge(el, status) {
    if (!el) return;
    const s = String(status || '').toLowerCase();
    const cls = s.includes('graduate') || s.includes('active') ? 'success' : 'warning';
    el.className = `badge ${cls}`;
    el.textContent = status || '—';
  }

  // Modal helpers
  function ensureModalHidden() {
    if (infoModal && !infoModal.classList.contains('hidden')) {
      infoModal.classList.add('hidden');
    }
  }
  function openInfoModalLoading() {
    if (!infoGrid || !infoModal) return;
    infoGrid.innerHTML = `
      <div class="modal-loading">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>Loading student information...</span>
      </div>
    `;
    infoModal.classList.remove('hidden');
  }
  function closeInfoDialog() {
    if (infoModal) infoModal.classList.add('hidden');
  }
  if (closeInfo) closeInfo.addEventListener('click', closeInfoDialog);
  if (infoModal) {
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) closeInfoDialog();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !infoModal.classList.contains('hidden')) closeInfoDialog();
    });
  }

  // API
  async function postForm(action, extra = {}) {
    const form = new URLSearchParams();
    form.set('action', action);
    form.set('token', token);
    Object.entries(extra).forEach(([k, v]) => form.set(k, v));

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);

    try {
      const res = await fetch(window.YOOLBAAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: form.toString(),
        signal: ctrl.signal
      });
      clearTimeout(to);
      let json = null;
      try { json = await res.json(); } catch {}
      return { status: res.status, ok: res.ok, json };
    } catch {
      clearTimeout(to);
      return { status: 0, ok: false, json: null };
    }
  }

  // Rendering
  function renderProfile(p = {}) {
    const sessionAvatar = sessionStorage.getItem('yb_avatar') || '';
    profileImage.src = p.ProfileImage || sessionAvatar || 'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png';
    studentName.textContent = p.Name || '—';
    studentRoll.textContent = p.RollNO || p.RollNo || rollFromSession || '—';
    setStatusBadge(studentStatus, p.StudentStatus || '—');
  }

  function filterByRoll(results, roll) {
    const list = Array.isArray(results) ? results : [];
    if (!roll) return list;
    const target = String(roll).trim().toLowerCase();
    return list.filter((r) => {
      const rr = r.RollNo ?? r.RollNO ?? r.roll ?? r.StudentRoll ?? r.StudentID ?? r.StudentNo ?? '';
      return String(rr).trim().toLowerCase() === target;
    });
  }

  function renderResultsPayload(payload) {
    const profile = payload?.profile || {};
    renderProfile(profile);

    const rawResults = payload?.results || payload?.courses || [];
    const results = filterByRoll(rawResults, rollFromSession);

    if (!results.length) {
      clearTableSkeleton();
      clearSummarySkeleton();
      setNoRecords('There is no record, please contact support.');
      return;
    }

    hideNoRecords();
    clearTableSkeleton();

    const frag = document.createDocumentFragment();
    for (const r of results) {
      const tr = document.createElement('tr');
      const cells = [
        r.CourseID || r.CourseId || '',
        r.CourseName || r.Course || '',
        r.Marks ?? r.Score ?? '',
        r.Grade || '',
        r.Status || '',
        formatDateOnly(r.Date || r.ExamDate || r.UpdatedAt || '')
      ];
      for (const c of cells) {
        const td = document.createElement('td');
        td.textContent = c === null || c === undefined ? '' : c;
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }
    tableBody.appendChild(frag);

    // Summary (safe: compute only total/avg if backend didn't provide; show grade if provided)
    const backendSummary = payload?.summary && typeof payload.summary === 'object' ? payload.summary : null;
    let total = backendSummary?.total;
    let average = backendSummary?.average;
    const grade = backendSummary?.overallGrade;

    if (total == null || average == null) {
      const nums = results.map((x) => Number(x.Marks ?? x.Score) || 0);
      const t = nums.reduce((a, b) => a + b, 0);
      const a = nums.length ? t / nums.length : 0;
      total = total == null ? Math.round(t * 100) / 100 : Number(total) || 0;
      average = average == null ? Math.round(a * 100) / 100 : Number(average) || 0;
    }

    sumTotal.textContent = (total ?? 0).toString();
    avgScore.textContent = (average ?? 0).toString();
    overallGrade.textContent = grade ?? 'N/A';
    summaryRow.classList.remove('hidden');
  }

  // Menu actions
  if (menuInfo) {
    menuInfo.addEventListener('click', async () => {
      toggleMenu(false);
      openInfoModalLoading();
      const { status, json } = await postForm('info', { roll: rollFromSession });
      if (status === 401) {
        sessionStorage.removeItem('yb_token');
        window.location.href = LOGIN_PAGE;
        return;
      }
      if (json?.ok && json.info) {
        const info = json.info || {};
        const pairs = [
          ['Roll No', info.RollNo || info.RollNO || rollFromSession || '—'],
          ['Name', info.Name || '—'],
          ['Gender', info.Gender || '—'],
          ['Date of Birth', formatDateOnly(info.DateOfBirth)],
          ['Program', info.Program || '—'],
          ['Date Enrolled', formatDateOnly(info.DateEnrolled)],
          ['Student Status', info.StudentStatus || '—']
        ];
        infoGrid.innerHTML = '';
        for (const [k, v] of pairs) {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `<div class="k">${k}</div><div class="v">${v || '—'}</div>`;
          infoGrid.appendChild(div);
        }
      } else {
        infoGrid.innerHTML = `<div class="modal-loading">Unable to load info. Please try again.</div>`;
      }
    });
  }

  if (menuLogout) {
    menuLogout.addEventListener('click', async () => {
      try { await postForm('logout'); } catch {}
      sessionStorage.removeItem('yb_token');
      sessionStorage.removeItem('yb_roll');
      sessionStorage.removeItem('yb_avatar');
      window.location.href = LOGIN_PAGE;
    });
  }

  // Init
  async function init() {
    ensureModalHidden();           // Make sure modal is hidden on startup
    hideNoRecords();               // Hide empty state initially
    showSummaryLoadingState();     // Placeholder in student summary
    showSummarySkeleton();         // Placeholder in summary cards
    showTableSkeleton(6);          // Placeholder rows

    // Prefetch profile if available
    try {
      const { status, json } = await postForm('results', { roll: rollFromSession });
      if (status === 401) {
        sessionStorage.removeItem('yb_token');
        window.location.href = LOGIN_PAGE;
        return;
      }

      if (json?.ok) {
        clearSummarySkeleton();
        renderResultsPayload(json);
        return;
      }

      // Fallback to a "courses" action (some backends separate sheets)
      const fallback = await postForm('courses', { roll: rollFromSession });
      if (fallback.status === 401) {
        sessionStorage.removeItem('yb_token');
        window.location.href = LOGIN_PAGE;
        return;
      }
      if (fallback.json?.ok) {
        clearSummarySkeleton();
        renderResultsPayload(fallback.json);
        return;
      }

      throw new Error('Failed to load results');
    } catch {
      clearSummaryLoadingState();
      clearTableSkeleton();
      clearSummarySkeleton();
      setNoRecords('Unable to load results. Please try again later.');
    }
  }

  init();
})();
