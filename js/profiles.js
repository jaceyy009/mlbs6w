import { db } from "./firebase.js";

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const profileList = document.getElementById("profile-list");

const pinOverlay = document.getElementById("pin-overlay");
const pinProfileName = document.getElementById("pin-profile-name");
const pinInput = document.getElementById("pin-input");
const pinClose = document.getElementById("pin-close");
const pinForm = document.getElementById("pin-form");

const loadingScreen = document.getElementById("loading-screen");

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
        
        snapshot.forEach((doc) => {
            const profile = doc.data();
            
            const card = document.createElement("div");
            card.className = "profile-card";
            card.dataset.profileId = doc.id;
            
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
                openPinOverlay(doc.id, profile.displayName);
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

// Temporary PIN submission
pinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    
    if (!/^\d{4}$/.test(pinInput.value)) {
        pinError.textContent = "Please enter your 4-digit PIN.";
        return;
    }
    
    pinError.textContent = "PIN authentication is not connected yet.";
});

// Start
loadProfiles();
