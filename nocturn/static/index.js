let currentSong = null;

const playlistContexts = {
    home: null,
    search: null,
    playlists: {}
};

let alertTimeout = null;


let currentPlaylist = [];
let currentPlaylistId
let currentContext;

let currentIndex = -1;
let isPlaying = false;
let isShuffled = false;
let loopMode = 'none';
let searchTimeout = null;

const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');

const volumeBar = document.getElementById('volumeBar')
const volumeIcon = document.getElementById('volumeIcon');

document.addEventListener('DOMContentLoaded', () => {
    hideLoadingScreen();
    loadPlaylists();
    showHome();
    setupAudioPlayer();
    changeVolume();
});


function changeVolume() {
    audioPlayer.volume = volumeBar.value;

    const value = volumeBar.value;
    if (value == 0) {
        volumeIcon.innerHTML = '<path d="M13.86 5.47a.75.75 0 00-1.061 0l-1.47 1.47-1.47-1.47A.75.75 0 008.8 6.53L10.269 8l-1.47 1.47a.75.75 0 101.06 1.06l1.47-1.47 1.47 1.47a.75.75 0 001.06-1.06L12.39 8l1.47-1.47a.75.75 0 000-1.06z"/><path d="M10.116 1.5A.75.75 0 008.991.85l-6.925 4a3.642 3.642 0 00-1.33 4.967 3.639 3.639 0 001.33 1.332l6.925 4a.75.75 0 001.125-.649v-1.906a4.73 4.73 0 01-1.5-.694v1.3L2.817 9.852a2.141 2.141 0 01-.781-2.92c.187-.324.456-.594.78-.782l5.8-3.35v1.3c.45-.313.956-.55 1.5-.694V1.5z"/>';
    } else if (value < 0.5) {
        volumeIcon.innerHTML = '<path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z"/>';
    } else {
        volumeIcon.innerHTML = '<path d="M9.741.85a.75.75 0 01.375.65v13a.75.75 0 01-1.125.65l-6.925-4a3.642 3.642 0 01-1.33-4.967 3.639 3.639 0 011.33-1.332l6.925-4a.75.75 0 01.75 0zm-6.924 5.3a2.139 2.139 0 000 3.7l5.8 3.35V2.8l-5.8 3.35zm8.683 4.29V5.56a2.75 2.75 0 010 4.88z"/><path d="M11.5 13.614a5.752 5.752 0 000-11.228v1.55a4.252 4.252 0 010 8.127v1.55z"/>';
    }

    const max = volumeBar.max;
    const percent = (value / max) * 100;

    volumeBar.style.background = `
    linear-gradient(to right,
        var(--text-color) 0%,
        var(--text-color) ${percent}%,
        var(--bar-background-color) ${percent}%,
        var(--bar-background-color) 100%
    )
`;
}

function toggleMute() {
    if (volumeBar.value > 0) {
        volumeBar.value = 0;
    } else {
        volumeBar.value = 1;
    }
    changeVolume();
}


function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hide');
}

function setupAudioPlayer() {
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('loadedmetadata', () => {
        document.getElementById('duration').textContent = formatTime(audioPlayer.duration);
    });
}

function updateProgress() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progress;
        document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);

        const percent = (progressBar.value / progressBar.max) * 100;

        progressBar.style.background = `
        linear-gradient(to right,
            var(--text-color) 0%,
            var(--text-color) ${percent}%,
            var(--bar-background-color) ${percent}%,
            var(--bar-background-color) 100%
        )
    `;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

function seekTo() {
    const time = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;

    const val = progressBar.value;
    const max = progressBar.max;
    const percent = (val / max) * 100;

    progressBar.style.background = `
        linear-gradient(to right,
            var(--text-color) 0%,
            var(--text-color) ${percent}%,
            var(--bar-background-color) ${percent}%,
            var(--bar-background-color) 100%
        )
    `;
}

function showHome() {
    fetchSongs();

    const playlistBars = document.querySelectorAll('.playlists-bar');
    playlistBars.forEach(playlistBar => {
        playlistBar.setAttribute('data-isActive', 'false');
    })
}

