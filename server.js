import express from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nowIso = () => new Date().toISOString();
const todayDate = () => new Date().toISOString().slice(0, 10);

const seq = {
  admin: 3,
  rates: 3,
  members: 5,
  announcements: 3,
  attendance: 2,
  equipment: 3,
  staffs: 3,
  reminder: 2,
  transactions: 3,
  classes: 4,
  bookings: 3,
  assessments: 2,
};

const admins = [
  { user_id: 1, username: 'admin1', password: 'password1', name: 'Admin One', email: 'admin1@example.com', user_role: 'admin' },
  { user_id: 2, username: 'admin2', password: 'password2', name: 'Admin Two', email: 'admin2@example.com', user_role: 'admin' },
  { user_id: 3, username: 'admin3', password: 'password3', name: 'Admin Three', email: 'admin3@example.com', user_role: 'admin' },
];

const rates = [
  { rate_id: 1, name: 'Fitness Plan', charge: 50.0, description: 'Includes access to all gym equipment and classes' },
  { rate_id: 2, name: 'Yoga Plan', charge: 40.0, description: 'Focuses on yoga classes and relaxation techniques' },
  { rate_id: 3, name: 'Swimming Plan', charge: 60.0, description: 'Provides access to the swimming pool and swim classes' },
];

const members = [
  { member_id: 1, fullname: 'John Doe', username: 'johndoe', password: 'johndoe123', rate_id: 1, contact_number: '123-456-7890', registration_date: '2024-12-20', status: 'active' },
  { member_id: 2, fullname: 'Jane Smith', username: 'janesmith', password: 'janesmith123', rate_id: 2, contact_number: '987-654-3210', registration_date: '2024-12-21', status: 'active' },
  { member_id: 3, fullname: 'Alice Brown', username: 'alicebrown', password: 'alice123', rate_id: 1, contact_number: '555-1234', registration_date: '2024-12-22', status: 'active' },
  { member_id: 4, fullname: 'Bob Green', username: 'bobgreen', password: 'bob123', rate_id: 2, contact_number: '555-5678', registration_date: '2024-12-23', status: 'active' },
  { member_id: 5, fullname: 'Charlie White', username: 'charliewhite', password: 'charlie123', rate_id: 3, contact_number: '555-9876', registration_date: '2024-12-24', status: 'active' },
];

const announcements = [
  { announcement_id: 1, message: 'Welcome to the system!', announcement_date: '2024-12-25' },
  { announcement_id: 2, message: 'System maintenance scheduled.', announcement_date: '2024-12-26' },
  { announcement_id: 3, message: 'New features released.', announcement_date: '2024-12-27' },
];

const attendance = [
  { attendance_id: 1, member_id: 1, attendance_date: '2024-12-25', status: 'Present', check_in_time: '2024-12-25 09:00:00', check_out_time: null },
  { attendance_id: 2, member_id: 2, attendance_date: '2024-12-25', status: 'Absent', check_in_time: null, check_out_time: null },
];

const equipment = [
  { equipment_id: 1, name: 'Treadmill', amount: 1200.0, quantity: 10, description: 'High-quality treadmill for cardio workouts', member_id: null },
  { equipment_id: 2, name: 'Dumbbell Set', amount: 300.0, quantity: 20, description: 'Variety of dumbbells for strength training', member_id: null },
  { equipment_id: 3, name: 'Exercise Bike', amount: 800.0, quantity: 5, description: 'Comfortable exercise bike for low-impact cardio', member_id: null },
];

const staffs = [
  { staff_id: 1, username: 'staff1', password: 'staffpass1', email: 'staff1@example.com', admin_id: 1, role: 'trainer' },
  { staff_id: 2, username: 'staff2', password: 'staffpass2', email: 'staff2@example.com', admin_id: 2, role: 'manager' },
  { staff_id: 3, username: 'staff3', password: 'staffpass3', email: 'staff3@example.com', admin_id: 3, role: 'assistant' },
];

