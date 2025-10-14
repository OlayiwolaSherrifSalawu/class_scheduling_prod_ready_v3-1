import { db, auth } from './firebase-config.js';
import { Catalog } from './data.js';
import { $, $$, toast, section, todayKey } from './ui.js';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  onSnapshot,
  getDocs,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Fetch all courses for department regardless of level
async function fetchCoursesForDept(dept, userRole) {
  try {
    const out = [];
    const parent = doc(db, 'departments', dept);
    const sub = collection(parent, 'courses');
    const snap = await getDocs(sub);
    snap.forEach(d => {
      const v = d.data();
      out.push({
        code: v.code,
        name: v.name,
        level: Number(v.level) || 0
      });
    });

    // Only admin/lecturer can see private course data
    if (userRole === 'admin' || userRole === 'lecturer') {
      const privCol = collection(parent, 'privateData');
      const privSnap = await getDocs(privCol);
      privSnap.forEach(d => {
        const v = d.data();
        if (v.type === 'course') {
          out.push({
            code: v.code,
            name: v.name,
            level: Number(v.level) || 0,
            private: true
          });
        }
      });
    }

    if (out.length) return out;
  } catch (e) {
    console.warn("Error fetching department courses:", e);
  }

  try {
    const out = [];
    const q = collection(db, 'courses');
    const snap = await getDocs(q);
    snap.forEach(d => {
      const v = d.data();
      if (v.department === dept) {
        out.push({
          code: v.code,
          name: v.name,
          level: Number(v.level) || 0
        });
      }
    });

    if (userRole === 'admin' || userRole === 'lecturer') {
      const privCol = collection(db, 'courses', 'privateData');
      const privSnap = await getDocs(privCol);
      privSnap.forEach(d => {
        const v = d.data();
        if (v.department === dept) {
          out.push({
            code: v.code,
            name: v.name,
            level: Number(v.level) || 0,
            private: true
          });
        }
      });
    }

    if (out.length) return out;
  } catch (e) {
    console.warn("Error fetching flat course list:", e);
  }

  return (Catalog[dept] || []);
}

export function studentDashboardView(user) {
  const wrap = document.createElement('div');
  wrap.className = 'layout';

  const sb = document.createElement('div');
  sb.className = 'sidebar card';
  sb.innerHTML = `
    <h3>Student Panel</h3>
    <div class="nav">
      <button class="btn" data-tab="home">Dashboard</button>
      <button class="btn" data-tab="registration">Registration®️</button>
      <button class="btn" data-tab="notifications">Notifications🔔</button>
      <button class="btn" data-tab="map">Venue Map🗺️</button>
    </div>
    <div class="small" style="margin-top:10px">
      Signed in as <b>${user.displayName || user.email}</b>
    </div>
    <div style="flex:1"></div>
    <button id="logoutBtn" class="btn" style="background:#c62828;color:white;position:sticky;bottom:10px;width:100%">Logout</button>
  `;

  sb.querySelector('#logoutBtn').addEventListener('click', () => {
    auth.signOut();
  });

  const content = document.createElement('div');
  content.className = 'grid';
  content.append(section('Welcome', `
    <div class="checklist">
      <div>• Register your courses to see lecturer updates.</div>
      <div>• Check <span class="tag">Notifications</span> daily.</div>
    </div>
  `));

  wrap.append(sb, content);

  sb.addEventListener('click', (e) => {
    if (e.target.matches('[data-tab]')) {
      $$('.nav .btn', sb).forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const tab = e.target.dataset.tab;
      content.innerHTML = '';
      if (tab === 'home') content.append(overviewSection());
      if (tab === 'registration') mountRegistration(content, user);
      if (tab === 'notifications') mountNotifications(content, user);
      if (tab === 'map') {
        fetch('map.html').then(res => res.text()).then(html => content.innerHTML = html);
      }
    }
  });

  sb.querySelector('[data-tab="home"]').classList.add('active');
  return wrap;
}

function overviewSection() {
  return section('Overview', `
    <div class="small">
      Use the sidebar to manage your courses and view classes confirmed by your lecturers.
    </div>
  `);
}

