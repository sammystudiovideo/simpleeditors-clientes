import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqcHzOiDVwC9-6e2TNZqkOLpGarJHJrhs",
  authDomain: "gestion-clientes-4c286.firebaseapp.com",
  projectId: "gestion-clientes-4c286",
  storageBucket: "gestion-clientes-4c286.firebasestorage.app",
  messagingSenderId: "695956619336",
  appId: "1:695956619336:web:a0c293a8438e8adb1e187d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);