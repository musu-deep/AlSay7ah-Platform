import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "arctic-device-8dzmz",
  appId: "1:272992684584:web:df0860f699bd3eea73c31d",
  apiKey: "AIzaSyBh8Qo0NxI7r6njFvqX6O_kb1yex9QoQXw",
  authDomain: "arctic-device-8dzmz.firebaseapp.com",
  storageBucket: "arctic-device-8dzmz.firebasestorage.app",
  messagingSenderId: "272992684584",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use custom databaseId for Firestore
const firestoreDatabaseId = "ai-studio-ecf6ff3e-244c-40c9-9c61-4eb1c73e8919";
export const db = initializeFirestore(app, {}, firestoreDatabaseId);

export const auth = getAuth(app);
export default app;
