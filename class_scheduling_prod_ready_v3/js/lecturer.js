import { db, auth } from './firebase-config.js';
import { Catalog } from './data.js';
import { $, $$, toast, section, todayKey, mapView } from './ui.js';
import {
  doc, getDoc, setDoc, collection, query, onSnapshot, getDocs, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let lecturerState = {
  levelsTaking: [],
  courses: [],
  schedule: []
};

/**
 * weekday helper (returns full name)
 */
function weekdayName(idx) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx];
}

/**
 * Normalize different schedule shapes into a canonical array:
 * Output: [ { course, time, venue, day }, ... ]
 *
 * Ensures every session object includes `day` (defaults to empty string).
 */
function normalizeSchedule(raw) {
  if (!raw) return [];

  const out = [];
  const ensure = (item) => ({
    course: String(item.course || item.code || '').trim(),
    time: item.time || '',
    venue: item.venue || '',
    day: item.day || (item.days || '') || ''
  });

  // If already array-like
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item) continue;
      if (item.course || item.code) {
        out.push(ensure(item));
      } else if (item.sessions && Array.isArray(item.sessions)) {
        const courseKey = item.course || item.code || '';
        for (const sess of item.sessions) {
          out.push(ensure({ course: courseKey, ...sess }));
        }
      } else {
        out.push(ensure(item));
      }
    }
    return out;
  }

  // If object keyed by course
  if (typeof raw === 'object') {
    for (const [courseKey, value] of Object.entries(raw)) {
      if (!value) continue;
      if (value.sessions && Array.isArray(value.sessions)) {
        for (const sess of value.sessions) {
          out.push(ensure({ course: courseKey, ...sess }));
        }
      } else if (Array.isArray(value)) {
        for (const sess of value) {
          out.push(ensure({ course: courseKey, ...sess }));
        }
      } else if (typeof value === 'object') {
        // direct time/venue/day object
        out.push(ensure({ course: courseKey, ...value }));
      } else {
        // primitive value - still include empty session so UI can show
        out.push({ course: String(courseKey), time: '', venue: '', day: '' });
      }
    }
    return out;
  }

  return out;
}

async function fetchCoursesForDept(dept, levels, userRole) {
  try {
    const out = [];
    const parent = doc(db, 'departments', dept);
    const sub = collection(parent, 'courses');
    const snap = await getDocs(sub);
    snap.forEach(d => {
      const v = d.data();
      if (!levels.length || levels.includes(Number(v.level))) {
        out.push({ code: v.code, name: v.name, level: Number(v.level) || 0 });
      }
    });

    if (userRole === 'admin') {
      const privateRef = collection(parent, 'privateData');
      const privateSnap = await getDocs(privateRef);
      privateSnap.forEach(d => {
        const v = d.data();
        if (v.type === 'course' && (!levels.length || levels.includes(Number(v.level)))) {
          out.push({ code: v.code, name: v.name, level: Number(v.level) || 0, private: true });
        }
      });
    }

    if (out.length) return out;
  } catch (err) {
    // silent fallback
  }

  try {
    const out = [];
    const q = collection(db, 'courses');
    const snap = await getDocs(q);
    snap.forEach(d => {
      const v = d.data();
      if (v.department === dept && (!levels.length || levels.includes(Number(v.level)))) {
        out.push({ code: v.code, name: v.name, level: Number(v.level) || 0 });
      }
    });

    if (out.length) return out;
  } catch (err) {
    // fallback to local catalog
  }

  return (Catalog[dept] || []).filter(c => !levels.length || levels.includes(Number(c.level)));
}

export function lecturerDashboardView(user) {
  const wrap = document.createElement('div');
  wrap.className = 'layout';

  const sb = document.createElement('div');
  sb.className = 'sidebar card';
  sb.style.display = 'flex';
  sb.style.flexDirection = 'column';
  sb.style.justifyContent = 'space-between';
  sb.innerHTML = `
    <div>
      <h3>Lecturer Panel</h3>
      <div class="nav">
        <button class="btn" data-tab="home">Dashboard</button>
        <button class="btn" data-tab="registration">Registration®️</button>
        <button class="btn" data-tab="notifications">Notifications🔔</button>
        <button class="btn" data-tab="map">Venue Map🗺️</button>
      </div>
      <div class="small" style="margin-top:10px">Signed in as <b>${user.displayName || user.email}</b></div>
    </div>
    <div style="margin-top:auto; padding-top:10px;">
      <button id="logoutBtn" class="btn btn-error" style="width:100%; background-color:red; color:white;">Logout</button>
    </div>
  `;

  const content = document.createElement('div');
  content.className = 'grid';
  content.append(section('Welcome', `<div class="checklist">
    <div>• Register the levels & courses you’ll be taking.</div>
    <div>• Confirm classes in Notifications so students are updated instantly.</div>
  </div>`));

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
      if (tab === 'map') content.append(mapView());
    }
  });

  sb.querySelector('#logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
      location.reload();
    }).catch((err) => {
      toast(err.message, 'error');
    });
  });

  sb.querySelector('[data-tab="home"]').classList.add('active');
  return wrap;
}