function showReditBar(userId) {
    const editBar = document.getElementById('redit-user-bar');
    editBar.innerHTML = `
        <form class="modal-content" onsubmit="event.preventDefault(); reditUserProfile(${userId})">
            <h2>Profil Düzenle</h2>
            <input type="text" id="userNameInput" placeholder="Yeni kullanıcı adı">
            <input type="text" id="userFirstNameInput" placeholder="Yeni Ad">
            <input type="text" id="userLastNameInput" placeholder="Yeni Soyad">
            <input type="password" id="userPasswordInput" placeholder="Yeni Şifre" >
            <div class="modal-buttons">
                <button type="submit" onclick="reditUserProfile(${userId})">Onayla</button>
                <button type="submit" onclick="closeReditBar()">İptal</button>
            </div>
        </form>
    `
    editBar.style.display = 'flex';
}

function closeReditBar() {
    const editBar = document.getElementById('redit-user-bar');
    editBar.innerHTML = ''
    editBar.style.display = 'none';

}

function reditUserProfile() {
    const editBar = document.getElementById('redit-user-bar');
    const userName = document.getElementById('userNameInput').value.trim();
    const userFirstName = document.getElementById('userFirstNameInput').value.trim();
    const userLastName = document.getElementById('userLastNameInput').value.trim();
    const userPassword = document.getElementById('userPasswordInput').value.trim();

    fetch('/api/redituser/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: userName,
            firstName: userFirstName,
            lastName: userLastName,
            password: userPassword
        })
    }).then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert(data)
                showProfile();
            } else {
                showAlert(data)
            }
        })



    editBar.innerHTML = '';
    editBar.style.display = 'none'
}

function showProfile() {
    fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
            const user = data.user;
            const playlists = data.playlists
            const midBar = document.getElementById('mid-bar');
            midBar.innerHTML = `
            <div id="empty">
            </div>
            <div id="profile-top-bar">
                <div class="profile-info-bar">
                    <img class="profilePic" src="${user.profilePicPath}"></img>
                    <div class="user-infos">
                        <div class="userNameBar">@${user.userName}</div>
                        <div class="userFullNameBar">${user.firstName} ${user.lastName}</div>
                    </div>
                    <div class="profile-redit-btn" onclick="showReditBar(${user.userId})">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="25px" height="25px" viewBox="0 0 24 24" version="1.1">
                            <path d="M14.5858,4.41421 C15.3668,3.63316 16.6332,3.63316 17.4142,4.41421 L17.4142,4.41421 C18.1953,5.19526 18.1953,6.46159 17.4142,7.24264 L9.13096,15.5259 L6.10051,15.7279 L6.30254,12.6975 L14.5858,4.41421 Z" id="Path" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round"></path>
                        </svg>
                    </div>
                </div>
                
            </div>
            <div id="profile-bottom-bar">
            </div>
            `;

            const profileBottomBar = document.getElementById('profile-bottom-bar');
            playlists.forEach(playlist => {
                profileBottomBar.innerHTML += `
                <div class="playlist-item-profile" onclick="loadPlaylistSongs(${playlist.playlistId})">
                    <div class="playlist-item-child"> 
                         <div class="playlistBannerBar">
                            <img class="image-item" src="${playlist.playlistBanner}">
                         </div>
                         <div class="playlist-info">
                            <div>${playlist.playlistName}</div>
                            <div class="songCount">Şarkılar: ${playlist.songCount}</div>
                        </div>
                    </div>
                    <div class="playlist-item-btns">
                        <div class="renameBtn" onclick="event.stopPropagation(); showRenameBar(${playlist.playlistId})">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30px" height="30px" viewBox="0 0 24 24" version="1.1">
                                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                    <path d="M14.5858,4.41421 C15.3668,3.63316 16.6332,3.63316 17.4142,4.41421 L17.4142,4.41421 C18.1953,5.19526 18.1953,6.46159 17.4142,7.24264 L9.13096,15.5259 L6.10051,15.7279 L6.30254,12.6975 L14.5858,4.41421 Z" id="Path" stroke="var(--text-color)" stroke-width="2" stroke-linecap="round"></path>
                                </g>
                            </svg>
                        </div>
                        <div class="deletePlaylist" onclick="event.stopPropagation(); deletePlaylist( ${playlist.playlistId})">
                            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

            `;
            })
        });

}

