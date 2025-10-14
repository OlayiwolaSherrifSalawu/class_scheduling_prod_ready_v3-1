// Firebase Initialization (v10 CDN Modules)
export const firebaseConfig = {
  apiKey: "AIzaSyDQ3UUrYU9aWwjQ3z7QWID6oVBmnAcWLAA",
  authDomain: "class-scheduling-system-cf7a0.firebaseapp.com",
  projectId: "class-scheduling-system-cf7a0",
  storageBucket: "class-scheduling-system-cf7a0.firebasestorage.app",
  messagingSenderId: "826013666317",
  appId: "1:826013666317:web:4c85d103a5cf4ca5b3d944"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