function overviewSection() {
  return section('Overview', `<div class="small">Use the sidebar to manage your courses, levels, and confirm your daily classes.</div>`);
}

async function mountRegistration(root, user) {
  const s = section('Select Levels & Courses', `
    <div>
      <h4>Levels Taking</h4>
      <div id="levelChoices" class="form-row">
        ${[100, 200, 300, 400, 500].map(lvl =>
          `<label><input type="checkbox" data-level="${lvl}"/> ${lvl}</label>`).join(' ')}
      </div>
    </div>
    <div>
      <h4>Courses</h4>
      <div id="courseGrid" class="grid grid-3"></div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="saveLecturer">Save Profile</button></div>
  `);
  root.append(s);

  // 🔒 Role check
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userRole = userDoc.data()?.role || '';
  if (!['lecturer', 'admin'].includes(userRole)) {
    $('#saveLecturer', s).disabled = true;
    $('#saveLecturer', s).classList.add('btn-disabled');
    toast('You do not have permission to edit lecturer profiles.', 'error');
    return;
  }

  const profSnap = await getDoc(doc(db, 'lecturerProfiles', user.uid));
  if (profSnap.exists()) {
    const data = profSnap.data();
    lecturerState = {
      levelsTaking: data.levelsTaking || [],
      courses: data.courses || [],
      // normalize whatever is stored
      schedule: normalizeSchedule(data.schedule)
    };
  } else {
    // ensure initial state is an array (important for new users)
    lecturerState = {
      levelsTaking: [],
      courses: [],
      schedule: []
    };
  }

  // mark chosen levels
  lecturerState.levelsTaking.forEach(lvl => {
    const checkbox = s.querySelector(`[data-level="${lvl}"]`);
    if (checkbox) checkbox.checked = true;
  });

  s.querySelector('#levelChoices').addEventListener('change', async () => {
    const chosenLevels = Array.from(s.querySelectorAll('[data-level]:checked')).map(c => Number(c.dataset.level));
    lecturerState.levelsTaking = chosenLevels;
    renderCoursesAndSchedule(s, user, chosenLevels);
  });

  renderCoursesAndSchedule(s, user, lecturerState.levelsTaking);

  $('#saveLecturer', s).addEventListener('click', async () => {
    const dept = profSnap.exists() ? profSnap.data()?.department : userDoc.data()?.department || '';
    await setDoc(doc(db, 'lecturerProfiles', user.uid), {
      uid: user.uid,
      department: dept,
      levelsTaking: lecturerState.levelsTaking,
      courses: lecturerState.courses,
      // always save as array (merge: true prevents accidental overwrite)
      schedule: normalizeSchedule(lecturerState.schedule)
    }, { merge: true });
    toast('Profile saved', 'ok');
  });
}

/**
 * Helpers to operate on the flat schedule array
 */
function findGlobalIndexForCourseAndIdx(scheduleArr, courseCode, idx) {
  let counter = -1;
  for (let i = 0; i < scheduleArr.length; i++) {
    if (String(scheduleArr[i].course).toLowerCase() === String(courseCode).toLowerCase()) {
      counter++;
      if (counter === idx) return i;
    }
  }
  return -1;
}

