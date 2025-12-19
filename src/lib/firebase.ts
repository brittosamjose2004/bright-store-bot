import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Replace with your actual config or use environment variables
const firebaseConfig = {
    apiKey: "dummy_key", // User needs to fill this
    authDomain: "dummy_domain",
    projectId: "dummy_project",
    storageBucket: "dummy_bucket",
    messagingSenderId: "dummy_sender",
    appId: "dummy_app_id",
};

// Initialize Firebase
let app;
let auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} else {
    app = getApp();
    auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