function deletePlaylist(playlistId) {
    fetch(`/api/delete-playlist/${playlistId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert(data);
                if (currentPlaylistId === playlistId) {
                    currentPlaylist = playlistContexts.home;
                }
                delete playlistContexts.playlists[playlistId];
                loadPlaylists();
                showProfile();


            } else {
                showAlert(data)
            }
        })
}

function deleteAccount(userId) {
    fetch(`/api/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
    }).then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/login';
            } else {
                showAlert(data)
            }
        })
}
function showRenameBar(playlistId) {
    const body = document.getElementById('rename-playlist-bar');
    body.style.display = 'flex';
    body.classList.add('show')
    body.innerHTML += `
        <div class="rename-modal">
            <h2>Playlist ismini değiştir</h2>
            <input type="text" id="playlistRenameInput" placeholder="Yeni playlist ismi gir" onkeypress="if(event.key === 'Enter') reditPlaylist(${playlistId})">
            <div class="rename-modal-buttons">
                <div onclick="reditPlaylist(${playlistId})">Yeniden adlandır</div>
                <div onclick="closerenamePlaylist()">İptal</div>
            </div>
        </div>
    `
}

function closerenamePlaylist() {
    const body = document.getElementById('rename-playlist-bar');
    body.innerHTML = "";
    body.style.display = "none";
    body.classList.remove('show')
}

function reditPlaylist(playlistId) {
    const newName = document.getElementById('playlistRenameInput').value.trim();
    if (!newName) {
        return;
    }

    fetch(`/api/playlists/${playlistId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;' },
        body: JSON.stringify({
            playlistName: newName,
        })
    }
    ).then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert(data);
                closeRenameBar();
                loadPlaylists();
                showProfile();
            } else {
                showAlert(data);
            }
            
            
        })

}


function closeRenameBar(){
    const renameBar = document.getElementById('rename-playlist-bar');
    renameBar.innerHTML = "";
    renameBar.style.display = "none";
}


function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(res => res.json()).then(data => {
            if (data.success) {
                window.location.href = '/login';
            } else {
                showAlert(data);
            }
        });
}


function searchSongs() {
    const query = document.getElementById('searchInput').value;
    clearTimeout(searchTimeout);

    if (!query.trim()) {
        showHome();
        return;
    }


    searchTimeout = setTimeout(() => {
        fetch(`/api/songs?search=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(songs => {
                displaySearchResults(songs);
            })
    }, 50);
}


function displaySearchResults(songs) {
    const midContent = document.getElementById('midContent');

    playlistContexts.search = songs;

    if (songs.length === 0) {
        midContent.innerHTML = '<p style="color: #b3b3b3;">Hiç şarkı yok</p>';
        return;
    }

    let html = '<div class="category-section">';
    songs.forEach(song => {
        html += `
            <div class="song-list-item" onclick="playSong(${song.songId}, 'search')">
                <img src="${song.songBannerPath || '/static/default-cover.jpg'}" alt="${song.songName}">
                <div class="song-list-info">
                    <div class="song-list-title">${song.songName}</div>
                    <div class="song-list-artist">${song.singers || 'Unknown Artist'}</div>
                </div>
                <button type="button" class="control-btn" onclick="event.stopPropagation(); showAddToPlaylistMenu(${song.songId})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                </button>
            </div>
        `;
    });
    html += '</div>';

    midContent.innerHTML = html;
}

function fetchSongs() {
    fetch('/api/songs')
        .then(res => res.json())
        .then(songs => {
            fetch('/api/categories')
                .then(res => res.json())
                .then(categories => {
                    displaySongsByCategory(songs, categories);
                });
        })
}