async function renderCoursesAndSchedule(s, user, levels) {
  const profSnap = await getDoc(doc(db, 'users', user.uid));
  const dept = profSnap.data()?.department || 'Computer Science';
  const userRole = profSnap.data()?.role || '';
  const courses = await fetchCoursesForDept(dept, levels, userRole);

  // ensure lecturerState.schedule is normalized array for UI operations
  lecturerState.schedule = normalizeSchedule(lecturerState.schedule);

  const selectedCourses = new Set(lecturerState.courses || []);
  const courseGrid = $('#courseGrid', s);

  // Build HTML: show multiple sessions per course
  courseGrid.innerHTML = courses.map(c => {
    const scheds = lecturerState.schedule.filter(sc => String(sc.course).toLowerCase() === String(c.code).toLowerCase());
    const sessions = scheds.length ? scheds : [{ course: c.code, time: '', venue: '', day: '' }];
    const sessionRows = sessions.map((sess, idx) => `
      <div class="session-row" data-course="${c.code}" data-index="${idx}">
        Time: <input type="time" data-time="${c.code}" data-index="${idx}" value="${sess.time || ''}"/>
        Venue: <input type="text" data-venue="${c.code}" data-index="${idx}" value="${sess.venue || ''}"/>
        Day:
        <select data-day="${c.code}" data-index="${idx}">
          ${['','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
            .map(d => `<option value="${d}" ${sess.day === d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-error small" data-remove="${c.code}" data-index="${idx}">✕</button>
      </div>
    `).join('');

    return `<label class="card">
      <div class="form-row">
        <div><b>${c.code}</b> — ${c.name}${c.private ? ' (Private)' : ''}</div>
        <div class="small">Level ${c.level}</div>
        <div><input type="checkbox" data-code="${c.code}" ${selectedCourses.has(c.code) ? 'checked' : ''}/> Include</div>
        <div class="sessions">${sessionRows}</div>
        <button type="button" class="btn small" data-add="${c.code}">+ Add Session</button>
      </div>
    </label>`;
  }).join('');

  // Remove previous listener (defensive)
  const newCourseGrid = courseGrid.cloneNode(true);
  courseGrid.parentNode.replaceChild(newCourseGrid, courseGrid);

  // Re-assign reference
  const grid = $('#courseGrid', s);

  // change handler for inputs/selects and checkboxes
  grid.addEventListener('change', (e) => {
    // checkbox include/exclude
    if (e.target.dataset.code && e.target.type === 'checkbox') {
      const code = e.target.dataset.code;
      if (e.target.checked) selectedCourses.add(code); else selectedCourses.delete(code);
      lecturerState.courses = [...selectedCourses];
      return;
    }

    // time input changed
    if (e.target.dataset.time) {
      const code = e.target.dataset.time;
      const idx = Number(e.target.dataset.index);
      const arr = normalizeSchedule(lecturerState.schedule);
      const gIdx = findGlobalIndexForCourseAndIdx(arr, code, idx);
      if (gIdx >= 0) {
        arr[gIdx].time = e.target.value || '';
      } else {
        // create new session if not present
        arr.push({ course: code, time: e.target.value || '', venue: '', day: '' });
      }
      lecturerState.schedule = arr;
      return;
    }

    // venue input changed
    if (e.target.dataset.venue) {
      const code = e.target.dataset.venue;
      const idx = Number(e.target.dataset.index);
      const arr = normalizeSchedule(lecturerState.schedule);
      const gIdx = findGlobalIndexForCourseAndIdx(arr, code, idx);
      if (gIdx >= 0) {
        arr[gIdx].venue = e.target.value || '';
      } else {
        arr.push({ course: code, time: '', venue: e.target.value || '', day: '' });
      }
      lecturerState.schedule = arr;
      return;
    }

    // day select changed
    if (e.target.dataset.day) {
      const code = e.target.dataset.day;
      const idx = Number(e.target.dataset.index);
      const arr = normalizeSchedule(lecturerState.schedule);
      const gIdx = findGlobalIndexForCourseAndIdx(arr, code, idx);
      if (gIdx >= 0) {
        arr[gIdx].day = e.target.value || '';
      } else {
        arr.push({ course: code, time: '', venue: '', day: e.target.value || '' });
      }
      lecturerState.schedule = arr;
      return;
    }
  });

  // click handler for add/remove buttons
  grid.addEventListener('click', (e) => {
    // add session
    if (e.target.dataset.add) {
      const code = e.target.dataset.add;
      const arr = normalizeSchedule(lecturerState.schedule);
      arr.push({ course: code, time: '', venue: '', day: '' });
      lecturerState.schedule = arr;
      renderCoursesAndSchedule(s, user, levels);
      return;
    }

    // remove session (nth for that course)
    if (e.target.dataset.remove) {
      const code = e.target.dataset.remove;
      const idx = Number(e.target.dataset.index);
      let arr = normalizeSchedule(lecturerState.schedule);
      let counter = -1;
      arr = arr.filter((sc) => {
        if (String(sc.course).toLowerCase() === String(code).toLowerCase()) {
          counter++;
          return counter !== idx;
        }
        return true;
      });
      lecturerState.schedule = arr;
      renderCoursesAndSchedule(s, user, levels);
      return;
    }
  });
}

async function mountNotifications(root, user) {
  const s = section("Today's Classes", `<div id="lecturerNotiList"></div>`);
  root.append(s);

  const profSnap = await getDoc(doc(db, 'lecturerProfiles', user.uid));
  const prof = profSnap.data() || {};
  prof.schedule = normalizeSchedule(prof.schedule);

  if (!prof.courses?.length) {
    $('#lecturerNotiList', s).innerHTML = '<div class="small">No courses found. Please register first.</div>';
    return;
  }

  const userRole = (await getDoc(doc(db, 'users', user.uid))).data()?.role || '';
  if (!['lecturer', 'admin'].includes(userRole)) {
    $('#lecturerNotiList', s).innerHTML = '<div class="small">You do not have permission to manage sessions.</div>';
    return;
  }

  // --- Proactively create sessions for the next 7 days ---
  try {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(todayKey(d));
    }

    const sessionsSnap = await getDocs(query(
      collection(db, 'classSessions'),
      where('lecturer', '==', user.uid),
      where('date', 'in', dates)
    ));
    const existingSessions = new Set(sessionsSnap.docs.map(d => d.id));

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + i);
      const dateStr = todayKey(dateObj);
      const weekday = weekdayName(dateObj.getDay()).toLowerCase();

      const counts = {};
      for (const sch of (prof.schedule || [])) {
        if (!sch) continue;
        const schDay = String(sch.day || '').toLowerCase();
        if (prof.courses.includes(sch.course) && schDay === weekday) {
          counts[sch.course] = (counts[sch.course] || 0) + 1;
          const occurrence = counts[sch.course] - 1; // 0-based
          const newId = `${user.uid}_${sch.course}_${dateStr}_${occurrence}`;

          if (!existingSessions.has(newId)) {
            await setDoc(doc(db, 'classSessions', newId), {
              course: sch.course,
              time: sch.time || '',
              venue: sch.venue || '',
              day: sch.day || '',
              date: dateStr,
              lecturer: user.uid,
              confirmed: null
            }, { merge: true });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error creating upcoming sessions:", err);
    toast("Could not prepare upcoming class schedule.", "error");
  }
  // --- End of proactive creation ---

  const listEl = $('#lecturerNotiList', s);
  const today = todayKey();

  const unsub = onSnapshot(
    query(
      collection(db, 'classSessions'),
      where('lecturer', '==', user.uid),
      where('date', '==', today)
    ),
    (qs) => {
      const rows = [];
      qs.forEach(docSnap => {
        rows.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (!rows.length) {
        listEl.innerHTML = '<div class="small">No classes scheduled for today.</div>';
      } else {
        listEl.innerHTML = rows.map(r => `
          <div class="card">
            <b>${r.course}</b> — ${r.day || ''}${r.day ? ', ' : ''}${r.time || 'No time set'} @ ${r.venue || 'No venue'}${r.private ? ' (Private)' : ''}
            <div>
              <button class="btn btn-ok" data-yes="${r.id}" ${r.confirmed === true ? 'disabled' : ''}>Yes</button>
              <button class="btn btn-error" data-no="${r.id}" ${r.confirmed === false ? 'disabled' : ''}>No</button>
            </div>
          </div>
        `).join('');
      }
    }
  );

  // remove subscription when section is removed
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.removedNodes.forEach(node => {
        if (node === s) {
          unsub();
          observer.disconnect();
        }
      });
    }
  });
  if (s.parentNode) {
    observer.observe(s.parentNode, { childList: true });
  }

  // Buttons yes/no handler
  listEl.addEventListener('click', async (e) => {
    if (e.target.dataset.yes) {
      const docSnap = await getDoc(doc(db, 'classSessions', e.target.dataset.yes));
      if (docSnap.exists() && (docSnap.data().lecturer === user.uid || userRole === 'admin')) {
        await setDoc(doc(db, 'classSessions', e.target.dataset.yes), {
          confirmed: true,
          lecturer: user.uid
        }, { merge: true });
        toast('Marked as YES', 'ok');
      } else {
        toast('You are not allowed to update this session.', 'error');
      }
    }
    if (e.target.dataset.no) {
      const docSnap = await getDoc(doc(db, 'classSessions', e.target.dataset.no));
      if (docSnap.exists() && (docSnap.data().lecturer === user.uid || userRole === 'admin')) {
        await setDoc(doc(db, 'classSessions', e.target.dataset.no), {
          confirmed: false,
          lecturer: user.uid
        }, { merge: true });
        toast('Marked as NO', 'error');
      } else {
        toast('You are not allowed to update this session.', 'error');
      }
    }
  });
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
