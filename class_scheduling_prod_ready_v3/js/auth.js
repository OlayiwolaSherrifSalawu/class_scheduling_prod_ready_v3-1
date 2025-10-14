// auth.js  (plug-and-play)
// ————————————————————————————————————————————————————————————————

import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function listenAuth(cb){ return onAuthStateChanged(auth, cb); }

// ---------- helpers to make signup airtight ----------
function getRoleFromURL(){
  try { return (new URLSearchParams(window.location.search).get('role')) || null; }
  catch { return null; }
}
function isHidden(el){
  if(!el) return true;
  const cs = window.getComputedStyle(el);
  return el.type === 'hidden' || el.disabled || el.hidden || cs.display === 'none' || cs.visibility === 'hidden' || el.offsetParent === null;
}
// Apply UI + validation rules based on role; resilient to partial markup.
function applyRoleUI(role){
  const lectId = document.getElementById('lectId');
  if(!lectId) return;
  const isLecturer = role === 'lecturer';
  if(isLecturer){
    if(!lectId.name) lectId.name = 'lectId';
    lectId.disabled = false;
    lectId.required = true;
    lectId.style.display = '';
  } else {
    // This is the key: disabled inputs are excluded from native validation.
    lectId.required = false;
    lectId.disabled = true;
    lectId.style.display = 'none';
  }
}

// Run on every page that includes auth.js (safe no-ops otherwise).
document.addEventListener('DOMContentLoaded', () => {
  const urlRole   = getRoleFromURL();
  const form      = document.getElementById('signupForm');
  const roleSel   = document.getElementById('roleSelect');
  const lectId    = document.getElementById('lectId');

  // Preselect role from URL if present (e.g., signup.html?role=student)
  if (roleSel && urlRole) {
    roleSel.value = urlRole;
    roleSel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Keep UI in sync as role changes
  if (roleSel) {
    applyRoleUI(roleSel.value);
    roleSel.addEventListener('change', () => applyRoleUI(roleSel.value));
  } else if (urlRole) {
    applyRoleUI(urlRole);
  }

  // Ensure the form always carries a role field (hidden) for backend/profile set-up
  if (form && !form.querySelector('input[name="role"]')) {
    const hiddenRole = document.createElement('input');
    hiddenRole.type  = 'hidden';
    hiddenRole.name  = 'role';
    hiddenRole.value = (roleSel && roleSel.value) || urlRole || 'student';
    form.appendChild(hiddenRole);
    if (roleSel) roleSel.addEventListener('change', () => hiddenRole.value = roleSel.value);
  }

  // Defensive: if the browser flags an invalid hidden control, drop `required` so it can't block focus.
  document.addEventListener('invalid', (ev) => {
    const el = ev.target;
    if (isHidden(el) && el.required) el.required = false;
  }, true);

  // Double-defense right before submit
  if (form) {
    form.addEventListener('submit', () => {
      if (lectId && (isHidden(lectId) || lectId.disabled)) {
        lectId.required = false;
        lectId.disabled = true;
      }
    });
  }
});

// ---------- existing auth API (unchanged behavior) ----------
export async function signupUser({email, password, name, role, extra}){
  // Fall back to URL role if not provided by the caller
  const finalRole = role || getRoleFromURL() || 'student';

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const profile = {
    uid: cred.user.uid,
    email,
    name,
    role: finalRole,
    createdAt: serverTimestamp(),
    ...extra
  };
  await setDoc(doc(db, 'users', cred.user.uid), profile);

  if (finalRole === 'lecturer'){
    await setDoc(doc(db, 'lecturerProfiles', cred.user.uid), {
      uid: cred.user.uid,
      department: (extra && extra.department) || '',
      levels: [],
      courses: [],
      schedule: []
    }, { merge: true });
  } else {
    await setDoc(doc(db, 'studentProfiles', cred.user.uid), {
      uid: cred.user.uid,
      department: (extra && extra.department) || '',
      level: Number(extra && extra.level) || 100,
      courses: []
    }, { merge: true });
  }

  return { user: cred.user, role: finalRole };
}

export async function signinUser({email, password}){
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db,'users', cred.user.uid));
  const role = snap.exists() ? (snap.data().role || null) : null;
  return { user: cred.user, role };
}

export function signoutUser(){ return signOut(auth); }