const reminders = [
  { reminder_id: 1, name: 'Payment Reminder', message: 'Your payment is due.', status: 'Pending', reminder_date: '2024-12-28', reminder_time: '10:00', member_id: 1 },
  { reminder_id: 2, name: 'Class Reminder', message: 'Yoga class at 6 PM.', status: 'Sent', reminder_date: '2024-12-25', reminder_time: '18:00', member_id: 1 },
];

const transactions = [
  { transaction_id: 1, member_id: 1, staff_id: 1, amount: 50.0, transaction_date: '2024-12-24 10:15:00', description: 'Monthly fitness plan payment' },
  { transaction_id: 2, member_id: 2, staff_id: 2, amount: 40.0, transaction_date: '2024-12-24 14:30:00', description: 'Yoga plan payment' },
  { transaction_id: 3, member_id: 1, staff_id: null, amount: 20.0, transaction_date: '2024-12-25 11:00:00', description: 'One-time gym equipment usage fee' },
];

const classes = [
  { class_id: 1, title: 'Morning HIIT Circuit', category: 'Cardio', staff_id: 1, schedule_day: 'Mon / Wed / Fri', schedule_time: '07:00 AM', room: 'Studio A', capacity: 16 },
  { class_id: 2, title: 'Power Yoga Flow', category: 'Yoga', staff_id: 1, schedule_day: 'Tue / Thu', schedule_time: '06:00 PM', room: 'Zen Studio', capacity: 12 },
  { class_id: 3, title: 'Strength & Conditioning', category: 'Strength', staff_id: 2, schedule_day: 'Mon / Thu', schedule_time: '05:30 PM', room: 'Weight Floor', capacity: 14 },
  { class_id: 4, title: 'Lap Swim Conditioning', category: 'Swimming', staff_id: 3, schedule_day: 'Sat / Sun', schedule_time: '09:00 AM', room: 'Olympic Pool', capacity: 10 },
];

const classBookings = [
  { booking_id: 1, class_id: 1, member_id: 1 },
  { booking_id: 2, class_id: 2, member_id: 2 },
  { booking_id: 3, class_id: 4, member_id: 5 },
];

const assessments = [
  { assessment_id: 1, member_id: 1, weight_kg: 78.5, height_cm: 178.0, bmi: 24.8, body_fat_pct: 16.5, notes: 'Baseline strength assessment complete', recorded_date: '2024-12-20' },
  { assessment_id: 2, member_id: 2, weight_kg: 62.0, height_cm: 166.0, bmi: 22.5, body_fat_pct: 21.0, notes: 'Flexibility and core endurance improving', recorded_date: '2024-12-22' },
];

const sessions = new Map();

function getSessionUser(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)gms_sid=([^;]+)/);
  if (match && sessions.has(match[1])) {
    return sessions.get(match[1]);
  }
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const tok = auth.slice(7).trim();
    if (sessions.has(tok)) return sessions.get(tok);
  }
  return null;
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `gms_sid=${token}; Path=/; HttpOnly; SameSite=Lax`);
}

function enrichMember(m) {
  const r = m.rate_id ? rates.find((x) => x.rate_id === m.rate_id) : null;
  const { password: _, ...safe } = m;
  return { ...safe, rate_name: r?.name ?? null, rate_charge: r?.charge ?? null };
}

function enrichAttendance(a) {
  const m = members.find((x) => x.member_id === a.member_id);
  return { ...a, member_name: m?.fullname ?? `Member #${a.member_id}` };
}

function enrichEquipment(e) {
  const m = e.member_id ? members.find((x) => x.member_id === e.member_id) : null;
  return { ...e, member_name: m?.fullname ?? null };
}

function enrichStaff(s) {
  const a = s.admin_id ? admins.find((x) => x.user_id === s.admin_id) : null;
  const { password: _, ...safe } = s;
  return { ...safe, admin_name: a?.name ?? a?.username ?? null };
}

function enrichReminder(r) {
  const m = r.member_id ? members.find((x) => x.member_id === r.member_id) : null;
  return { ...r, member_name: m?.fullname ?? null };
}

