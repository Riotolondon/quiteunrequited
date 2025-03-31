import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyApK8INzepM9Ivx03rg5NJeE05wvtnXWA4",
  authDomain: "quiteunrequited-ac3de.firebaseapp.com",
  projectId: "quiteunrequited-ac3de",
  storageBucket: "quiteunrequited-ac3de.firebasestorage.appspot.com",
  messagingSenderId: "892290232808",
  appId: "1:892290232808:web:6097709cafc1499b29b45d",
  measurementId: "G-NB74854SKP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
