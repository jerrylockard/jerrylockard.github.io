import { initializeApp } from "firebase/app";

// Public web config, not a secret — Firebase's access control is Security
// Rules + Cloud API-key restrictions, not hiding this. Single shared
// instance so every Firebase feature (Analytics, Remote Config, ...)
// initializes against the same app rather than double-calling
// initializeApp, which throws on a second [DEFAULT] app.
const firebaseConfig = {
  apiKey: "AIzaSyByCQhoHS-1zq-iUozCJQ48B-dsv-VW0ao",
  authDomain: "jerrylockard-site.firebaseapp.com",
  projectId: "jerrylockard-site",
  storageBucket: "jerrylockard-site.firebasestorage.app",
  messagingSenderId: "862932796338",
  appId: "1:862932796338:web:1dd29b0f732fe06cb15aab",
  measurementId: "G-59P6FFMVMS",
};

export const app = initializeApp(firebaseConfig);