function displaySongsByCategory(songs, categories) {
    const midBar = document.getElementById('mid-bar');
    midBar.innerHTML = `
                <div class="mid-top-bar">
                    <input type="text" id="searchInput" placeholder="Şarkı ya da artist ara..." oninput="searchSongs()">
                </div>
                <div id="midContent">
                </div>

    `
    playlistContexts.home = songs;
    currentPlaylistId = null;

    let html = '';

    categories.forEach(category => {
        const categorySongs = songs.filter(s => s.category === category);
        if (categorySongs.length > 0) {
            html += '<div class="category-section">';
            html += `<h2 class="category-title">${category}</h2>`;
            html += '<div class="song-grid">';
            categorySongs.slice(0, 6).forEach(song => {
                html += `
                    <div class="song-card">
                        <div onclick="playSong(${song.songId}, 'home')">
                            <img src="${song.songBannerPath || '/static/default-cover.jpg'}" alt="${song.songName}">
                            <div class="song-card-title">${song.songName}</div>
                            <div class="song-card-artist">${song.singers || 'Unknown Artist'}</div>
                        </div>
                        <button type="button" class="add-to-playlist-btn" onclick="event.stopPropagation(); showAddToPlaylistMenu(${song.songId})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                    </div>
                        `;
            });
            html += '</div></div>';
        }
    });
    midContent = document.getElementById('midContent');
    midContent.innerHTML += html;
}



function loadPlaylists() {
    fetch('/api/playlists')
        .then(res => res.json())
        .then(playlists => {
            displayPlaylists(playlists);
        })
}

function displayPlaylists(playlists) {
    const playlistList = document.getElementById('playlistList');
    playlistList.innerHTML = '';
    let html = ''
    playlists.forEach(playlist => {
        html += `
            <div class="playlists-bar" data-id="${playlist.playlistId}" data-isActive="false" onclick="loadPlaylistSongs('${playlist.playlistId}')">
                <img src="${playlist.playlistBanner || '/static/default-playlist.jpg'} " class="image-item">
                <div class="playlist-item">
                    <div>${playlist.playlistName}</div>
                </div>
            </div>
        `;
    });
    playlistList.innerHTML = html
}

function loadPlaylistSongs(playlistId) {
    fetch(`/api/playlists/${playlistId}/songs`)
        .then(res => res.json())
        .then(data => {
            const songs = data.songs;
            const playlistName = data.playlistName;



            displayPlaylistSongs(songs, playlistId, playlistName);

            document.querySelectorAll('.playlist-item').forEach(item => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                    item.parentElement.setAttribute('data-isActive', 'false');
                } 
                if (item.textContent.trim() === playlistName) {
                    item.classList.add('active');
                    item.parentElement.setAttribute('data-isActive', "true");
                }
            });
        })

}

function displayPlaylistSongs(songs, playlistId, playlistName) {
    const midBar = document.getElementById('mid-bar');

    playlistContexts.playlists[playlistId] = songs;
    currentPlaylistId = playlistId;
    midBar.innerHTML = `
                <div class="mid-top-bar">
                    <input type="text" id="searchInput" placeholder="Şarkı ya da artist ara..." oninput="searchSongs()">
                </div>
                <div id="midContent">
                    <div class="playlistTitle"> ${playlistName}<div>
                </div>

    `;

    const midContent = document.getElementById('midContent');




    if (songs.length === 0) {
        midContent.innerHTML += '<p style="color: #b3b3b3;">Bu playlist boş...</p>';
        return;
    }

    let html = '';
    songs.forEach(song => {
        html += `
            <div class="song-list-item" onclick="playSong(${song.songId}, ${playlistId})">
                <img src="${song.songBannerPath || '/static/default-cover.jpg'}" alt="${song.songName}">
                <div class="song-list-info">
                    <div class="song-list-title">${song.songName}</div>
                    <div class="song-list-artist">${song.singers || 'Unknown Artist'}</div>
                </div>
                <button class="control-btn" onclick="event.stopPropagation(); removeSongFromPlaylist(${playlistId}, ${song.songId})">×</button>
            </div>
        `;
    });

    midContent.innerHTML += html;
}


