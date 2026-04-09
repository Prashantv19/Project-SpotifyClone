console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];

    // Extract .mp3 files safely
    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            let fileName = decodeURIComponent(element.href.substring(element.href.lastIndexOf("/") + 1));
            songs.push(fileName);
        }
    }

    // Update UI list
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (let song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`;
    }

    // Add click handlers
    Array.from(document.querySelectorAll(".songList li")).forEach(li => {
        li.addEventListener("click", () => {
            let track = li.querySelector(".info div").innerText.trim();
            playMusic(track);
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play().catch(err => console.warn("Playback blocked:", err));
        document.getElementById("play").src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums...");
    let req = await fetch(`/songs/`);
    let res = await req.text();
    let div = document.createElement("div");
    div.innerHTML = res;

    let anchors = Array.from(div.getElementsByTagName("a"));
    let cardContainer = document.querySelector(".cardContainer");

    for (let e of anchors) {
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];

            let json = await fetch(`/songs/${folder}/info.json`);
            let meta = await json.json();

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke="#141B34" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                </div>
            `;
        }
    }

    // Album click → load music
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            let folder = card.dataset.folder;
            let result = await getSongs(`songs/${folder}`);

            if (result.length > 0) {
                playMusic(result[0]);
            }
        });
    });
}

async function main() {
    let result = await getSongs("songs/ncs");

    if (result.length > 0) {
        playMusic(result[0], true);
    }

    await displayAlbums();

    let playBtn = document.getElementById("play");
    let nextBtn = document.getElementById("next");
    let prevBtn = document.getElementById("previous");

    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".songtime").innerHTML =
                `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

            document.querySelector(".circle").style.left =
                `${(currentSong.currentTime / currentSong.duration) * 100}%`;
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.clientWidth;
        currentSong.currentTime = currentSong.duration * percent;
        document.querySelector(".circle").style.left = `${percent * 100}%`;
    });

    document.querySelector(".hamburger").onclick = () => {
        document.querySelector(".left").style.left = "0";
    };

    document.querySelector(".close").onclick = () => {
        document.querySelector(".left").style.left = "-120%";
    };

    prevBtn.addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    nextBtn.addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    let volRange = document.querySelector(".range input");
    let volIcon = document.querySelector(".volume img");

    volRange.oninput = e => {
        currentSong.volume = e.target.value / 100;
        if (currentSong.volume === 0) {
            volIcon.src = volIcon.src.replace("volume.svg", "mute.svg");
        } else {
            volIcon.src = volIcon.src.replace("mute.svg", "volume.svg");
        }
    };

    volIcon.onclick = () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volRange.value = 0;
            volIcon.src = volIcon.src.replace("volume.svg", "mute.svg");
        } else {
            currentSong.volume = 0.1;
            volRange.value = 10;
            volIcon.src = volIcon.src.replace("mute.svg", "volume.svg");
        }
    };
}

main();