function enrichTransaction(t) {
  const m = members.find((x) => x.member_id === t.member_id);
  const s = t.staff_id ? staffs.find((x) => x.staff_id === t.staff_id) : null;
  return { ...t, member_name: m?.fullname ?? `Member #${t.member_id}`, staff_username: s?.username ?? null };
}

const app = express();
app.use(express.json());

// Serve static HTML/CSS/JS files safely (block .php/.sql/.md source inspection if desired, or let api.php route handle API)
app.all('/api.php', (req, res) => {
  const action = String(req.query.action || '');
  const method = req.method;
  const id = req.query.id ? Number(req.query.id) : 0;
  const body = req.body || {};

  if (action === 'public_rates') {
    return res.json(rates);
  }

  if (action === 'login' && method === 'POST') {
    const uname = String(body.username || '').trim();
    const pw = String(body.password || '');
    const roleType = body.roleType || null;
    if (!uname || !pw) return res.status(400).json({ error: 'Username and password are required' });

    let matched = null;
    if (!roleType || roleType === 'admin') {
      const adm = admins.find((a) => a.username === uname && a.password === pw);
      if (adm) matched = { id: adm.user_id, username: adm.username, name: adm.name || adm.username, email: adm.email, roleType: 'admin', roleLabel: adm.user_role };
    }
    if (!matched && (!roleType || roleType === 'staff')) {
      const st = staffs.find((s) => s.username === uname && s.password === pw);
      if (st) matched = { id: st.staff_id, username: st.username, name: st.username, email: st.email, roleType: 'staff', roleLabel: st.role };
    }
    if (!matched && (!roleType || roleType === 'member')) {
      const mem = members.find((m) => m.username === uname && m.password === pw);
      if (mem) matched = { id: mem.member_id, username: mem.username, name: mem.fullname, roleType: 'member', roleLabel: 'member' };
    }
    if (!matched) return res.status(401).json({ error: 'Invalid username or password' });

    const token = randomUUID();
    sessions.set(token, matched);
    setSessionCookie(res, token);
    return res.json({ token, user: matched });
  }

  if (action === 'register' && method === 'POST') {
    const fullname = String(body.fullname || '').trim();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!fullname || !username || !password) return res.status(400).json({ error: 'Full name, username, and password are required' });
    if (members.some((m) => m.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: 'Username already exists' });

    const newMember = {
      member_id: ++seq.members,
      fullname,
      username,
      password,
      rate_id: body.rate_id ? Number(body.rate_id) : null,
      contact_number: String(body.contact_number || '').trim() || null,
      registration_date: todayDate(),
      status: 'active',
    };
    members.push(newMember);
    const user = { id: newMember.member_id, username: newMember.username, name: newMember.fullname, roleType: 'member', roleLabel: 'member' };
    const token = randomUUID();
    sessions.set(token, user);
    setSessionCookie(res, token);
    return res.status(201).json({ token, user });
  }

  if (action === 'logout') {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)gms_sid=([^;]+)/);
    if (match) sessions.delete(match[1]);
    res.setHeader('Set-Cookie', 'gms_sid=; Path=/; Max-Age=0');
    return res.json({ ok: true });
  }

  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  if (action === 'me') return res.json({ user });

  if (action === 'dashboard') {
    const today = todayDate();
    const isMember = user.roleType === 'member';
    const txList = isMember ? transactions.filter((t) => t.member_id === user.id) : transactions;
    const attList = isMember ? attendance.filter((a) => a.member_id === user.id) : attendance;
    const remList = isMember ? reminders.filter((r) => r.member_id === user.id) : reminders;

    return res.json({
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === 'active').length,
      totalEquipmentUnits: equipment.reduce((s, e) => s + e.quantity, 0),
      totalEquipmentValue: equipment.reduce((s, e) => s + e.amount * e.quantity, 0),
      totalRevenue: txList.reduce((s, t) => s + t.amount, 0),
      presentToday: attList.filter((a) => a.attendance_date === today && a.status === 'Present').length,
      attendanceRecordsCount: attList.length,
      pendingReminders: remList.filter((r) => r.status === 'Pending').length,
      recentTransactions: [...txList].sort((a, b) => b.transaction_id - a.transaction_id).slice(0, 5).map(enrichTransaction),
      recentAnnouncements: [...announcements].sort((a, b) => b.announcement_date.localeCompare(a.announcement_date)).slice(0, 5),
      planBreakdown: rates.map((r) => ({ rate_id: r.rate_id, name: r.name, charge: r.charge, memberCount: members.filter((m) => m.rate_id === r.rate_id).length })),
    });
  }

  if (action === 'admins') {
    if (user.roleType !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });
    return res.json(admins.map(({ password: _, ...safe }) => safe));
  }

  if (action === 'members') {
    if (method === 'GET') {
      const list = user.roleType === 'member' ? members.filter((m) => m.member_id === user.id) : members;
      return res.json([...list].sort((a, b) => b.member_id - a.member_id).map(enrichMember));
    }
    if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (method === 'POST') {
      const uname = String(body.username || '').trim();
      if (!body.fullname || !uname || !body.password) return res.status(400).json({ error: 'Full name, username, and password are required' });
      if (members.some((m) => m.username.toLowerCase() === uname.toLowerCase())) return res.status(409).json({ error: 'Username already exists' });
      const mem = {
        member_id: ++seq.members,
        fullname: String(body.fullname).trim(),
        username: uname,
        password: String(body.password),
        rate_id: body.rate_id ? Number(body.rate_id) : null,
        contact_number: String(body.contact_number || '').trim() || null,
        registration_date: todayDate(),
        status: body.status === 'inactive' ? 'inactive' : 'active',
      };
      members.push(mem);
      return res.status(201).json(enrichMember(mem));
    }
    if (method === 'PUT') {
      const mem = members.find((m) => m.member_id === id);
      if (!mem) return res.status(404).json({ error: 'Member not found' });
      if (body.fullname) mem.fullname = String(body.fullname).trim();
      if (body.username) mem.username = String(body.username).trim();
      if (body.password) mem.password = String(body.password);
      if (body.rate_id !== undefined) mem.rate_id = body.rate_id ? Number(body.rate_id) : null;
      if (body.contact_number !== undefined) mem.contact_number = String(body.contact_number || '').trim() || null;
      if (body.status) mem.status = body.status === 'inactive' ? 'inactive' : 'active';
      return res.json(enrichMember(mem));
    }
    if (method === 'DELETE') {
      const idx = members.findIndex((m) => m.member_id === id);
      if (idx === -1) return res.status(404).json({ error: 'Member not found' });
      members.splice(idx, 1);
      for (let i = attendance.length - 1; i >= 0; i--) if (attendance[i].member_id === id) attendance.splice(i, 1);
      for (let i = transactions.length - 1; i >= 0; i--) if (transactions[i].member_id === id) transactions.splice(i, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'rates') {
    if (method === 'GET') {
      return res.json(rates.map((r) => ({ ...r, member_count: members.filter((m) => m.rate_id === r.rate_id).length })));
    }
    if (user.roleType !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    if (method === 'POST') {
      const name = String(body.name || '').trim();
      const charge = Number(body.charge);
      if (!name || Number.isNaN(charge) || charge < 0) return res.status(400).json({ error: 'Valid name and charge required' });
      if (rates.some((r) => r.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: 'Plan name already exists' });
      const r = { rate_id: ++seq.rates, name, charge: Number(charge.toFixed(2)), description: String(body.description || '').trim() || null };
      rates.push(r);
      return res.status(201).json(r);
    }
    if (method === 'PUT') {
      const r = rates.find((x) => x.rate_id === id);
      if (!r) return res.status(404).json({ error: 'Plan not found' });
      if (body.name) r.name = String(body.name).trim();
      if (body.charge !== undefined) r.charge = Number(Number(body.charge).toFixed(2));
      if (body.description !== undefined) r.description = String(body.description || '').trim() || null;
      return res.json(r);
    }
    if (method === 'DELETE') {
      const idx = rates.findIndex((r) => r.rate_id === id);
      if (idx === -1) return res.status(404).json({ error: 'Plan not found' });
      rates.splice(idx, 1);
      members.forEach((m) => { if (m.rate_id === id) m.rate_id = null; });
      return res.json({ ok: true });
    }
  }

  if (action === 'attendance') {
    if (method === 'GET') {
      const list = user.roleType === 'member' ? attendance.filter((a) => a.member_id === user.id) : attendance;
      return res.json([...list].sort((a, b) => b.attendance_date.localeCompare(a.attendance_date) || b.attendance_id - a.attendance_id).map(enrichAttendance));
    }
    if (method === 'POST') {
      const member_id = user.roleType === 'member' ? user.id : Number(body.member_id);
      const attendance_date = String(body.attendance_date || todayDate()).slice(0, 10);
      const status = body.status === 'Absent' ? 'Absent' : 'Present';
      if (attendance.some((a) => a.member_id === member_id && a.attendance_date === attendance_date)) {
        return res.status(409).json({ error: `Attendance already recorded on ${attendance_date}` });
      }
      const rec = {
        attendance_id: ++seq.attendance,
        member_id,
        attendance_date,
        status,
        check_in_time: status === 'Present' ? nowIso() : null,
        check_out_time: null,
      };
      attendance.push(rec);
      return res.status(201).json(enrichAttendance(rec));
    }
    if (method === 'PUT') {
      const rec = attendance.find((a) => a.attendance_id === id);
      if (!rec) return res.status(404).json({ error: 'Record not found' });
      if (body.action === 'check_in') {
        rec.status = 'Present';
        rec.check_in_time = nowIso();
      } else if (body.action === 'check_out') {
        rec.status = 'Present';
        if (!rec.check_in_time) rec.check_in_time = nowIso();
        rec.check_out_time = nowIso();
      } else if (body.status) {
        rec.status = body.status === 'Absent' ? 'Absent' : 'Present';
        if (rec.status === 'Absent') { rec.check_in_time = null; rec.check_out_time = null; }
        else if (!rec.check_in_time) rec.check_in_time = nowIso();
      }
      return res.json(enrichAttendance(rec));
    }
    if (method === 'DELETE') {
      if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
      const idx = attendance.findIndex((a) => a.attendance_id === id);
      if (idx !== -1) attendance.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'equipment') {
    if (method === 'GET') return res.json(equipment.map(enrichEquipment));
    if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (method === 'POST') {
      const eq = {
        equipment_id: ++seq.equipment,
        name: String(body.name || '').trim(),
        amount: Number(Number(body.amount).toFixed(2)),
        quantity: Number(body.quantity),
        description: String(body.description || '').trim() || null,
        member_id: body.member_id ? Number(body.member_id) : null,
      };
      equipment.push(eq);
      return res.status(201).json(enrichEquipment(eq));
    }
    if (method === 'PUT') {
      const eq = equipment.find((e) => e.equipment_id === id);
      if (!eq) return res.status(404).json({ error: 'Equipment not found' });
      if (body.name) eq.name = String(body.name).trim();
      if (body.amount !== undefined) eq.amount = Number(Number(body.amount).toFixed(2));
      if (body.quantity !== undefined) eq.quantity = Number(body.quantity);
      if (body.description !== undefined) eq.description = String(body.description || '').trim() || null;
      if (body.member_id !== undefined) eq.member_id = body.member_id ? Number(body.member_id) : null;
      return res.json(enrichEquipment(eq));
    }
    if (method === 'DELETE') {
      const idx = equipment.findIndex((e) => e.equipment_id === id);
      if (idx !== -1) equipment.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'staffs') {
    if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (method === 'GET') return res.json(staffs.map(enrichStaff));
    if (user.roleType !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    if (method === 'POST') {
      const st = {
        staff_id: ++seq.staffs,
        username: String(body.username || '').trim(),
        password: String(body.password || ''),
        email: String(body.email || '').trim(),
        admin_id: body.admin_id ? Number(body.admin_id) : user.id,
        role: String(body.role || 'staff').trim(),
      };
      staffs.push(st);
      return res.status(201).json(enrichStaff(st));
    }
    if (method === 'PUT') {
      const st = staffs.find((s) => s.staff_id === id);
      if (!st) return res.status(404).json({ error: 'Staff not found' });
      if (body.username) st.username = String(body.username).trim();
      if (body.password) st.password = String(body.password);
      if (body.email) st.email = String(body.email).trim();
      if (body.role) st.role = String(body.role).trim();
      if (body.admin_id !== undefined) st.admin_id = body.admin_id ? Number(body.admin_id) : null;
      return res.json(enrichStaff(st));
    }
    if (method === 'DELETE') {
      const idx = staffs.findIndex((s) => s.staff_id === id);
      if (idx !== -1) staffs.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'transactions') {
    if (method === 'GET') {
      const list = user.roleType === 'member' ? transactions.filter((t) => t.member_id === user.id) : transactions;
      return res.json([...list].sort((a, b) => b.transaction_id - a.transaction_id).map(enrichTransaction));
    }
    if (method === 'POST') {
      if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
      const amount = Number(body.amount);
      if (!body.member_id || Number.isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Valid member and positive amount required' });
      const tx = {
        transaction_id: ++seq.transactions,
        member_id: Number(body.member_id),
        staff_id: body.staff_id ? Number(body.staff_id) : user.roleType === 'staff' ? user.id : null,
        amount: Number(amount.toFixed(2)),
        transaction_date: nowIso(),
        description: String(body.description || '').trim() || null,
      };
      transactions.push(tx);
      return res.status(201).json(enrichTransaction(tx));
    }
    if (method === 'DELETE') {
      if (user.roleType !== 'admin') return res.status(403).json({ error: 'Admin access required' });
      const idx = transactions.findIndex((t) => t.transaction_id === id);
      if (idx !== -1) transactions.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'announcements') {
    if (method === 'GET') return res.json([...announcements].sort((a, b) => b.announcement_date.localeCompare(a.announcement_date)));
    if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (method === 'POST') {
      const ann = {
        announcement_id: ++seq.announcements,
        message: String(body.message || '').trim(),
        announcement_date: String(body.announcement_date || todayDate()).slice(0, 10),
      };
      announcements.push(ann);
      return res.status(201).json(ann);
    }
    if (method === 'DELETE') {
      const idx = announcements.findIndex((a) => a.announcement_id === id);
      if (idx !== -1) announcements.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'reminders') {
    if (method === 'GET') {
      const list = user.roleType === 'member' ? reminders.filter((r) => r.member_id === user.id) : reminders;
      return res.json([...list].sort((a, b) => b.reminder_date.localeCompare(a.reminder_date)).map(enrichReminder));
    }
    if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (method === 'POST') {
      const rem = {
        reminder_id: ++seq.reminder,
        name: String(body.name || '').trim(),
        message: String(body.message || '').trim() || null,
        status: body.status || 'Pending',
        reminder_date: String(body.reminder_date || todayDate()).slice(0, 10),
        reminder_time: body.reminder_time || null,
        member_id: body.member_id ? Number(body.member_id) : null,
      };
      reminders.push(rem);
      return res.status(201).json(enrichReminder(rem));
    }
    if (method === 'PUT') {
      const rem = reminders.find((r) => r.reminder_id === id);
      if (rem && body.status) rem.status = body.status;
      return res.json({ ok: true });
    }
    if (method === 'DELETE') {
      const idx = reminders.findIndex((r) => r.reminder_id === id);
      if (idx !== -1) reminders.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'classes') {
    if (method === 'GET') {
      const uid = user.roleType === 'member' ? user.id : 0;
      return res.json(
        classes.map((c) => {
          const trainer = c.staff_id ? staffs.find((s) => s.staff_id === c.staff_id) : null;
          const bookedCount = classBookings.filter((b) => b.class_id === c.class_id).length;
          const isBooked = uid ? classBookings.filter((b) => b.class_id === c.class_id && b.member_id === uid).length : 0;
          return { ...c, trainer_username: trainer?.username ?? null, booked_count: bookedCount, is_booked: isBooked };
        })
      );
    }
    if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
    if (method === 'POST') {
      const cls = {
        class_id: ++seq.classes,
        title: String(body.title || '').trim(),
        category: String(body.category || 'Fitness').trim(),
        staff_id: body.staff_id ? Number(body.staff_id) : null,
        schedule_day: String(body.schedule_day || '').trim(),
        schedule_time: String(body.schedule_time || '').trim(),
        room: String(body.room || 'Main Studio').trim(),
        capacity: Math.max(1, Number(body.capacity || 15)),
      };
      classes.push(cls);
      return res.status(201).json(cls);
    }
    if (method === 'DELETE') {
      const idx = classes.findIndex((c) => c.class_id === id);
      if (idx !== -1) classes.splice(idx, 1);
      for (let i = classBookings.length - 1; i >= 0; i--) if (classBookings[i].class_id === id) classBookings.splice(i, 1);
      return res.json({ ok: true });
    }
  }

  if (action === 'class_book' && method === 'POST') {
    const classId = Number(body.class_id);
    const memberId = user.roleType === 'member' ? user.id : Number(body.member_id);
    if (body.mode === 'cancel') {
      const idx = classBookings.findIndex((b) => b.class_id === classId && b.member_id === memberId);
      if (idx !== -1) classBookings.splice(idx, 1);
      return res.json({ ok: true });
    }
    const cls = classes.find((c) => c.class_id === classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    if (classBookings.some((b) => b.class_id === classId && b.member_id === memberId)) {
      return res.status(409).json({ error: 'Already booked in this class' });
    }
    if (classBookings.filter((b) => b.class_id === classId).length >= cls.capacity) {
      return res.status(409).json({ error: 'Class is at full capacity' });
    }
    classBookings.push({ booking_id: ++seq.bookings, class_id: classId, member_id: memberId });
    return res.status(201).json({ ok: true });
  }

  if (action === 'assessments') {
    if (method === 'GET') {
      const list = user.roleType === 'member' ? assessments.filter((a) => a.member_id === user.id) : assessments;
      return res.json(
        [...list]
          .sort((a, b) => b.recorded_date.localeCompare(a.recorded_date) || b.assessment_id - a.assessment_id)
          .map((a) => ({ ...a, member_name: members.find((m) => m.member_id === a.member_id)?.fullname ?? `Member #${a.member_id}` }))
      );
    }
    if (method === 'POST') {
      const memberId = user.roleType === 'member' ? user.id : Number(body.member_id);
      const w = Number(body.weight_kg);
      const h = Number(body.height_cm);
      if (!w || !h || w <= 0 || h <= 0) return res.status(400).json({ error: 'Positive weight and height are required' });
      const bmi = Number((w / ((h / 100) * (h / 100))).toFixed(1));
      const rec = {
        assessment_id: ++seq.assessments,
        member_id: memberId,
        weight_kg: w,
        height_cm: h,
        bmi,
        body_fat_pct: body.body_fat_pct !== '' && body.body_fat_pct !== undefined && body.body_fat_pct !== null ? Number(body.body_fat_pct) : null,
        notes: String(body.notes || '').trim() || null,
        recorded_date: String(body.recorded_date || todayDate()).slice(0, 10),
      };
      assessments.push(rec);
      return res.status(201).json(rec);
    }
    if (method === 'DELETE') {
      if (user.roleType === 'member') return res.status(403).json({ error: 'Insufficient permissions' });
      const idx = assessments.findIndex((a) => a.assessment_id === id);
      if (idx !== -1) assessments.splice(idx, 1);
      return res.json({ ok: true });
    }
  }

  return res.status(404).json({ error: 'Unknown API action' });
});

app.use(express.static(__dirname));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gym Management System listening on http://0.0.0.0:${PORT}`);
});
