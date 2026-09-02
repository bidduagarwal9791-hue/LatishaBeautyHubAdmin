import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsjp0EQQr01tAEWuUzQnGYySvS30sUBzs",
  authDomain: "latisha-beauty-hub-pro.firebaseapp.com",
  projectId: "latisha-beauty-hub-pro",
  storageBucket: "latisha-beauty-hub-pro.firebasestorage.app",
  messagingSenderId: "243484111988",
  appId: "1:243484111988:web:b47f9dc3cf7b12074b60d21",
  measurementId: "G-MPCH5ZLSJC",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;