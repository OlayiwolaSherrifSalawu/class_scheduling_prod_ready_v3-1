import { initTheme, setTheme, toast, routePush } from './ui.js';
import { signupUser, signinUser, signoutUser, listenAuth } from './auth.js';
import { auth, db } from './firebase-config.js';
import { Departments, Levels } from './data.js';
import { lecturerDashboardView } from './lecturer.js';
import { studentDashboardView } from './student.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const view = document.getElementById('routerView');
const themeBtn = document.getElementById('themeToggle');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

initTheme();
themeBtn.addEventListener('click', ()=>{
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'light' ? 'dark' : 'light');
});

// Auth chip
const authChip = document.getElementById('authChip');
function setAuthChip(user, role){
  if(!user){
    authChip.innerHTML = `<button class="btn btn-ghost" data-go="signin">Sign in🔐</button>`;
    authChip.querySelector('[data-go]').onclick = ()=> routePush('signin');
    return;
  }
  const name = user.displayName || user.email;
  authChip.innerHTML = `
    <div class="chip">
      <span>${name}</span>
      <span class="role">${role||''}</span>
      <button id="logoutBtn" class="btn btn-sm btn-ghost">Logout</button>
    </div>
  `;
  document.getElementById('logoutBtn').onclick = async ()=>{
    await signoutUser();
    toast('Logged out','ok');
    routePush('home');
  };
}

async function getRole(uid){
  const snap = await getDoc(doc(db,'users', uid));
  return snap.exists() ? (snap.data().role || null) : null;
}

// ---- Views ----
function homeView(){
  view.innerHTML = `
    <div class="grid hero">
      <div class="hero-copy card hero-card">
        <span class="badge">University Scheduler</span>
        <h1>Plan, Confirm, Notify — all in one place.</h1>
        <p class="small">Lecturers set schedules and confirm classes daily. Students get real-time updates by course.</p>
        <div class="cta">
          <button class="btn btn-primary" data-go="signup">Sign up</button>
          <button class="btn" data-go="signin">Sign in</button>
        </div>
      </div>
      <div class="card">
        <h3>How it works</h3>
        <ol class="features">
          <li>Lecturers complete a one-time registration: levels → courses → schedule.</li>
          <li>Each day, lecturers confirm classes that will hold.</li>
          <li>Students register their courses and see confirmed classes for today.</li>
        </ol>
      </div>
    </div>
  `;
  view.querySelectorAll('[data-go]').forEach(a=>a.onclick=()=> routePush(a.dataset.go));
}

function aboutView(){
  view.innerHTML = `
    <div class="grid">
      <div class="card">
        <h2>About</h2>
        <p>This platform connects lecturers and students with clear, real-time class schedules.</p>
      </div>
    </div>
  `;
}

function signupView(){
  view.innerHTML = `
    <div class="grid">
      <div class="card">
        <h2>Create your account</h2>
        <div class="segmented">
          <button class="seg active" data-role="lecturer">Lecturer</button>
          <button class="seg" data-role="student">Student</button>
        </div>

        <form id="signupForm">
          <div class="form-row">
            <label>Name</label>
            <input id="name" class="input" autocomplete="name" required/>
          </div>
          <div class="form-row">
            <label>Department</label>
            <select id="dept" class="input">
              ${Departments.map(d=>`<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div id="lecturerOnly">
            <div class="form-row">
              <label>Lecturer ID</label>
              <input id="lectId" class="input" autocomplete="off" required name="lectId"/>
            </div>
          </div>
          <div id="studentOnly" class="hidden">
            <div class="form-row">
              <label>Level</label>
              <select id="level" class="input">
                ${Levels.map(l=>`<option value="${l}">${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Matric Number</label>
              <input id="matric" class="input" autocomplete="off"/>
            </div>
          </div>
          <div class="form-row">
            <label>School Email</label>
            <input type="email" id="email" class="input" autocomplete="email" required/>
          </div>
          <div class="form-row">
            <label>Password</label>
            <input type="password" id="password" class="input" autocomplete="new-password" required/>
          </div>
          <div class="form-row">
            <label>Confirm Password</label>
            <input type="password" id="confirm" class="input" autocomplete="new-password" required/>
          </div>
          <div class="form-actions">
            <button type="submit" id="signupBtn" class="btn btn-primary">Create account</button>
            <button type="button" class="btn btn-ghost" data-go="home">Cancel</button>
          </div>
          <div class="small">Already have an account? <a href="#" data-go="signin">Sign in</a></div>
        </form>
      </div>
      <div class="card">
        <h3>Why sign up?</h3>
        <ul class="features">
          <li>Lecturers can manage schedules and notify students instantly.</li>
          <li>Students get a clear view of classes that will hold today.</li>
          <li>All data safely stored in Firestore.</li>
        </ul>
      </div>
    </div>
  `;

  const segs = Array.from(view.querySelectorAll('.seg'));
  const lectOnly = document.getElementById('lecturerOnly');
  const studOnly = document.getElementById('studentOnly');
  const lectIdField = document.getElementById('lectId');
  let role = 'lecturer';

  function switchRole(newRole) {
    role = newRole;
    if (role === 'lecturer') {
      lectOnly.classList.remove('hidden');
      studOnly.classList.add('hidden');
      lectIdField.setAttribute('required', 'true');
      lectIdField.setAttribute('name', 'lectId');
    } else {
      studOnly.classList.remove('hidden');
      lectOnly.classList.add('hidden');
      lectIdField.removeAttribute('required');
      lectIdField.removeAttribute('name');
      lectIdField.value = '';
    }
  }

  segs.forEach(s=> s.onclick = ()=>{
    segs.forEach(x=>x.classList.remove('active'));
    s.classList.add('active');
    switchRole(s.dataset.role);
  });

  // Auto-switch if ?role=student in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('role') === 'student') {
    switchRole('student');
    segs.forEach(s => s.classList.remove('active'));
    segs.find(s => s.dataset.role === 'student')?.classList.add('active');
  }

  view.querySelectorAll('[data-go]').forEach(a=>a.onclick=()=> routePush(a.dataset.go));

  const form = document.getElementById('signupForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const department = document.getElementById('dept').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;
    if(password !== confirm){ toast('Passwords do not match','warn'); return; }

    try{
      if(role === 'lecturer'){
        const lecturerID = lectIdField.value.trim();
        await signupUser({
          email, password, name, role: 'lecturer',
          extra: { department, lecturerID }
        });
      } else {
        const level = Number(document.getElementById('level').value);
        const matric = document.getElementById('matric').value.trim();
        await signupUser({
          email, password, name, role: 'student',
          extra: { department, level, matric }
        });
      }
      toast('Account created','ok');
      routePush('home');
    } catch(err){
      toast(err.message || 'Signup failed','err');
    }
  });
}

