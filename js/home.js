import { db } from "./firebase.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const STORAGE_KEY = "currentProfile";

// HTML elements
const loadingScreen = document.getElementById("loading-screen");

const profileAvatar = document.getElementById("profile-avatar");
const profileName = document.getElementById("profile-name");
const welcomeMessage = document.getElementById("welcome-message");

const signOutButton = document.getElementById("sign-out-button");

// Load signed-in profile
async function loadAccount() {
    const profileId = localStorage.getItem(STORAGE_KEY);
    
    // No saved profile
    if (!profileId) {
        window.location.replace("index.html");
        return;
    }
    
    try {
        const profileRef = doc(db, "users", profileId);
        const profileSnapshot = await getDoc(profileRef);
        
        // Profile doesn't exist or is inactive
        if (!profileSnapshot.exists() || profileSnapshot.data().active !== true) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.replace("index.html");
            return;
        }
        
        const profile = profileSnapshot.data();
        
        // Display account information
        profileAvatar.src = profile.avatar;
        profileName.textContent = profile.displayName;
        
        welcomeMessage.textContent = `Welcome, ${profile.displayName}!`;
    } catch (error) {
        console.error("Error loading account:", error);
        
        welcomeMessage.textContent = "Unable to load your account. Please reload the page.";
    } finally {
        loadingScreen?.classList.add("hidden");
    }
}

signOutButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.replace("index.html");
});

loadAccount();
