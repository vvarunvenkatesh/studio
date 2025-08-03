// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


// =================================================================================
// TODO: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
// =================================================================================
// Replace the entire object below with the `firebaseConfig` object from the
// Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyATMtv9y0OKx1eK2FjdhBEgyUjwGTsT4MQ",
  authDomain: "lastminit.firebaseapp.com",
  projectId: "lastminit",
  storageBucket: "lastminit.firebasestorage.app",
  messagingSenderId: "1045845040540",
  appId: "1:1045845040540:web:2b0aee1e109ac237437c59",
  measurementId: "YOUR_MEASUREMENT_ID"
};
// =================================================================================
// END OF CONFIGURATION
// =================================================================================


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