function signinView(){
  view.innerHTML = `
    <div class="grid">
      <div class="card">
        <h2>Welcome back</h2>
        <form id="signinForm">
          <div class="form-row">
            <label>Email</label>
            <input type="email" id="email" class="input" autocomplete="email" required/>
          </div>
          <div class="form-row">
            <label>Password</label>
            <input type="password" id="password" class="input" autocomplete="current-password" required/>
          </div>
          <div class="form-actions">
            <button type="submit" id="signinBtn" class="btn btn-primary">Sign in</button>
            <button type="button" class="btn btn-ghost" data-go="home">Cancel</button>
          </div>
          <div class="small">New here? <a href="#" data-go="signup">Create an account</a></div>
        </form>
      </div>
      <div class="card">
        <h3>Tip</h3>
        <p class="small">New here? <a href="#" data-go="signup">Create an account</a></p>
      </div>
    </div>
  `;
  view.querySelectorAll('[data-go]').forEach(a=>a.onclick=()=> routePush(a.dataset.go));
  const form = document.getElementById('signinForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if(!email || !password){ toast('Enter email and password','warn'); return; }
    try{
      const { user, role } = await signinUser({email,password});
      toast('Welcome back','ok');
      setAuthChip(user, role);
      if(role==='lecturer') routePush('lecturer');
      else if(role==='student') routePush('student');
      else routePush('home');
    }catch(err){
      toast(err.message||'Sign in failed','err');
    }
  });
}

// ---- Router ----
async function route(){
  const hash = location.hash.replace('#','') || 'home';
  const user = auth.currentUser;

  if(hash==='home') return homeView();
  if(hash==='about') return aboutView();
  if(hash==='signup') return signupView();
  if(hash==='signin') return signinView();
  if(hash==='map'){
    return fetch('map.html').then(res=>res.text()).then(html=>view.innerHTML=html);
  }

  if(hash==='lecturer'){
    if(!user){ routePush('signin'); return; }
    const role = await getRole(user.uid);
    if(role!=='lecturer'){ toast('Not authorized','err'); routePush('home'); return; }
    view.innerHTML='';
    view.append(lecturerDashboardView(user));
    // ADDED CODE: Mobile sidebar logic
    const sidebar = document.querySelector('.sidebar');
    const mobileToggleBtn = document.getElementById('mobileMenuToggle');
    if (sidebar && mobileToggleBtn) {
      mobileToggleBtn.onclick = () => sidebar.classList.toggle('is-open');
      sidebar.onclick = (e) => {
        if (e.target.matches('.nav .btn')) {
          sidebar.classList.remove('is-open');
        }
      };
    }
    return;
  }

  if(hash==='student'){
    if(!user){ routePush('signin'); return; }
    const role = await getRole(user.uid);
    if(role!=='student'){ toast('Not authorized','err'); routePush('home'); return; }
    view.innerHTML='';
    view.append(studentDashboardView(user));
    // ADDED CODE: Mobile sidebar logic
    const sidebar = document.querySelector('.sidebar');
    const mobileToggleBtn = document.getElementById('mobileMenuToggle');
    if (sidebar && mobileToggleBtn) {
      mobileToggleBtn.onclick = () => sidebar.classList.toggle('is-open');
      sidebar.onclick = (e) => {
        if (e.target.matches('.nav .btn')) {
          sidebar.classList.remove('is-open');
        }
      };
    }
    return;
  }

  // default
  homeView();
}

window.addEventListener('hashchange', route);
listenAuth(async (user)=>{
  if(user){
    const role = await getRole(user.uid);
    setAuthChip(user, role);
  } else {
    setAuthChip(null, null);
  }
  route();
});

// initial
route();