// UI helpers
export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

export function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export function initTheme(){
  const saved = localStorage.getItem('theme') || 'dark';
  setTheme(saved);
}

export function toast(msg, type='ok', timeout=3500){
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.remove(); }, timeout);
}

export function routePush(hash){
  location.hash = hash.startsWith('#')? hash : '#'+hash;
}

export function todayKey(){
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

export function section(title, inner){
  const s = document.createElement('section');
  s.className = 'card';
  s.innerHTML = `<h2>${title}</h2>${inner}`;
  return s;
}
