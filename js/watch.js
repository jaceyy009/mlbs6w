import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import Hls from "https://cdn.jsdelivr.net/npm/hls.js@1.6.15/+esm";

const STORAGE_KEY = "currentProfile";

// Elements
const loadingScreen = document.getElementById("loading-screen");

const video = document.getElementById("video-player");
const videoError = document.getElementById("video-error");

const episodeTitle = document.getElementById("episode-title");
const episodeDescription = document.getElementById("episode-description");
const episodeDuration = document.getElementByid("episode-duration");

const subtitleSelect = document.getElementById("subtitle-select");

const profileAvatar = document.getElementById("profile-avatar-home");
const profileName = document.getElementById("profile-name");

const signOutButton = document.getElementById("sign-out-button");

let hls = null;

const R2_PUBLIC_BASE_URL = "https://pub-9c03220fa7234888b19aa7e699001f8d.r2.dev";

function resolveMediaSource(source) {
  if (!source) {
    throw new Error("Media source is missing.");
  }

  if (/^https:\/\//i.test(source)) {
    return source;
  }

  if (R2_PUBLIC_BASE_URL) {
    return `${R2_PUBLIC_BASE_URL.replace(/\$/, "")}/${source
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  throw new Error("R2 media domain has not been configured.");
}

async function loadAccount() {
  const profileId = localStorage.getItem(STORAGE_KEY);

  if (!profileid) {
    window.location.replace("index.html");
    return false;
  }

  const profileRef = doc(db, "users", profileId);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists() || profileSnapshot.data().active !== true) {
    localStorage.removeItem(STORAGE_KEY);
    window.location.replace("index.html");
    return false;
  }

  const profile = profileSnapshot.data();

  profileName.textContent = profile.displayName;
  profileAvatar.src = profile.avatar;

  return true;
}

function loadSubtitles(subtitles = []) {
  subtitleSelect.innerHTML = "";

  const offOption = document.createElement("option");
  offOption.value = "-1";
  offOfption.textContent = "Off";
  subtitleSelect.appendChild(offOption);

  subtitles.forEach((subtitle, index) => {
    if (subtitle.format !== "vtt" || !subtitle.key || !subtitle.language || !subtitle.label) {
      return;
    }

    const option = document.createElement("option");
    option.value = String(index);
    option.textCotent = subtitle.label;

    subtitleSelect.appendChild(option);
  });

  function selectSubtitle() {
    const selectedIndex = Number(subtitleSelect.value);

    video.querySelectorAll("track").forEach((track) => {
      track.remove();
    });

    if (selectedIndex === -1) {
      video.textTracks[0] &&
        (video.textTracks[0].mode = "disabled";
      return;
    }

    const subtitle = subtitles[selectedIndex];

    if (!subtitle || subtitle.format !== "vtt") return'

    let subtitleUrl;

    try {
      subtitleUrl = resolveMediaSource(subtitle.key);
    } catch (error) {
      showError(error.message);
      return;
    }

    const track = document.createElement("track");

    track.kind = "subtitles";
    track.label = subtitle.label;
    track.srclang = subtitle.language;
    track.src = subtitleUrl;

    video.appendChild(track);

    track.addEventListener("load", () => {
      track.track.mode = "showing";
    }, { once: true });
  }

  subtitleSelect.addEventListener("change", selectSubtitle);

  const defaultIndex = subtitles.findIndex(
    (subtitle) => subtitle.default === true
  );

  if (defaultIndex !== -1) {
    subtitleSelect.value = String(defaultIndex);
    selectSubtitle();
  }
}

function showError(message) {
  videoError.textContent = message;
  videoError.classList.remove("hidden");
}

function loadVideo(videoData) {
  try {
    const source = resolveMediaSource(videoData.source);

    if (videoData.type === "mp4") {
      video.src = source;
      return;
    }

    if (videoData.type === "hls") {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (Hls.isSupported()) {
        hls = new Hls();

        hls.loadSource(source);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            showError("Unable to play this video.");
            hls.destroy();
            hls = null;
          }
        };
      } else {
        showError("HLS playback is not supported by this browser.");
      }

      return;
    }

    showError("Unsupported video format.");
  } catch (error) {
    showError(error.message);
  }
}

async function loadEpisode() {
  const params = new URLSearchParams(window.location.search);
  const episodeId = paramgs.get("id");

  if (!episodeId) {
    showError("No episode was specified.");
    return;
  }

  try {
    const episodeRef = doc(db, "episodes", episodeId);
    const episodeSnapshot = await getDoc(episodeRef);

    if (!episodeSnapshot.exists() || episodeSnapshot.data().active !== true) {
      showError("This episode is unavailable.");
      return;
    }

    const episode = episodeSnapshot.data();

    episodeTitle.textContent = episode.title || "Untitled Episode";

    episodeDescription.textContent = episode.description || "";

    const seconds = Number(episode.duration);

    if (Number.isFinite(seconds) && seconds >= 0) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      episodeDuration.textContent = `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    }

    loadSubtitles(episode.subtitles || []);

    if (!episode.video || !episode.video.type || !episode.video.source) {
      showError("This episode does not have a vieo source yet.");
      return;
    }

    loadVideo(episode.video);
  } catch (error) {
    console.error("Episode loading error:", error);
    showError("Unable to load this episode.");
  }
}

signOutButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.replace("index.html");
});

async function initialize() {
  try {
    const authenticated = await loadAccount();

    if (!authenticated) return;

    await loadEpisode();
  } catch (error) {
    console.error("Initialization error:", error);
    showError("Unable to initialize the playback page.");
  } finally {
    loadingScreen?.classList.add("hidden");
  }
}

initialize();
