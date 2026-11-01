import { db } from "./firebase.js";

import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const profileList = document.getElementById("profile-list");

const pinOverlay = document.getElementById("pin-overlay");
const pinProfileName = document.getElementById("pin-profile-name");
const pinInput = document.getElementById("pin-input");
const pinClose = document.getElementById("pin-close");
const pinForm = document.getElementById("pin-form");
const pinError = document.getElementById("pin-error");

const loadingScreen = document.getElementById("loading-screen");

const STORAGE_KEY = "currentProfile";

let selectedProfileId = null;

// Load profiles from Firestore
async function loadProfiles() {
    try {
        const usersRef = collection(db, "users");
        
        const activeProfilesQuery = query(
            usersRef,
            where("active", "==", true)
        );
        
        const snapshot = await getDocs(activeProfilesQuery);
        
        profileList.innerHTML = "";
        
        snapshot.forEach((profileDoc) => {
            const profile = profileDoc.data();
            
            const card = document.createElement("div");
            card.className = "profile-card";
            
            const avatarContainer = document.createElement("div");
            avatarContainer.className = "profile-avatar"
            
            const avatar = document.createElement("img");
            avatar.src = profile.avatar;
            avatar.alt = "";
            
            const name = document.createElement("p");
            name.className = "profile-name";
            name.textContent = profile.displayName;
            
            avatarContainer.appendChild(avatar);
            card.appendChild(avatarContainer);
            card.appendChild(name);
            
            card.addEventListener("click", () => {
                openPinOverlay(profileDoc.id, profile.displayName);
            });
            
            profileList.appendChild(card);
        });
        
        if (snapshot.empty) {
            profileList.textContent = "No profiles available.";
        }
    } catch (error) {
        console.error("Error loading profiles:", error);
        profileList.textContent = "Unable to load profiles. Please try again.";
    } finally {
        loadingScreen?.classList.add("hidden");
    }
}

// Open PIN overlay
function openPinOverlay(profileId, displayName) {
    selectedProfileId = profileId;
    
    pinProfileName.textContent = displayName;
    pinInput.value = "";
    pinError.textContent = "";
    
    pinOverlay.classList.remove("hidden");
    pinInput.focus();
}

// Close PIN overlay
function closePinOverlay() {
    pinOverlay.classList.add("hidden");
    
    selectedProfileId = null;
    pinInput.value = "";
    pinError.textContent = "";
}

// Check saved profile on return
async function restoreSession() {
    const savedProfileId = localStorage.getItem(STORAGE_KEY);

    if (!savedProfileId) {
        await loadProfiles();
        return;
    }

    try {
        const profileRef = doc(db, "users", savedProfileId);
        const profileSnapshot = await getDoc(profileRef);

        if (
            profileSnapshot.exists() &&
            profileSnapshot.data().active == true
        ) {
            window.location.replace("home.html");
            return;
        }

        // Profile no longer exists or is inactive
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Error restoring profile:", error);

        profileList.textContent = "Unable to restore your profile. Please reload the page.";

        loadingScreen?.classList.add("hidden");
        return;
    }

    await loadProfiles();
}

pinClose.addEventListener("click", closePinOverlay);

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        !pinOverlay.classList.contains("hidden")
    ) {
        closePinOverlay();
    }
});

// PIN input formatting
pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value
        .replace(/\D/g, "")
        .slice(0, 4);
        
    pinError.textContent = "";
});

// PIN submission
pinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const enteredPin = pinInput.value;
    
    if (!/^\d{4}$/.test(pinInput.value)) {
        pinError.textContent = "Please enter your 4-digit PIN.";
        return;
    }

    if (!selectedProfileId) {
        pinError.textContent = "Please select a profile.";
        return;
    }

    const submitButton = pinForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    pinError.textContent = "Checking PIN...";

    try {
        const profileRef = doc(db, "users", selectedProfileId);
        const profileSnapshot = await getDoc(profileRef);

        if (!profileSnapshot.exists()) {
            pinError.textContent = "This profile no longers exists.";
            return;
        }

        const profile = profileSnapshot.data();

        if (profile.active !== true) {
            pinError.textContent = "This profile is inactive.";
            return;
        }

        if (String(profile.pin) !== enteredPin) {
            pinError.textContent = "Incorrect PIN. Please try again.";
            pinInput.value = "";
            pinInput.focus();
            return;
        }

        localStorage.setItem(STORAGE_KEY, selectedProfileId);
        window.location.replace("home.html");
    } catch (error) {
        console.error("PIN verification error:", error);
        pinError.textContent = "Unable to verify PIN. Please try again.";
    pinError.textContent = "PIN authentication is not connected yet.";
    } finally {
        submitButton.disabled = false;
    }
});

// Start
loadProfiles();
