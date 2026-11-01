import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDTTGSn85VHbekXB8nuO4wwlrbK_wAPcbg",
  authDomain: "mlbs6w.firebaseapp.com",
  projectId: "mlbs6w",
  storageBucket: "mlbs6w.firebasestorage.app",
  messagingSenderId: "238840067337",
  appId: "1:238840067337:web:accd99df22c7731c5bcfd8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);