import { db } from "./firebase.js";

import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const STORAGE_KEY = "currentProfile";

// HTML elements
const loadingScreen = document.getElementById("loading-screen");

const profileAvatar = document.getElementById("profile-avatar-home");
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

async function loadEpisodes() {
    const episodeList = document.getElementById("episode-list");

    try {
        const episodesRef = collection(db, "episodes");

        const activeEpisodesQuery = query(
            episodesRef,
            where("active", "==", true)
        );

        const snapshot = await getDocs(activeEpisodesQuery);

        episodeList.innerHTML = "";

        if (snapshot.empty) {
            episodeList.textContent = "No episodes available.";
            return;
        }

        snapshot.forEach((episodeDoc) => {
            const episode = episodeDoc.data();

            const card = document.createElement("article");
            card.className = "episode-card";
            card.setAttribute("role", "link");
            card.tabIndex = 0;

            function openEpisode() {
                window.location.href = `watch.html?id=${encodeURIComponent(episodeDoc.id)}`;
            }

            card.addEventListener("click", openEpisode);

            card.addEventListener("keydown", (event) => {
                if (event.key == "Enter" || event.key === " ") {
                    event.preventDefault();
                    openEpisode();
                }
            });

            const endCard = document.createElement("img");
            endCard.className = "episode-end-card";
            endCard.src = episode.endCard || "";
            endCard.alt = episode.title || "Episode";
            endCard.loading = "lazy";

            const details = document.createElement("div");
            details.className = "episode-details";

            const title = document.createElement("h3");
            title.className = "episode-title";
            title.textContent = episode.title || "Untitled Episode";

            const description = document.createElement("p");
            description.className = "episode-description";
            description.textContent = episode.description || "No description available.";

            const duration = document.createElement("p");
            duration.className = "episode-duration";

            const seconds = Number(episode.duration);

            if (Number.isFinite(seconds) && seconds >= 0) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;

                duration.textContent = `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
            } else {
                duration.textContent = "Duration unavailable";
            }

            details.appendChild(title);
            details.appendChild(description);
            details.appendChild(duration);

            card.appendChild(endCard);
            card.appendChild(details);

            episodeList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading episodes:", error);

        episodeList.textContent = "Unable to load episodes. Please try again.";
    }
}

signOutButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.replace("index.html");
});

loadAccount();
loadEpisodes();
