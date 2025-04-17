import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3Iuej48VfDT3KVF2m1-Gz3BSY5-bpvps",
  authDomain: "saest-87e06.firebaseapp.com",
  projectId: "saest-87e06",
  storageBucket: "saest-87e06.firebasestorage.app",
  messagingSenderId: "43278021134",
  appId: "1:43278021134:web:6311f0e16924a3ae3dc25f",
  measurementId: "G-W5E5NYVXF4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  analytics,
  auth,
  db,
  onAuthStateChanged,
  collection,
  getDocs,
  deleteDoc,
  doc
};