async function mountRegistration(root, user) {
  const s = section('Select Courses', `
    <div class="grid grid-3" id="courseGrid"></div>
    <div class="form-actions">
      <button class="btn btn-primary" id="saveStudent">Save Selection</button>
    </div>
  `);
  root.append(s);

  const roleDoc = await getDoc(doc(db, 'users', user.uid));
  const userRole = roleDoc.data()?.role || 'student';

  const snap = await getDoc(doc(db, 'studentProfiles', user.uid));
  const prof = snap.data() || { department: 'Computer Science', courses: [] };
  let department = prof.department;

  if (!department) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      department = userDoc.data()?.department || 'Computer Science';
    } catch {
      department = 'Computer Science';
    }
  }

  const pool = await fetchCoursesForDept(department, userRole);
  const selected = new Set(prof.courses || []);

  $('#courseGrid', s).innerHTML = pool.map(c => `
    <label class="card">
      <div class="form-row">
        <div><b>${c.code}</b> — ${c.name}${c.private ? ' (Private)' : ''}</div>
        <div class="small">Level ${c.level}</div>
        <div>
          <input type="checkbox" data-code="${c.code}" ${selected.has(c.code) ? 'checked' : ''}/> Include
        </div>
      </div>
    </label>
  `).join('');

  s.addEventListener('click', (e) => {
    if (e.target.matches('input[type=checkbox][data-code]')) {
      const code = e.target.dataset.code;
      if (e.target.checked) selected.add(code);
      else selected.delete(code);
    }
  });

  $('#saveStudent', s).addEventListener('click', async () => {
    if (userRole !== 'student') {
      toast('You are not allowed to save as a student profile.', 'error');
      return;
    }
    await setDoc(doc(db, 'studentProfiles', user.uid), {
      uid: user.uid,
      department,
      courses: [...selected]
    }, { merge: true });
    toast('Courses saved', 'ok');
  });
}

// Helper: chunk array for Firestore `in` queries
function chunk(arr, size = 10) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function mountNotifications(root, user) {
  const s = section("Today's Lecturer Availability", `<div id="notiList"></div>`);
  root.append(s);

  const roleDoc = await getDoc(doc(db, 'users', user.uid));
  const userRole = roleDoc.data()?.role || 'student';

  const snap = await getDoc(doc(db, 'studentProfiles', user.uid));
  const prof = snap.data() || {};
  const mine = new Set(prof.courses || []);

  if (!mine.size) {
    $('#notiList', s).innerHTML = '<div class="small">Register courses to see notifications.</div>';
    return;
  }

  const listEl = $('#notiList', s);
  const today = todayKey();
  const rowsMap = new Map();
  const courseChunks = chunk([...mine], 10);
  const unsubscribers = [];

  const render = () => {
    const rows = [...rowsMap.values()]
      .filter(v => v.date === today)
      .sort((a, b) => a.course.localeCompare(b.course));

    if (!rows.length) {
      listEl.innerHTML = '<div class="small">No classes today or lecturers have not updated availability.</div>';
      return;
    }

    listEl.innerHTML = `
      <table class="table">
        <thead><tr><th>Course</th><th>Status</th><th>Time</th><th>Venue</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td><b>${r.course}</b>${r.private ? ' (Private)' : ''}</td>
              <td>${
                r.confirmed === true ? '✅ Yes' :
                r.confirmed === false ? '❌ No' : '—'
              }</td>
              <td>${r.time || '-'}</td>
              <td>${r.venue || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  for (const cset of courseChunks) {
    const qRef = query(
      collection(db, 'classSessions'),
      where('date', '==', today),
      where('course', 'in', cset)
    );

    const unsub = onSnapshot(qRef, async (qs) => {
      for (const docSnap of qs.docs) {
        const v = { id: docSnap.id, ...docSnap.data() };

        // Students never try to update classSessions
        if (userRole === 'admin' || userRole === 'lecturer') {
          try {
            const privRef = doc(db, 'classSessions', docSnap.id, 'privateData', 'sensitive');
            const privSnap = await getDoc(privRef);
            if (privSnap.exists()) {
              v.private = privSnap.data();
            }
          } catch (_) {}
        }

        rowsMap.set(docSnap.id, v);
      }
      render();
    }, (err) => {
      console.error('classSessions listener error:', err);
      toast('Cannot read some sessions (permissions).', 'error');
    });

    unsubscribers.push(unsub);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.removedNodes.forEach(node => {
        if (node === s) {
          unsubscribers.forEach(u => typeof u === 'function' && u());
          observer.disconnect();
        }
      });
    }
  });
  if (s.parentNode) {
    observer.observe(s.parentNode, { childList: true });
  }
}

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const mobileToggleBtn = document.getElementById('mobileMenuToggle');

  if (sidebar && mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });

    sidebar.addEventListener('click', (e) => {
      if (e.target.matches('.nav .btn')) {
        sidebar.classList.remove('is-open');
      }
    });
  }
});