function showAlert(data, duration = 2000) {
    const alertBar = document.getElementById('alert-bar');

    if (alertTimeout) clearTimeout(alertTimeout);

    if (data.success) {
        alertBar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30px" height="30px" viewBox="0 0 512 512" version="1.1">
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="add-copy-2" fill="#0dac0dff" transform="translate(42.666667, 42.666667)">
                        <path d="M213.333333,3.55271368e-14 C95.51296,3.55271368e-14 3.55271368e-14,95.51296 3.55271368e-14,213.333333 C3.55271368e-14,331.153707 95.51296,426.666667 213.333333,426.666667 C331.153707,426.666667 426.666667,331.153707 426.666667,213.333333 C426.666667,95.51296 331.153707,3.55271368e-14 213.333333,3.55271368e-14 Z M293.669333,137.114453 L323.835947,167.281067 L192,299.66912 L112.916693,220.585813 L143.083307,190.4192 L192,239.335893 L293.669333,137.114453 Z" id="Shape">
                        </path>
                    </g>
                </g>
            </svg>
            <div id="alert-bar-message">
                ${data.success}
            </div>
            `;
    } else if (data.error) {
        alertBar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.5-5.009c0-.867.659-1.491 1.491-1.491.85 0 1.509.624 1.509 1.491 0 .867-.659 1.509-1.509 1.509-.832 0-1.491-.642-1.491-1.509zM11.172 6a.5.5 0 0 0-.499.522l.306 7a.5.5 0 0 0 .5.478h1.043a.5.5 0 0 0 .5-.478l.305-7a.5.5 0 0 0-.5-.522h-1.655z" fill="#770000ff"/></svg>
            <div id="alert-bar-message">
                ${data.error}
            </div>
            `;
    } else {
        alertBar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="30px" height="30px">
                <circle cx="50" cy="50" r="45" fill="var(--main-color)" opacity="0.15" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--main-color)" stroke-width="3" />
                <circle cx="50" cy="32" r="4" fill="var(--main-color)" />
                <rect x="46" y="42" width="8" height="28" rx="2" fill="var(--main-color)" />
            </svg>
            <div id="alert-bar-message">
                ${data}
            </div>
            `
    }

    alertBar.classList.add('show');
    alertTimeout = setTimeout(() => {
        alertBar.classList.remove('show');
        alertTimeout = null;
    }, duration)
}

function openPlaylistModal() {
    const modal = document.getElementById('addPlaylistModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    document.getElementById('playlistNameInput').value = '';
    document.getElementById('playlistNameInput').focus();
}

function closePlaylistModal() {
    const modal = document.getElementById('addPlaylistModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
}

function createPlaylist() {
    const name = document.getElementById('playlistNameInput').value.trim();

    if (!name) {
        showAlert('Lütfen bir playlist ismi girin');
        return;
    }

    fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistName: name })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert(data);
                closePlaylistModal();
                loadPlaylists();
                const profileBottomBar = document.getElementById('profile-bottom-bar');
                if (profileBottomBar) showProfile();
            } else {
                showAlert(data);
            }
        })

}

function removeSongFromPlaylist(playlistId, songId) {
    fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadPlaylistSongs(playlistId);
                showAlert(data);
            } else {
                showAlert(data);
            }
        })
}

function playSong(songId, context) {
    if (context && context !== currentContext) {
        currentContext = context;
        if (currentContext === 'home') {
            currentPlaylist = playlistContexts.home;
            document.querySelectorAll('.playlist-item').forEach(playlist => {
                playlist.classList.remove('active');
            })
        } else if (currentContext === 'search') {
            currentPlaylist = playlistContexts.search;
        } else {
            currentPlaylist = playlistContexts.playlists[context]
        }
    }
    else if (context === "search" && currentContext === "search"){
        currentPlaylist = playlistContexts.search;
    }

    if (!currentPlaylist) return;
    const song = currentPlaylist.find(s => s.songId === songId);
    if (!song) {
        return;
    }
    currentSong = song;

    currentIndex = currentPlaylist.findIndex(s => s.songId === songId);
    audioPlayer.src = song.songpath;
    audioPlayer.play();
    isPlaying = true;
    updatePlayPauseButton();
    updatePlayerUI();
}

function updatePlayerUI() {
    if (!currentSong) return;

    document.getElementById('playerImg').src = currentSong.songBannerPath || '/static/playlistbanners/default.jpg';
    document.getElementById('playerSongName').textContent = currentSong.songName;
    document.getElementById('playerArtist').textContent = currentSong.singers || 'Unknown Artist';
}




function togglePlayPause() {
    if (!currentSong) return;

    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
    updatePlayPauseButton();
}

function updatePlayPauseButton() {
    const svg = isPlaying
        ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>'
        : '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    playPauseBtn.innerHTML = svg;
}

function nextSong() {
    if (currentPlaylist.length === 0) return;

    if (isShuffled) {
        if(currentPlaylist.length === 1){
            nextIndex = currentIndex;
        } else {
            do {
            var nextIndex = Math.floor(Math.random() * currentPlaylist.length);
        } while (nextIndex === currentIndex);
        currentIndex = nextIndex;
        }
        
    } else if (loopMode === "one") {
        nextIndex = currentIndex
    } else {
        currentIndex = (currentIndex + 1) % currentPlaylist.length;
    }

    playSong(currentPlaylist[currentIndex].songId);
}

function previousSong() {
    if (currentPlaylist.length === 0) return;

    if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
        return;
    }

    currentIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playSong(currentPlaylist[currentIndex].songId);
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    document.getElementById('shuffleBtn').classList.toggle('active', isShuffled);
}

function toggleLoop() {
    const loopBtn = document.getElementById('loopBtn');

    if (loopMode === 'none') {
        audioPlayer.loop = true;
        loopMode = 'one'
        loopBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--main-color)">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path>
                <text x="12" y="15" font-size="10" font-weight="bold" text-anchor="middle" fill="var(--main-color)">1</text>
            </svg>
        `
    } else if (loopMode === 'one') {
        loopBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-color)">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path>
            </svg>
        `
        audioPlayer.loop = false;
        loopMode = 'none'
    }


}

function handleSongEnd() {
    if (loopMode === 'none') {
        nextSong();
    } else if (loopMode === 'one') {
        audioPlayer.play();
    }
}

function showAddToPlaylistMenu(songId) {
    fetch('/api/playlists')
        .then(res => res.json())
        .then(playlists => {
            if (playlists.length === 0) {
                showAlert('Henüz playlistin yok. Bir tane oluştur.');
                closeAddToPlaylistMenu();
                return;
            }

            let html = '<div class="playlist-menu-overlay" onclick="closeAddToPlaylistMenu()">';
            html += '<div class="playlist-menu" onclick="event.stopPropagation()">';
            html += '<h3>Playliste Ekle</h3>';
            html += '<div class="playlist-menu-list">';

            playlists.forEach(playlist => {
                html += `
                    <div class="playlist-menu-item" onclick="addToPlaylist(${playlist.playlistId}, ${songId})">
                        ${playlist.playlistName}
                    </div>
                `;
            });

            html += '</div>';
            html += '<button type="button" onclick="closeAddToPlaylistMenu()" class="playlist-menu-close">Cancel</button>';
            html += '</div></div>';

            document.body.insertAdjacentHTML('beforeend', html);
        })
}

function closeAddToPlaylistMenu() {
    const overlay = document.querySelector('.playlist-menu-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function addToPlaylist(playlistId, songId) {
    fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: songId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAddToPlaylistMenu();
                showAlert(data)
                playlistContexts.playlists[playlistId] += data.song;
                const activeBar = document.querySelector('.playlist-item.active')?.closest('playlists-bar');
                if (activeBar) {
                    if (playlistId == currentPlaylistId && playlistItem.getAttribute('data-isActive') === "true") {
                        activeBar.click();
                    }
                }

            } else {
                closeAddToPlaylistMenu();
                showAlert(data);
            }
        });

}


