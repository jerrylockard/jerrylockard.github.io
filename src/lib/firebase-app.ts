import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Public web config, not a secret — Firebase's access control is Security
// Rules + Cloud API-key restrictions, not hiding this. Single shared
// instance so every Firebase feature (Analytics, Remote Config, ...)
// initializes against the same app rather than double-calling
// initializeApp, which throws on a second [DEFAULT] app.
const firebaseConfig = {
  apiKey: "AIzaSyCAWTu03YJYLAjlMYAcVf5eB8UBR8yVOoY",
  authDomain: "jerrylockard-website.firebaseapp.com",
  projectId: "jerrylockard-website",
  storageBucket: "jerrylockard-website.firebasestorage.app",
  messagingSenderId: "428475521440",
  appId: "1:428475521440:web:d3c441222bf67348e5ecc5",
  measurementId: "G-3GEMY4N7NR",
};

export const app = initializeApp(firebaseConfig);

// Analytics only works in a browser with the right APIs available — guard
// so this module stays importable during Astro's server-side build.
export const analytics =
  typeof window !== "undefined"
    ? isSupported().then((ok) => (ok ? getAnalytics(app) : null))
    : Promise.resolve(null);
