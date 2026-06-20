import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
const db = getFirestore(app);

const actionsConfig = {
  hockey_cesped: [
    {
      id: "disparo_arco",
      name: "Disparo al arco",
      icon: "fa-solid fa-crosshairs",
      subacciones: [
        { id: "desviado", name: "desviado", icon: "fa-solid fa-xmark" },
        { id: "atajado", name: "atajado", icon: "fa-solid fa-hand" },
        { id: "gol", name: "gol", icon: "fa-solid fa-futbol" }
      ]
    },
    {
      id: "ingreso_area",
      name: "Ingreso al Área Rival",
      icon: "fa-solid fa-users",
      subacciones: [
        { id: "jugada", name: "Jugada", icon: "fa-solid fa-people-group" },
        { id: "pase", name: "Pase", icon: "fa-solid fa-share-nodes" }
      ]
    },
    {
      id: "ingreso_23",
      name: "Ingreso a 23 Yardas Rival",
      icon: "fa-solid fa-arrow-right-to-bracket",
      subacciones: [
        { id: "jugada", name: "Jugada", icon: "fa-solid fa-people-group" },
        { id: "pase", name: "Pase", icon: "fa-solid fa-share-nodes" }
      ]
    },
    {
      id: "falta_cometida",
      name: "Falta cometida",
      icon: "fa-solid fa-hand-fist",
      subacciones: [
        { id: "falta_fisica", name: "falta física", icon: "fa-solid fa-hand-fist" },
        { id: "pie", name: "pié", icon: "fa-solid fa-shoe-prints" },
        { id: "elevada", name: "elevada", icon: "fa-solid fa-arrow-up" },
        { id: "obstruccion", name: "obstrucción", icon: "fa-solid fa-ban" },
        { id: "cinco_yardas", name: "5 yardas", icon: "fa-solid fa-gauge-simple-high" },
        { id: "protesta", name: "protesta", icon: "fa-solid fa-comments" }
      ]
    },
    {
      id: "falta_recibida",
      name: "Falta recibida",
      icon: "fa-solid fa-hand-paper",
      subacciones: [
        { id: "falta_fisica", name: "falta física", icon: "fa-solid fa-hand-fist" },
        { id: "pie", name: "pié", icon: "fa-solid fa-shoe-prints" },
        { id: "elevada", name: "elevada", icon: "fa-solid fa-arrow-up" },
        { id: "obstruccion", name: "obstrucción", icon: "fa-solid fa-ban" },
        { id: "cinco_yardas", name: "5 yardas", icon: "fa-solid fa-gauge-simple-high" },
        { id: "protesta", name: "protesta", icon: "fa-solid fa-comments" }
      ]
    },
    {
      id: "tarjetas",
      name: "Tarjetas",
      icon: "fa-solid fa-square",
      subacciones: [
        { id: "verde", name: "verde", icon: "fa-solid fa-square", color: "verde" },
        { id: "amarilla", name: "amarilla", icon: "fa-solid fa-square", color: "amarillo" },
        { id: "roja", name: "roja", icon: "fa-solid fa-square", color: "rojo" }
      ]
    },
    {
      id: "corner_corto",
      name: "Córner Corto",
      icon: "fa-solid fa-flag",
      subacciones: []
    },
    {
      id: "penal",
      name: "Penal",
      icon: "fa-solid fa-bullseye",
      subacciones: []
    }
  ]
};

async function seed() {
  console.log("Seeding config/acciones in Firestore...");
  try {
    const docRef = doc(db, "config", "acciones");
    await setDoc(docRef, actionsConfig, { merge: true });
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    console.log("\nNOTE: Seeding will fail if firestore.rules do not temporarily allow write permissions for the config collection.");
    console.log("Please temporarily change 'allow write: if false;' to 'allow write: if true;' in firestore.rules, deploy rules, run this script, and then restore them.");
  }
}

seed();
