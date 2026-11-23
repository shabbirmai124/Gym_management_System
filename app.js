const state = {
  user: null,
  mode: 'login',
  roleType: 'admin',
  tab: 'dashboard',
  memberSearch: '',
  memberStatus: 'all',
  attendanceDate: '',
  rates: [],
  members: [],
  attendance: [],
  equipment: [],
  transactions: [],
  staffs: [],
  admins: [],
  announcements: [],
  reminders: [],
  classes: [],
  assessments: [],
  dashboard: null,
};

function downloadCsv(filename, headers, rows) {
  const escapeCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

const el = (id) => document.getElementById(id);

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

async function api(action, options = {}, id = null) {
  const url = id
    ? `api.php?action=${encodeURIComponent(action)}&id=${encodeURIComponent(id)}`
    : `api.php?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function openModal(title, html, onBind) {
  el('modal-title').textContent = title;
  el('modal-body').innerHTML = html;
  el('modal-backdrop').classList.remove('hidden');
  if (onBind) onBind();
}

function closeModal() {
  el('modal-backdrop').classList.add('hidden');
}

function showInlineError(msg) {
  const box = el('page-error');
  if (box) {
    box.textContent = msg;
    box.classList.remove('hidden');
  }
}

// ── Auth Screen ─────────────────────────────────────────────────────────────
async function initAuthScreen() {
  try {
    const rates = await api('public_rates');
    el('reg-rate').innerHTML = rates
      .map((r) => `<option value="${r.rate_id}">${esc(r.name)} ($${Number(r.charge).toFixed(2)})</option>`)
      .join('');
  } catch {}

  try {
    const res = await api('me');
    state.user = res.user;
    enterApp();
  } catch {
    el('auth-view').classList.remove('hidden');
    el('app-view').classList.add('hidden');
  }
}

document.querySelectorAll('.role-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.roleType = btn.dataset.role;
    document.querySelectorAll('.role-btn').forEach((b) => b.classList.toggle('active', b === btn));
  });
});

document.querySelectorAll('.demo-card').forEach((card) => {
  card.addEventListener('click', () => {
    state.mode = 'login';
    state.roleType = card.dataset.role;
    el('tab-login').classList.add('active');
    el('tab-register').classList.remove('active');
    el('register-fields').classList.add('hidden');
    el('role-field').classList.remove('hidden');
    el('demo-accounts').classList.remove('hidden');
    document.querySelectorAll('.role-btn').forEach((b) => b.classList.toggle('active', b.dataset.role === state.roleType));
    el('auth-username').value = card.dataset.user;
    el('auth-password').value = card.dataset.pass;
    el('auth-error').classList.add('hidden');
  });
});

el('tab-login').addEventListener('click', () => {
  state.mode = 'login';
  el('tab-login').classList.add('active');
  el('tab-register').classList.remove('active');
  el('auth-heading').textContent = 'Sign in to your account';
  el('auth-subtitle').textContent = 'Choose a role and enter your credentials or pick a seeded account below.';
  el('auth-submit-btn').textContent = 'Sign In →';
  el('register-fields').classList.add('hidden');
  el('role-field').classList.remove('hidden');
  el('demo-accounts').classList.remove('hidden');
  el('auth-error').classList.add('hidden');
});

el('tab-register').addEventListener('click', () => {
  state.mode = 'register';
  el('tab-register').classList.add('active');
  el('tab-login').classList.remove('active');
  el('auth-heading').textContent = 'Create a member account';
  el('auth-subtitle').textContent = 'Register as a new gym member and select your membership plan.';
  el('auth-submit-btn').textContent = 'Complete Registration →';
  el('register-fields').classList.remove('hidden');
  el('role-field').classList.add('hidden');
  el('demo-accounts').classList.add('hidden');
  el('auth-username').value = '';
  el('auth-password').value = '';
  el('auth-error').classList.add('hidden');
});

el('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  el('auth-error').classList.add('hidden');
  try {
    if (state.mode === 'login') {
      const res = await api('login', {
        method: 'POST',
        body: JSON.stringify({
          username: el('auth-username').value,
          password: el('auth-password').value,
          roleType: state.roleType,
        }),
      });
      state.user = res.user;
    } else {
      const res = await api('register', {
        method: 'POST',
        body: JSON.stringify({
          fullname: el('reg-fullname').value,
          contact_number: el('reg-contact').value,
          rate_id: el('reg-rate').value,
          username: el('auth-username').value,
          password: el('auth-password').value,
        }),
      });
      state.user = res.user;
    }
    state.tab = 'dashboard';
    enterApp();
  } catch (err) {
    el('auth-error').textContent = err.message;
    el('auth-error').classList.remove('hidden');
  }
});

el('logout-btn').addEventListener('click', async () => {
  await api('logout', { method: 'POST' }).catch(() => {});
  state.user = null;
  el('app-view').classList.add('hidden');
  el('auth-view').classList.remove('hidden');
});

el('modal-close').addEventListener('click', closeModal);
el('refresh-btn').addEventListener('click', () => loadData().then(renderTab));

el('menu-toggle').addEventListener('click', () => {
  el('sidebar').classList.toggle('open');
  el('mobile-overlay').classList.toggle('hidden');
});
el('mobile-overlay').addEventListener('click', () => {
  el('sidebar').classList.remove('open');
  el('mobile-overlay').classList.add('hidden');
});

async function enterApp() {
  el('auth-view').classList.add('hidden');
  el('app-view').classList.remove('hidden');
  el('user-badge').innerHTML = `
    <strong>${esc(state.user.name)}</strong>
    <div class="user-card-meta">
      <span>@${esc(state.user.username)}</span>
      <span class="role-pill">${esc(state.user.roleLabel)}</span>
    </div>`;
  el('page-subtitle').textContent = `Signed in as ${state.user.name} (${state.user.roleLabel})`;
  renderNav();
  await loadData();
  renderTab();
}

async function loadData() {
  const jobs = [
    api('dashboard').then((d) => (state.dashboard = d)),
    api('members').then((d) => (state.members = d)),
    api('rates').then((d) => (state.rates = d)),
    api('attendance').then((d) => (state.attendance = d)),
    api('equipment').then((d) => (state.equipment = d)),
    api('transactions').then((d) => (state.transactions = d)),
    api('announcements').then((d) => (state.announcements = d)),
    api('reminders').then((d) => (state.reminders = d)),
    api('classes').then((d) => (state.classes = d)),
    api('assessments').then((d) => (state.assessments = d)),
  ];
  if (state.user.roleType !== 'member') {
    jobs.push(api('staffs').then((d) => (state.staffs = d)));
  } else {
    state.staffs = [];
  }
  if (state.user.roleType === 'admin') {
    jobs.push(api('admins').then((d) => (state.admins = d)));
  } else {
    state.admins = [];
  }
  await Promise.all(jobs);
}

function getTabs() {
  return [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'members', label: state.user.roleType === 'member' ? 'My Membership' : 'Members' },
    { id: 'rates', label: 'Membership Plans' },
    { id: 'classes', label: 'Workout Classes' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'assessments', label: 'BMI & Progress' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'transactions', label: 'Transactions' },
    ...(state.user.roleType !== 'member' ? [{ id: 'staffs', label: 'Staff Directory' }] : []),
    { id: 'announcements', label: 'Notices & Reminders' },
  ];
}

function switchTab(tabId) {
  state.tab = tabId;
  const tabObj = getTabs().find((t) => t.id === tabId);
  el('page-title').textContent = tabObj ? tabObj.label : 'Dashboard';
  el('sidebar').classList.remove('open');
  el('mobile-overlay').classList.add('hidden');
  renderNav();
  renderTab();
}

function renderNav() {
  const tabs = getTabs();
  el('nav-list').innerHTML = tabs
    .map((t) => `<button type="button" class="nav-btn ${state.tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`)
    .join('');

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function formatTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? val : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderTab() {
  const root = el('main-content');
  const canEdit = state.user.roleType === 'admin' || state.user.roleType === 'staff';
  const isAdmin = state.user.roleType === 'admin';
  const isMember = state.user.roleType === 'member';

  if (state.tab === 'dashboard' && state.dashboard) {
    const d = state.dashboard;
    const maxPlan = Math.max(1, ...d.planBreakdown.map((p) => Number(p.memberCount || 0)));
    root.innerHTML = `
      <div class="kpi-grid">
        <button type="button" class="kpi-card" data-go="${isMember ? 'members' : 'members'}">
          <div class="kpi-label">${isMember ? 'Active Plans' : 'Total Members'}</div>
          <div class="kpi-val">${isMember ? d.planBreakdown.length : d.totalMembers}</div>
          <div class="kpi-sub">${isMember ? 'Available gym packages' : `${d.activeMembers} active memberships`}</div>
        </button>
        <button type="button" class="kpi-card" data-go="transactions">
          <div class="kpi-label">${isMember ? 'Total Paid' : 'Total Revenue'}</div>
          <div class="kpi-val">$${Number(d.totalRevenue).toFixed(2)}</div>
          <div class="kpi-sub">${d.recentTransactions.length} recent transactions</div>
        </button>
        <button type="button" class="kpi-card" data-go="equipment">
          <div class="kpi-label">Equipment Assets</div>
          <div class="kpi-val">${d.totalEquipmentUnits}</div>
          <div class="kpi-sub">$${Number(d.totalEquipmentValue).toLocaleString()} inventory value</div>
        </button>
        <button type="button" class="kpi-card" data-go="attendance">
          <div class="kpi-label">Attendance Logs</div>
          <div class="kpi-val">${d.attendanceRecordsCount}</div>
          <div class="kpi-sub">${d.presentToday} checked in today</div>
        </button>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-header">
            <h3>Recent Transactions</h3>
            <button type="button" class="link-btn" data-go="transactions">View all</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Member</th><th>Description</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${d.recentTransactions.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--muted)">No transactions yet.</td></tr>' :
                  d.recentTransactions.map((t) => `
                    <tr>
                      <td><strong>${esc(t.member_name)}</strong></td>
                      <td>${esc(t.description || 'Payment')}</td>
                      <td>${new Date(t.transaction_date).toLocaleDateString()}</td>
                      <td style="text-align:right;color:var(--success);font-weight:700">$${Number(t.amount).toFixed(2)}</td>
                    </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Membership Plans</h3>
            <button type="button" class="link-btn" data-go="rates">Manage</button>
          </div>
          ${d.planBreakdown.map((p) => {
            const pct = Math.max(8, (Number(p.memberCount || 0) / maxPlan) * 100);
            return `
              <div class="plan-bar-row">
                <div class="plan-bar-label">
                  <strong>${esc(p.name)}</strong>
                  <span style="color:var(--muted)">${p.memberCount} members • $${Number(p.charge).toFixed(0)}</span>
                </div>
                <div class="plan-bar-track"><div class="plan-bar-fill" style="width:${pct}%"></div></div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Latest Announcements</h3>
          <button type="button" class="link-btn" data-go="announcements">Open board</button>
        </div>
        <div class="ann-grid">
          ${d.recentAnnouncements.slice(0, 3).map((a) => `
            <div class="ann-item">
              <div class="ann-date">${esc(a.announcement_date)}</div>
              <p style="margin-top:6px;font-size:0.88rem">${esc(a.message)}</p>
            </div>`).join('')}
        </div>
      </div>`;
    root.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => switchTab(b.dataset.go)));
    return;
  }

  if (state.tab === 'members') {
    const filtered = state.members.filter((m) => {
      const q = state.memberSearch.toLowerCase();
      const hit = m.fullname.toLowerCase().includes(q) || m.username.toLowerCase().includes(q) || (m.contact_number || '').toLowerCase().includes(q);
      const st = state.memberStatus === 'all' || m.status === state.memberStatus;
      return hit && st;
    });

    root.innerHTML = `
      <div id="page-error" class="alert-error hidden"></div>
      <div class="toolbar">
        <div class="filter-group">
          <input id="mem-search" class="search-input" type="text" placeholder="Search members..." value="${esc(state.memberSearch)}" />
          <select id="mem-status" class="search-input" style="width:auto">
            <option value="all" ${state.memberStatus === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="active" ${state.memberStatus === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${state.memberStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
        ${canEdit ? `<button class="btn btn-primary" id="add-member-btn">+ Add Member</button>` : ''}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Plan</th><th>Contact</th><th>Registered</th><th>Status</th>${canEdit ? '<th style="text-align:right">Actions</th>' : ''}</tr></thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="${canEdit ? 6 : 5}" style="text-align:center;color:var(--muted)">No matching members found.</td></tr>` :
              filtered.map((m) => `
                <tr>
                  <td><strong>${esc(m.fullname)}</strong><br><span style="font-size:0.78rem;color:var(--muted)">@${esc(m.username)}</span></td>
                  <td>${m.rate_name ? `<strong>${esc(m.rate_name)}</strong> <span style="color:var(--muted);font-size:0.8rem">($${Number(m.rate_charge).toFixed(2)})</span>` : '<span style="color:var(--muted)">Unassigned</span>'}</td>
                  <td>${esc(m.contact_number || '—')}</td>
                  <td>${esc(m.registration_date)}</td>
                  <td><span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-neutral'}">${esc(m.status)}</span></td>
                  ${canEdit ? `
                    <td style="text-align:right">
                      <button class="btn btn-ghost btn-sm edit-member" data-id="${m.member_id}">Edit</button>
                      <button class="btn btn-danger btn-sm del-member" data-id="${m.member_id}">Delete</button>
                    </td>` : ''}
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    el('mem-search').oninput = (e) => { state.memberSearch = e.target.value; renderTab(); el('mem-search').focus(); };
    el('mem-status').onchange = (e) => { state.memberStatus = e.target.value; renderTab(); };

    const openMemberModal = (m = null) => {
      openModal(m ? `Edit Member: ${m.fullname}` : 'Add New Member', `
        <div id="m-err" class="alert-error hidden"></div>
        <form id="m-form">
          <div class="form-group"><label>Full Name</label><input class="input" id="m-name" value="${esc(m?.fullname || '')}" required></div>
          <div class="form-grid-2">
            <div class="form-group"><label>Username</label><input class="input" id="m-user" value="${esc(m?.username || '')}" required></div>
            <div class="form-group"><label>${m ? 'New Password (optional)' : 'Password'}</label><input class="input" id="m-pass" type="password" ${m ? '' : 'required'}></div>
          </div>
          <div class="form-grid-2">
            <div class="form-group"><label>Contact Number</label><input class="input" id="m-contact" value="${esc(m?.contact_number || '')}"></div>
            <div class="form-group"><label>Status</label>
              <select class="input" id="m-stat">
                <option value="active" ${m?.status !== 'inactive' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${m?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Membership Plan</label>
            <select class="input" id="m-rate">
              <option value="">No Plan Assigned</option>
              ${state.rates.map((r) => `<option value="${r.rate_id}" ${String(m?.rate_id) === String(r.rate_id) ? 'selected' : ''}>${esc(r.name)} ($${Number(r.charge).toFixed(2)})</option>`).join('')}
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Cancel</button>
            <button type="submit" class="btn btn-primary">${m ? 'Save Changes' : 'Create Member'}</button>
          </div>
        </form>`, () => {
        el('m-form').onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            const payload = {
              fullname: el('m-name').value,
              username: el('m-user').value,
              contact_number: el('m-contact').value,
              status: el('m-stat').value,
              rate_id: el('m-rate').value || null,
            };
            if (el('m-pass').value) payload.password = el('m-pass').value;
            await api('members', { method: m ? 'PUT' : 'POST', body: JSON.stringify(payload) }, m?.member_id);
            closeModal(); await loadData(); renderTab();
          } catch (err) {
            el('m-err').textContent = err.message; el('m-err').classList.remove('hidden');
          }
        };
      });
    };

    if (canEdit) {
      el('add-member-btn').onclick = () => openMemberModal(null);
      document.querySelectorAll('.edit-member').forEach((b) => (b.onclick = () => openMemberModal(state.members.find((x) => String(x.member_id) === b.dataset.id))));
      document.querySelectorAll('.del-member').forEach((b) => (b.onclick = async () => {
        try { await api('members', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }
        catch (err) { showInlineError(err.message); }
      }));
    }
    return;
  }

  if (state.tab === 'rates') {
    root.innerHTML = `
      <div id="page-error" class="alert-error hidden"></div>
      <div class="toolbar">
        <span style="color:var(--muted);font-size:0.9rem">Membership plans and monthly billing rates</span>
        ${isAdmin ? `<button class="btn btn-primary" id="add-rate-btn">+ New Plan</button>` : ''}
      </div>
      <div class="plans-grid">
        ${state.rates.map((r) => `
          <div class="card plan-card">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="badge badge-info">Plan #${r.rate_id}</span>
                ${isAdmin ? `<div>
                  <button class="btn btn-ghost btn-sm edit-rate" data-id="${r.rate_id}">Edit</button>
                  <button class="btn btn-danger btn-sm del-rate" data-id="${r.rate_id}">Delete</button>
                </div>` : ''}
              </div>
              <h3 style="margin-top:14px;font-size:1.15rem">${esc(r.name)}</h3>
              <div class="plan-price">$${Number(r.charge).toFixed(2)} <span style="font-size:0.8rem;font-weight:500;color:var(--muted)">/ cycle</span></div>
              <p style="font-size:0.88rem;color:var(--muted)">${esc(r.description || 'Standard gym membership plan.')}</p>
            </div>
            <div style="margin-top:18px;padding-top:12px;border-top:1px solid #f1f5f9;font-size:0.82rem;color:var(--muted)">
              <strong>${r.member_count || 0}</strong> enrolled members
            </div>
          </div>`).join('')}
      </div>`;

    const openRateModal = (r = null) => {
      openModal(r ? `Edit Plan: ${r.name}` : 'Create Membership Plan', `
        <div id="r-err" class="alert-error hidden"></div>
        <form id="r-form">
          <div class="form-group"><label>Plan Name</label><input class="input" id="r-name" value="${esc(r?.name || '')}" required></div>
          <div class="form-group"><label>Charge ($)</label><input class="input" id="r-charge" type="number" step="0.01" min="0" value="${esc(r?.charge ?? '50')}" required></div>
          <div class="form-group"><label>Description</label><textarea class="input" id="r-desc" rows="3">${esc(r?.description || '')}</textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Cancel</button>
            <button type="submit" class="btn btn-primary">${r ? 'Save Changes' : 'Create Plan'}</button>
          </div>
        </form>`, () => {
        el('r-form').onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            await api('rates', { method: r ? 'PUT' : 'POST', body: JSON.stringify({ name: el('r-name').value, charge: Number(el('r-charge').value), description: el('r-desc').value }) }, r?.rate_id);
            closeModal(); await loadData(); renderTab();
          } catch (err) { el('r-err').textContent = err.message; el('r-err').classList.remove('hidden'); }
        };
      });
    };

    if (isAdmin) {
      el('add-rate-btn').onclick = () => openRateModal(null);
      document.querySelectorAll('.edit-rate').forEach((b) => (b.onclick = () => openRateModal(state.rates.find((x) => String(x.rate_id) === b.dataset.id))));
      document.querySelectorAll('.del-rate').forEach((b) => (b.onclick = async () => {
        try { await api('rates', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }
        catch (err) { showInlineError(err.message); }
      }));
    }
    return;
  }

  if (state.tab === 'attendance') {
    const filtered = state.attendance.filter((a) => !state.attendanceDate || a.attendance_date === state.attendanceDate);
    root.innerHTML = `
      <div id="page-error" class="alert-error hidden"></div>
      <div class="toolbar">
        <div class="filter-group">
          <input id="att-filter" class="search-input" type="date" style="width:auto" value="${esc(state.attendanceDate)}" />
          ${state.attendanceDate ? '<button type="button" id="att-clear" class="link-btn">Clear date</button>' : ''}
        </div>
        <button class="btn btn-primary" id="add-att-btn">${isMember ? '+ Check In Today' : '+ Log Attendance'}</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--muted)">No attendance records found.</td></tr>' :
              filtered.map((a) => `
                <tr>
                  <td><strong>${esc(a.member_name)}</strong></td>
                  <td>${esc(a.attendance_date)}</td>
                  <td><span class="badge ${a.status === 'Present' ? 'badge-success' : 'badge-danger'}">${esc(a.status)}</span></td>
                  <td>${esc(formatTime(a.check_in_time))}</td>
                  <td>${esc(formatTime(a.check_out_time))}</td>
                  <td style="text-align:right">
                    ${!a.check_in_time ? `<button class="btn btn-success btn-sm att-act" data-act="check_in" data-id="${a.attendance_id}">Check In</button>` : ''}
                    ${a.check_in_time && !a.check_out_time ? `<button class="btn btn-ghost btn-sm att-act" data-act="check_out" data-id="${a.attendance_id}">Check Out</button>` : ''}
                    ${canEdit ? `
                      <button class="btn btn-ghost btn-sm att-toggle" data-status="${a.status === 'Present' ? 'Absent' : 'Present'}" data-id="${a.attendance_id}">Mark ${a.status === 'Present' ? 'Absent' : 'Present'}</button>
                      <button class="btn btn-danger btn-sm del-att" data-id="${a.attendance_id}">Delete</button>` : ''}
                  </td>
                </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    el('att-filter').onchange = (e) => { state.attendanceDate = e.target.value; renderTab(); };
    if (el('att-clear')) el('att-clear').onclick = () => { state.attendanceDate = ''; renderTab(); };

    el('add-att-btn').onclick = () => openModal(isMember ? 'Daily Check-In' : 'Log Attendance', `
      <div id="a-err" class="alert-error hidden"></div>
      <form id="a-form">
        ${canEdit ? `<div class="form-group"><label>Member</label><select class="input" id="a-mem">${state.members.map((m) => `<option value="${m.member_id}">${esc(m.fullname)}</option>`).join('')}</select></div>` : ''}
        <div class="form-grid-2">
          <div class="form-group"><label>Date</label><input class="input" id="a-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div>
          <div class="form-group"><label>Status</label>
            <select class="input" id="a-stat" ${canEdit ? '' : 'disabled'}>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Attendance</button>
        </div>
      </form>`, () => {
      el('a-form').onsubmit = async (ev) => {
        ev.preventDefault();
        try {
          await api('attendance', {
            method: 'POST',
            body: JSON.stringify({
              member_id: canEdit ? el('a-mem').value : state.user.id,
              attendance_date: el('a-date').value,
              status: el('a-stat').value,
            }),
          });
          closeModal(); await loadData(); renderTab();
        } catch (err) { el('a-err').textContent = err.message; el('a-err').classList.remove('hidden'); }
      };
    });

    document.querySelectorAll('.att-act').forEach((b) => (b.onclick = async () => {
      await api('attendance', { method: 'PUT', body: JSON.stringify({ action: b.dataset.act }) }, b.dataset.id);
      await loadData(); renderTab();
    }));
    document.querySelectorAll('.att-toggle').forEach((b) => (b.onclick = async () => {
      await api('attendance', { method: 'PUT', body: JSON.stringify({ status: b.dataset.status }) }, b.dataset.id);
      await loadData(); renderTab();
    }));
    document.querySelectorAll('.del-att').forEach((b) => (b.onclick = async () => {
      await api('attendance', { method: 'DELETE' }, b.dataset.id);
      await loadData(); renderTab();
    }));
    return;
  }

  if (state.tab === 'equipment') {
    const units = state.equipment.reduce((s, e) => s + Number(e.quantity), 0);
    const val = state.equipment.reduce((s, e) => s + Number(e.amount) * Number(e.quantity), 0);
    root.innerHTML = `
      <div id="page-error" class="alert-error hidden"></div>
      <div class="toolbar">
        <div class="filter-group">
          <span class="badge badge-info">${units} total units</span>
          <span class="badge badge-neutral">Total valuation: $${val.toLocaleString()}</span>
        </div>
        ${canEdit ? `<button class="btn btn-primary" id="add-eq-btn">+ Add Equipment</button>` : ''}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Equipment</th><th>Unit Cost</th><th>Quantity</th><th>Total Value</th><th>Assigned Member</th>${canEdit ? '<th style="text-align:right">Actions</th>' : ''}</tr></thead>
          <tbody>
            ${state.equipment.map((e) => `
              <tr>
                <td><strong>${esc(e.name)}</strong><br><span style="font-size:0.78rem;color:var(--muted)">${esc(e.description || 'No description')}</span></td>
                <td>$${Number(e.amount).toFixed(2)}</td>
                <td><span class="badge badge-neutral">${e.quantity} units</span></td>
                <td><strong>$${(Number(e.amount) * Number(e.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                <td>${esc(e.member_name || 'Shared floor')}</td>
                ${canEdit ? `<td style="text-align:right">
                  <button class="btn btn-ghost btn-sm edit-eq" data-id="${e.equipment_id}">Edit</button>
                  <button class="btn btn-danger btn-sm del-eq" data-id="${e.equipment_id}">Delete</button>
                </td>` : ''}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    const openEqModal = (eq = null) => {
      openModal(eq ? `Edit Equipment: ${eq.name}` : 'Add Gym Equipment', `
        <div id="e-err" class="alert-error hidden"></div>
        <form id="e-form">
          <div class="form-group"><label>Equipment Name</label><input class="input" id="e-name" value="${esc(eq?.name || '')}" required></div>
          <div class="form-grid-2">
            <div class="form-group"><label>Unit Cost ($)</label><input class="input" id="e-amt" type="number" step="0.01" min="0" value="${esc(eq?.amount ?? '500')}" required></div>
            <div class="form-group"><label>Quantity</label><input class="input" id="e-qty" type="number" min="0" value="${esc(eq?.quantity ?? '1')}" required></div>
          </div>
          <div class="form-group"><label>Assigned Member (optional)</label>
            <select class="input" id="e-mem">
              <option value="">Shared Gym Floor</option>
              ${state.members.map((m) => `<option value="${m.member_id}" ${String(eq?.member_id) === String(m.member_id) ? 'selected' : ''}>${esc(m.fullname)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Description</label><textarea class="input" id="e-desc" rows="2">${esc(eq?.description || '')}</textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Cancel</button>
            <button type="submit" class="btn btn-primary">${eq ? 'Save Changes' : 'Add Equipment'}</button>
          </div>
        </form>`, () => {
        el('e-form').onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            await api('equipment', { method: eq ? 'PUT' : 'POST', body: JSON.stringify({ name: el('e-name').value, amount: Number(el('e-amt').value), quantity: Number(el('e-qty').value), member_id: el('e-mem').value || null, description: el('e-desc').value }) }, eq?.equipment_id);
            closeModal(); await loadData(); renderTab();
          } catch (err) { el('e-err').textContent = err.message; el('e-err').classList.remove('hidden'); }
        };
      });
    };

    if (canEdit) {
      el('add-eq-btn').onclick = () => openEqModal(null);
      document.querySelectorAll('.edit-eq').forEach((b) => (b.onclick = () => openEqModal(state.equipment.find((x) => String(x.equipment_id) === b.dataset.id))));
      document.querySelectorAll('.del-eq').forEach((b) => (b.onclick = async () => { await api('equipment', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
    }
    return;
  }

  if (state.tab === 'transactions') {
    const total = state.transactions.reduce((s, t) => s + Number(t.amount), 0);
    root.innerHTML = `
      <div class="toolbar">
        <span class="badge badge-success" style="font-size:0.85rem;padding:7px 14px">Total Recorded: $${total.toFixed(2)} (${state.transactions.length} entries)</span>
        <div class="filter-group">
          <button class="btn btn-ghost" id="export-tx-csv">⬇ Export CSV</button>
          ${canEdit ? `<button class="btn btn-primary" id="add-tx-btn">+ Record Payment</button>` : ''}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Receipt #</th><th>Member</th><th>Processed By</th><th>Description</th><th>Date</th><th style="text-align:right">Amount</th><th style="text-align:right">Actions</th></tr></thead>
          <tbody>
            ${state.transactions.map((t) => `
              <tr>
                <td style="font-family:monospace">TXN-${String(t.transaction_id).padStart(4, '0')}</td>
                <td><strong>${esc(t.member_name)}</strong></td>
                <td>${t.staff_username ? `@${esc(t.staff_username)}` : 'System / Self'}</td>
                <td>${esc(t.description || 'Payment')}</td>
                <td>${new Date(t.transaction_date).toLocaleString()}</td>
                <td style="text-align:right;color:var(--success);font-weight:700">$${Number(t.amount).toFixed(2)}</td>
                <td style="text-align:right">
                  <button class="btn btn-ghost btn-sm view-receipt" data-id="${t.transaction_id}">Receipt</button>
                  ${isAdmin ? `<button class="btn btn-danger btn-sm del-tx" data-id="${t.transaction_id}">Delete</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    el('export-tx-csv').onclick = () => {
      downloadCsv('transactions.csv', ['Receipt', 'Member', 'Staff', 'Description', 'Date', 'Amount'],
        state.transactions.map((t) => [`TXN-${String(t.transaction_id).padStart(4, '0')}`, t.member_name, t.staff_username || 'System', t.description || '', t.transaction_date, Number(t.amount).toFixed(2)]));
    };

    document.querySelectorAll('.view-receipt').forEach((b) => {
      b.onclick = () => {
        const tx = state.transactions.find((x) => String(x.transaction_id) === b.dataset.id);
        if (!tx) return;
        openModal(`Payment Receipt TXN-${String(tx.transaction_id).padStart(4, '0')}`, `
          <div style="border:1px dashed #cbd5e1;border-radius:12px;padding:20px;background:#f8fafc">
            <div style="display:flex;justify-content:space-between;margin-bottom:14px">
              <strong>IronCore Gym</strong>
              <span class="badge badge-success">PAID</span>
            </div>
            <p style="font-size:0.86rem;margin-bottom:6px"><strong>Receipt ID:</strong> TXN-${String(tx.transaction_id).padStart(4, '0')}</p>
            <p style="font-size:0.86rem;margin-bottom:6px"><strong>Member:</strong> ${esc(tx.member_name)}</p>
            <p style="font-size:0.86rem;margin-bottom:6px"><strong>Description:</strong> ${esc(tx.description || 'Gym Payment')}</p>
            <p style="font-size:0.86rem;margin-bottom:6px"><strong>Date:</strong> ${new Date(tx.transaction_date).toLocaleString()}</p>
            <hr style="border:0;border-top:1px solid #e2e8f0;margin:14px 0">
            <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:800">
              <span>Total Paid</span>
              <span style="color:var(--success)">$${Number(tx.amount).toFixed(2)}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Close</button>
            <button type="button" class="btn btn-primary" onclick="window.print()">Print Receipt</button>
          </div>`);
      };
    });

    if (canEdit) {
      el('add-tx-btn').onclick = () => openModal('Record Payment Transaction', `
        <div id="t-err" class="alert-error hidden"></div>
        <form id="t-form">
          <div class="form-group"><label>Member</label>
            <select class="input" id="t-mem">${state.members.map((m) => `<option value="${m.member_id}">${esc(m.fullname)} ${m.rate_name ? `(${esc(m.rate_name)})` : ''}</option>`).join('')}</select>
          </div>
          <div class="form-grid-2">
            <div class="form-group"><label>Amount ($)</label><input class="input" id="t-amt" type="number" step="0.01" min="0.01" value="50" required></div>
            <div class="form-group"><label>Staff Processor</label>
              <select class="input" id="t-staff">
                <option value="">System / Direct</option>
                ${state.staffs.map((s) => `<option value="${s.staff_id}">@${esc(s.username)} (${esc(s.role)})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group"><label>Description</label><input class="input" id="t-desc" placeholder="e.g. Monthly fitness plan payment"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Cancel</button>
            <button type="submit" class="btn btn-primary">Record Payment</button>
          </div>
        </form>`, () => {
        el('t-mem').onchange = () => {
          const m = state.members.find((x) => String(x.member_id) === el('t-mem').value);
          if (m?.rate_charge) el('t-amt').value = m.rate_charge;
        };
        el('t-form').onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            await api('transactions', { method: 'POST', body: JSON.stringify({ member_id: el('t-mem').value, staff_id: el('t-staff').value || null, amount: Number(el('t-amt').value), description: el('t-desc').value }) });
            closeModal(); await loadData(); renderTab();
          } catch (err) { el('t-err').textContent = err.message; el('t-err').classList.remove('hidden'); }
        };
      });
    }
    if (isAdmin) {
      document.querySelectorAll('.del-tx').forEach((b) => (b.onclick = async () => { await api('transactions', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
    }
    return;
  }

  if (state.tab === 'classes') {
    root.innerHTML = `
      <div id="page-error" class="alert-error hidden"></div>
      <div class="toolbar">
        <span style="color:var(--muted);font-size:0.9rem">Scheduled trainer-led group workouts &amp; member bookings</span>
        ${canEdit ? `<button class="btn btn-primary" id="add-cls-btn">+ Schedule Class</button>` : ''}
      </div>
      <div class="plans-grid">
        ${state.classes.map((c) => {
          const full = Number(c.booked_count) >= Number(c.capacity);
          const booked = Number(c.is_booked) > 0;
          return `
            <div class="card plan-card">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span class="badge badge-info">${esc(c.category)}</span>
                  <span class="badge ${full ? 'badge-danger' : 'badge-success'}">${c.booked_count} / ${c.capacity} spots</span>
                </div>
                <h3 style="margin-top:12px;font-size:1.12rem">${esc(c.title)}</h3>
                <p style="font-size:0.86rem;color:var(--muted);margin-top:6px">
                  ${esc(c.schedule_day)} • <strong>${esc(c.schedule_time)}</strong><br>
                  Room: ${esc(c.room)} • Trainer: ${c.trainer_username ? `@${esc(c.trainer_username)}` : 'Staff'}
                </p>
              </div>
              <div style="margin-top:16px;padding-top:12px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
                ${isMember ? (
                  booked
                    ? `<button class="btn btn-danger btn-sm cls-book" data-mode="cancel" data-id="${c.class_id}">Cancel Booking</button>`
                    : `<button class="btn btn-primary btn-sm cls-book" data-mode="book" data-id="${c.class_id}" ${full ? 'disabled' : ''}>${full ? 'Class Full' : 'Book Spot'}</button>`
                ) : `<button class="btn btn-ghost btn-sm cls-book-staff" data-id="${c.class_id}">Enroll Member</button>`}
                ${canEdit ? `<button class="btn btn-danger btn-sm del-cls" data-id="${c.class_id}">Delete</button>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>`;

    document.querySelectorAll('.cls-book').forEach((b) => (b.onclick = async () => {
      try {
        await api('class_book', { method: 'POST', body: JSON.stringify({ class_id: b.dataset.id, mode: b.dataset.mode }) });
        await loadData(); renderTab();
      } catch (err) { showInlineError(err.message); }
    }));

    document.querySelectorAll('.cls-book-staff').forEach((b) => (b.onclick = () => {
      openModal('Enroll Member in Class', `
        <div id="cb-err" class="alert-error hidden"></div>
        <form id="cb-form">
          <div class="form-group"><label>Select Member</label>
            <select class="input" id="cb-mem">${state.members.map((m) => `<option value="${m.member_id}">${esc(m.fullname)}</option>`).join('')}</select>
          </div>
          <div class="modal-actions"><button type="submit" class="btn btn-primary">Book Seat</button></div>
        </form>`, () => {
        el('cb-form').onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            await api('class_book', { method: 'POST', body: JSON.stringify({ class_id: b.dataset.id, member_id: el('cb-mem').value, mode: 'book' }) });
            closeModal(); await loadData(); renderTab();
          } catch (err) { el('cb-err').textContent = err.message; el('cb-err').classList.remove('hidden'); }
        };
      });
    }));

    if (canEdit) {
      el('add-cls-btn').onclick = () => openModal('Schedule Workout Class', `
        <form id="cls-form">
          <div class="form-group"><label>Class Title</label><input class="input" id="cls-title" required placeholder="e.g. Evening Spin Class"></div>
          <div class="form-grid-2">
            <div class="form-group"><label>Category</label><input class="input" id="cls-cat" value="Cardio" required></div>
            <div class="form-group"><label>Trainer</label><select class="input" id="cls-staff">${state.staffs.map((s) => `<option value="${s.staff_id}">@${esc(s.username)} (${esc(s.role)})</option>`).join('')}</select></div>
          </div>
          <div class="form-grid-2">
            <div class="form-group"><label>Days</label><input class="input" id="cls-day" value="Mon / Wed" required></div>
            <div class="form-group"><label>Time</label><input class="input" id="cls-time" value="06:30 PM" required></div>
          </div>
          <div class="form-grid-2">
            <div class="form-group"><label>Room</label><input class="input" id="cls-room" value="Studio A" required></div>
            <div class="form-group"><label>Capacity</label><input class="input" id="cls-cap" type="number" min="1" value="15" required></div>
          </div>
          <div class="modal-actions"><button type="submit" class="btn btn-primary">Create Class</button></div>
        </form>`, () => {
        el('cls-form').onsubmit = async (ev) => {
          ev.preventDefault();
          await api('classes', { method: 'POST', body: JSON.stringify({ title: el('cls-title').value, category: el('cls-cat').value, staff_id: el('cls-staff').value, schedule_day: el('cls-day').value, schedule_time: el('cls-time').value, room: el('cls-room').value, capacity: Number(el('cls-cap').value) }) });
          closeModal(); await loadData(); renderTab();
        };
      });
      document.querySelectorAll('.del-cls').forEach((b) => (b.onclick = async () => { await api('classes', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
    }
    return;
  }

  if (state.tab === 'assessments') {
    const bmiBadge = (bmi) => bmi < 18.5 ? ['Underweight', 'badge-info'] : bmi < 25 ? ['Healthy', 'badge-success'] : bmi < 30 ? ['Overweight', 'badge-warning'] : ['Obese', 'badge-danger'];
    root.innerHTML = `
      <div class="toolbar">
        <span style="color:var(--muted);font-size:0.9rem">Body composition, BMI calculation, and training progress logs</span>
        <button class="btn btn-primary" id="add-bmi-btn">+ Log Assessment</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Member</th><th>Date</th><th>Weight (kg)</th><th>Height (cm)</th><th>BMI</th><th>Body Fat</th><th>Notes</th>${canEdit ? '<th style="text-align:right">Action</th>' : ''}</tr></thead>
          <tbody>
            ${state.assessments.map((a) => {
              const [lbl, cls] = bmiBadge(Number(a.bmi));
              return `
                <tr>
                  <td><strong>${esc(a.member_name)}</strong></td>
                  <td>${esc(a.recorded_date)}</td>
                  <td>${Number(a.weight_kg).toFixed(1)} kg</td>
                  <td>${Number(a.height_cm).toFixed(0)} cm</td>
                  <td><strong>${Number(a.bmi).toFixed(1)}</strong> <span class="badge ${cls}">${lbl}</span></td>
                  <td>${a.body_fat_pct !== null ? `${Number(a.body_fat_pct).toFixed(1)}%` : '—'}</td>
                  <td>${esc(a.notes || '—')}</td>
                  ${canEdit ? `<td style="text-align:right"><button class="btn btn-danger btn-sm del-bmi" data-id="${a.assessment_id}">Delete</button></td>` : ''}
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    el('add-bmi-btn').onclick = () => openModal('Log BMI & Fitness Assessment', `
      <form id="bmi-form">
        ${canEdit ? `<div class="form-group"><label>Member</label><select class="input" id="b-mem">${state.members.map((m) => `<option value="${m.member_id}">${esc(m.fullname)}</option>`).join('')}</select></div>` : ''}
        <div class="form-grid-2">
          <div class="form-group"><label>Weight (kg)</label><input class="input" id="b-w" type="number" step="0.1" min="20" value="72" required></div>
          <div class="form-group"><label>Height (cm)</label><input class="input" id="b-h" type="number" step="0.5" min="100" value="175" required></div>
        </div>
        <div class="form-grid-2">
          <div class="form-group"><label>Body Fat % (optional)</label><input class="input" id="b-fat" type="number" step="0.1" min="3" max="60"></div>
          <div class="form-group"><label>Date</label><input class="input" id="b-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div>
        </div>
        <div class="form-group"><label>Progress Notes</label><input class="input" id="b-notes" placeholder="e.g. Target weight goal on track"></div>
        <div class="modal-actions"><button type="submit" class="btn btn-primary">Calculate BMI &amp; Save</button></div>
      </form>`, () => {
      el('bmi-form').onsubmit = async (ev) => {
        ev.preventDefault();
        await api('assessments', { method: 'POST', body: JSON.stringify({ member_id: canEdit ? el('b-mem').value : state.user.id, weight_kg: Number(el('b-w').value), height_cm: Number(el('b-h').value), body_fat_pct: el('b-fat').value, recorded_date: el('b-date').value, notes: el('b-notes').value }) });
        closeModal(); await loadData(); renderTab();
      };
    });
    if (canEdit) {
      document.querySelectorAll('.del-bmi').forEach((b) => (b.onclick = async () => { await api('assessments', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
    }
    return;
  }

  if (state.tab === 'staffs') {
    root.innerHTML = `
      <div class="toolbar">
        <span style="color:var(--muted);font-size:0.9rem">Trainers, managers, and operational support staff</span>
        ${isAdmin ? `<button class="btn btn-primary" id="add-staff-btn">+ Add Staff</button>` : ''}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Reporting Admin</th>${isAdmin ? '<th style="text-align:right">Actions</th>' : ''}</tr></thead>
          <tbody>
            ${state.staffs.map((s) => `
              <tr>
                <td><strong>@${esc(s.username)}</strong></td>
                <td>${esc(s.email)}</td>
                <td><span class="badge badge-info">${esc(s.role)}</span></td>
                <td>${esc(s.admin_name || 'Unassigned')}</td>
                ${isAdmin ? `<td style="text-align:right">
                  <button class="btn btn-ghost btn-sm edit-staff" data-id="${s.staff_id}">Edit</button>
                  <button class="btn btn-danger btn-sm del-staff" data-id="${s.staff_id}">Delete</button>
                </td>` : ''}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

    const openStaffModal = (s = null) => {
      openModal(s ? `Edit Staff: @${s.username}` : 'Add Staff Account', `
        <div id="s-err" class="alert-error hidden"></div>
        <form id="s-form">
          <div class="form-grid-2">
            <div class="form-group"><label>Username</label><input class="input" id="s-user" value="${esc(s?.username || '')}" required></div>
            <div class="form-group"><label>${s ? 'New Password (optional)' : 'Password'}</label><input class="input" id="s-pass" type="password" ${s ? '' : 'required'}></div>
          </div>
          <div class="form-group"><label>Email</label><input class="input" id="s-email" type="email" value="${esc(s?.email || '')}" required></div>
          <div class="form-grid-2">
            <div class="form-group"><label>Role</label>
              <select class="input" id="s-role">
                ${['trainer', 'manager', 'assistant', 'staff'].map((r) => `<option value="${r}" ${s?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Reporting Admin</label>
              <select class="input" id="s-adm">
                ${state.admins.map((a) => `<option value="${a.user_id}" ${String(s?.admin_id) === String(a.user_id) ? 'selected' : ''}>${esc(a.name || a.username)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('modal-close').click()">Cancel</button>
            <button type="submit" class="btn btn-primary">${s ? 'Save Changes' : 'Add Staff'}</button>
          </div>
        </form>`, () => {
        el('s-form').onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            const payload = { username: el('s-user').value, email: el('s-email').value, role: el('s-role').value, admin_id: el('s-adm').value };
            if (el('s-pass').value) payload.password = el('s-pass').value;
            await api('staffs', { method: s ? 'PUT' : 'POST', body: JSON.stringify(payload) }, s?.staff_id);
            closeModal(); await loadData(); renderTab();
          } catch (err) { el('s-err').textContent = err.message; el('s-err').classList.remove('hidden'); }
        };
      });
    };

    if (isAdmin) {
      el('add-staff-btn').onclick = () => openStaffModal(null);
      document.querySelectorAll('.edit-staff').forEach((b) => (b.onclick = () => openStaffModal(state.staffs.find((x) => String(x.staff_id) === b.dataset.id))));
      document.querySelectorAll('.del-staff').forEach((b) => (b.onclick = async () => { await api('staffs', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
    }
    return;
  }

  // Announcements & Reminders
  root.innerHTML = `
    <div class="two-col">
      <div class="card">
        <div class="card-header">
          <div><h3>Announcements</h3><span style="font-size:0.78rem;color:var(--muted)">Facility-wide notices</span></div>
          ${canEdit ? `<button class="btn btn-primary btn-sm" id="post-ann-btn">+ Post</button>` : ''}
        </div>
        ${state.announcements.map((a) => `
          <div class="feed-item">
            <div>
              <div class="ann-date">${esc(a.announcement_date)}</div>
              <p style="font-size:0.88rem;margin-top:4px">${esc(a.message)}</p>
            </div>
            ${canEdit ? `<button class="btn btn-danger btn-sm del-ann" data-id="${a.announcement_id}">Delete</button>` : ''}
          </div>`).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <div><h3>Reminders</h3><span style="font-size:0.78rem;color:var(--muted)">Payment due dates &amp; class alerts</span></div>
          ${canEdit ? `<button class="btn btn-primary btn-sm" id="add-rem-btn">+ Add Reminder</button>` : ''}
        </div>
        ${state.reminders.map((r) => `
          <div class="feed-item">
            <div>
              <div style="display:flex;align-items:center;gap:8px">
                <strong>${esc(r.name)}</strong>
                <span class="badge ${r.status === 'Completed' ? 'badge-success' : r.status === 'Sent' ? 'badge-info' : 'badge-warning'}">${esc(r.status)}</span>
              </div>
              <p style="font-size:0.85rem;color:var(--muted);margin-top:4px">${esc(r.message || '')}</p>
              <div style="font-size:0.76rem;color:var(--muted);margin-top:4px">${esc(r.reminder_date)}${r.reminder_time ? ` at ${esc(r.reminder_time)}` : ''}${r.member_name ? ` • ${esc(r.member_name)}` : ''}</div>
            </div>
            ${canEdit ? `<div style="display:flex;gap:6px">
              ${r.status !== 'Completed' ? `<button class="btn btn-ghost btn-sm rem-step" data-id="${r.reminder_id}" data-next="${r.status === 'Pending' ? 'Sent' : 'Completed'}">${r.status === 'Pending' ? 'Mark Sent' : 'Complete'}</button>` : ''}
              <button class="btn btn-danger btn-sm del-rem" data-id="${r.reminder_id}">Delete</button>
            </div>` : ''}
          </div>`).join('')}
      </div>
    </div>`;

  if (canEdit) {
    el('post-ann-btn').onclick = () => openModal('Post Announcement', `
      <form id="ann-form">
        <div class="form-group"><label>Date</label><input class="input" id="ann-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div>
        <div class="form-group"><label>Message</label><textarea class="input" id="ann-msg" rows="3" required></textarea></div>
        <div class="modal-actions"><button type="submit" class="btn btn-primary">Publish</button></div>
      </form>`, () => {
      el('ann-form').onsubmit = async (ev) => {
        ev.preventDefault();
        await api('announcements', { method: 'POST', body: JSON.stringify({ announcement_date: el('ann-date').value, message: el('ann-msg').value }) });
        closeModal(); await loadData(); renderTab();
      };
    });

    el('add-rem-btn').onclick = () => openModal('Schedule Reminder', `
      <form id="rem-form">
        <div class="form-group"><label>Title</label><input class="input" id="rem-name" required></div>
        <div class="form-grid-2">
          <div class="form-group"><label>Date</label><input class="input" id="rem-date" type="date" value="${new Date().toISOString().slice(0, 10)}" required></div>
          <div class="form-group"><label>Time</label><input class="input" id="rem-time" type="time" value="10:00"></div>
        </div>
        <div class="form-grid-2">
          <div class="form-group"><label>Member</label><select class="input" id="rem-mem"><option value="">All / General</option>${state.members.map((m) => `<option value="${m.member_id}">${esc(m.fullname)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Status</label><select class="input" id="rem-stat"><option value="Pending">Pending</option><option value="Sent">Sent</option><option value="Completed">Completed</option></select></div>
        </div>
        <div class="form-group"><label>Message</label><textarea class="input" id="rem-msg" rows="2"></textarea></div>
        <div class="modal-actions"><button type="submit" class="btn btn-primary">Schedule</button></div>
      </form>`, () => {
      el('rem-form').onsubmit = async (ev) => {
        ev.preventDefault();
        await api('reminders', { method: 'POST', body: JSON.stringify({ name: el('rem-name').value, reminder_date: el('rem-date').value, reminder_time: el('rem-time').value, member_id: el('rem-mem').value || null, status: el('rem-stat').value, message: el('rem-msg').value }) });
        closeModal(); await loadData(); renderTab();
      };
    });

    document.querySelectorAll('.del-ann').forEach((b) => (b.onclick = async () => { await api('announcements', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
    document.querySelectorAll('.rem-step').forEach((b) => (b.onclick = async () => { await api('reminders', { method: 'PUT', body: JSON.stringify({ status: b.dataset.next }) }, b.dataset.id); await loadData(); renderTab(); }));
    document.querySelectorAll('.del-rem').forEach((b) => (b.onclick = async () => { await api('reminders', { method: 'DELETE' }, b.dataset.id); await loadData(); renderTab(); }));
  }
}

initAuthScreen();
