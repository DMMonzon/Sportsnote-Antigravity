import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0BR6zWrpASJ1ih_Shw26CeKOQt8VmdLA",
  authDomain: "sportsnote-2ff50.firebaseapp.com",
  projectId: "sportsnote-2ff50",
  storageBucket: "sportsnote-2ff50.firebasestorage.app",
  messagingSenderId: "345004810387",
  appId: "1:345004810387:web:562eebcaea3e7bd1b92d66",
  measurementId: "G-MX2W01ZCJR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, signInWithPopup, signOut, collection, query, where, getDocs, doc, setDoc };
