'use strict';
console.log('Welcome to Akshathas Spotify');

/* =====================================================================
   1. SONG LIBRARY  — edit this list to match the files in songs/ & covers/
   ===================================================================== */
const SONGS = [
    { id: 's1',  title: 'Mortals',                      artist: 'Warriyo',                  album: 'NCS Release',   src: '1.mp3',  cover: 'covers/1.jpg' },
    { id: 's2',  title: 'Huma-Huma',                    artist: 'Cielo',                    album: 'Single',        src: '2.mp3',  cover: 'covers/2.jpg' },
    { id: 's3',  title: 'Invincible',                   artist: 'DEAF KEV',                 album: 'NCS Release',   src: '3.mp3',  cover: 'covers/3.jpg' },
    { id: 's4',  title: 'My Heart',                     artist: 'Different Heaven & EH!DE', album: 'NCS Release',   src: '4.mp3',  cover: 'covers/4.jpg' },
    { id: 's5',  title: 'Heroes Tonight (feat. Johnning)', artist: 'Janji',                 album: 'NCS Release',   src: '5.mp3',  cover: 'covers/5.jpg' },
    { id: 's6',  title: 'Rabba',                        artist: 'Salam-e-Ishq',             album: 'Salam-e-Ishq',  src: '6.mp3',  cover: 'covers/6.jpg' },
    { id: 's7',  title: 'Sakhiyaan',                    artist: 'Salam-e-Ishq',             album: 'Salam-e-Ishq',  src: '7.mp3',  cover: 'covers/7.jpg' },
    { id: 's8',  title: 'Bhula Dena',                   artist: 'Salam-e-Ishq',             album: 'Salam-e-Ishq',  src: '8.mp3',  cover: 'covers/8.jpg' },
    { id: 's9',  title: 'Tumhari Kasam',                artist: 'Salam-e-Ishq',             album: 'Salam-e-Ishq',  src: '9.mp3',  cover: 'covers/9.jpg' },
    { id: 's10', title: 'Na Jaana',                     artist: 'Salam-e-Ishq',             album: 'Salam-e-Ishq',  src: '10.mp3', cover: 'covers/10.jpg' },
    { id: 's11', title: 'swami',                        artist: 'Sunil',             album: 'Swami',  src: 'Music-by-S.mp4', cover: 'covers/10.jpg' },
];

const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#450af5"/><stop offset="1" stop-color="#1db954"/></linearGradient></defs>' +
    '<rect width="100" height="100" fill="url(#g)"/><path d="M40 28v34a9 9 0 1 0 6 8.5V40l20-5v19a9 9 0 1 0 6 8.5V24z" fill="#fff" opacity=".85"/></svg>');

/* =====================================================================
   2. HELPERS
   ===================================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const fmt = s => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60), x = Math.floor(s % 60);
    return `${m}:${String(x).padStart(2, '0')}`;
};
const fmtLong = s => {
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return h ? `${h} hr ${m} min` : `${m} min`;
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffleArr = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
const store = {
    get(k, d) { try { const v = localStorage.getItem('sc_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sc_' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const coverOf = s => (s && s.cover) || PLACEHOLDER;
const imgFallback = `onerror="this.onerror=null;this.src='${PLACEHOLDER}'"`;

/* =====================================================================
   3. STATE
   ===================================================================== */
const audio = new Audio();
audio.preload = 'metadata';

const library = new Map(SONGS.map(s => [s.id, { ...s, duration: null }]));
const localIds = [];

const state = {
    view: { type: 'home' },
    visibleIds: [],
    context: [],          // the list we started playing from
    order: [],            // play order (shuffled or not)
    pos: -1,              // position in order
    queue: [],            // songs added with "Add to queue" / "Play next"
    currentId: null,
    shuffle: store.get('shuffle', false),
    repeat: store.get('repeat', 'off'),   // off | all | one
    liked: new Set(store.get('liked', [])),
    playlists: store.get('playlists', []),
    volume: store.get('volume', 0.8),
    muted: false,
    query: '',
    seeking: false,
    errorStreak: 0,
    wantPlay: false,
};

/* =====================================================================
   4. DOM REFERENCES
   ===================================================================== */
const els = {
    trackList: $('#trackList'), empty: $('#emptyState'),
    eyebrow: $('#viewEyebrow'), title: $('#viewTitle'), subtitle: $('#viewSubtitle'), heroArt: $('#heroArt'),
    playAll: $('#playAllBtn'), shuffleAll: $('#shuffleAllBtn'), renamePl: $('#renamePlBtn'), deletePl: $('#deletePlBtn'),
    search: $('#searchInput'), greeting: $('#greeting'), main: $('#main'),
    playlistList: $('#playlistList'), newPl: $('#newPlaylistBtn'), fileInput: $('#fileInput'),
    npCover: $('#npCover'), npTitle: $('#npTitle'), npArtist: $('#npArtist'), upNext: $('#upNext'), viz: $('#visualizer'),
    pCover: $('#pCover'), name: $('#masterSongName'), artist: $('#masterArtist'), like: $('#likeBtn'), gif: $('#gif'),
    play: $('#masterPlay'), prev: $('#previous'), next: $('#next'), shuffle: $('#shuffleBtn'), repeat: $('#repeatBtn'),
    bar: $('#myProgressBar'), cur: $('#currentTime'), dur: $('#durationTime'),
    speed: $('#speedSelect'), sleep: $('#sleepBtn'), queueBtn: $('#queueBtn'), npBtn: $('#npBtn'),
    mute: $('#muteBtn'), vol: $('#volumeBar'),
    menu: $('#menu'), toast: $('#toast'), help: $('#helpDialog'), helpBtn: $('#helpBtn'),
    menuToggle: $('#menuToggle'), scrim: $('#scrim'),
};

/* =====================================================================
   5. TOAST
   ===================================================================== */
let toastTimer;
function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

/* =====================================================================
   6. VIEWS & RENDERING
   ===================================================================== */
const getPlaylist = id => state.playlists.find(p => p.id === id);
const savePlaylists = () => store.set('playlists', state.playlists);
const upcomingIds = () => [...state.queue, ...state.order.slice(state.pos + 1)];

function baseIds() {
    const v = state.view;
    switch (v.type) {
        case 'home':     return SONGS.map(s => s.id);
        case 'search':   return [...library.keys()];
        case 'liked':    return [...library.keys()].filter(id => state.liked.has(id));
        case 'local':    return [...localIds];
        case 'queue':    return upcomingIds();
        case 'playlist': { const p = getPlaylist(v.id); return p ? p.songIds.filter(id => library.has(id)) : []; }
        default:         return [];
    }
}

function viewSongs() {
    const q = state.query.trim().toLowerCase();
    const ids = baseIds();
    if (!q) return ids;
    return ids.filter(id => {
        const s = library.get(id);
        return `${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q);
    });
}

function viewMeta() {
    const v = state.view;
    const cur = library.get(state.currentId);
    switch (v.type) {
        case 'home':   return { eyebrow: 'Playlist', title: 'Best of NCS', art: coverOf(SONGS[0]) };
        case 'search': return { eyebrow: 'Search', title: state.query ? `“${state.query}”` : 'Browse all', art: null, icon: 'fa-magnifying-glass' };
        case 'liked':  return { eyebrow: 'Playlist', title: 'Liked Songs', cls: 'liked', icon: 'fa-heart' };
        case 'local':  return { eyebrow: 'From your device', title: 'Local files', cls: 'local', icon: 'fa-folder-open', note: 'Cleared when you refresh' };
        case 'queue':  return { eyebrow: 'Up next', title: 'Queue', cls: 'queue', icon: 'fa-list',
                                note: cur ? `Now playing: ${cur.title} • ${cur.artist}` : 'Nothing playing' };
        case 'playlist': {
            const p = getPlaylist(v.id);
            const first = p && library.get(p.songIds.find(id => library.has(id)));
            return { eyebrow: 'Playlist', title: p ? p.name : 'Playlist', art: first ? coverOf(first) : null, icon: 'fa-music' };
        }
    }
    return { eyebrow: '', title: '' };
}

function renderHero(ids) {
    const m = viewMeta();
    els.eyebrow.textContent = m.eyebrow;
    els.title.textContent = m.title;
    const total = ids.reduce((t, id) => t + (library.get(id)?.duration || 0), 0);
    const parts = [];
    if (m.note) parts.push(m.note);
    parts.push(`${ids.length} song${ids.length === 1 ? '' : 's'}`);
    if (total) parts.push(fmtLong(total));
    els.subtitle.textContent = parts.join(' • ');
    els.heroArt.className = 'hero-art' + (m.cls ? ' ' + m.cls : '');
    els.heroArt.innerHTML = m.art
        ? `<img src="${esc(m.art)}" alt="" ${imgFallback}>`
        : `<i class="fa-solid ${m.icon || 'fa-music'}"></i>`;
    const isPl = state.view.type === 'playlist';
    els.renamePl.hidden = els.deletePl.hidden = !isPl;
}

function trackRow(s, i) {
    const liked = state.liked.has(s.id);
    return `<li class="track${s.missing ? ' missing' : ''}" data-id="${s.id}" data-idx="${i}" draggable="true">
        <span class="t-num">
            <span class="n">${i + 1}</span>
            <span class="eq"><i></i><i></i><i></i></span>
            <span class="row-play"><i class="fa-solid fa-play"></i></span>
        </span>
        <span class="t-title">
            <img src="${esc(coverOf(s))}" alt="" loading="lazy" ${imgFallback}>
            <span class="t-text"><span class="t-name">${esc(s.title)}</span><span class="t-artist">${esc(s.artist)}</span></span>
        </span>
        <span class="t-album">${esc(s.album)}</span>
        <span class="t-actions">
            <button class="icon-btn like${liked ? ' on' : ''}" data-act="like" title="${liked ? 'Remove from' : 'Save to'} Liked Songs">
                <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i></button>
            <span class="t-dur">${s.duration ? fmt(s.duration) : '--:--'}</span>
            <button class="icon-btn more" data-act="more" title="More options"><i class="fa-solid fa-ellipsis"></i></button>
        </span>
    </li>`;
}

function renderView() {
    const ids = viewSongs();
    state.visibleIds = ids;
    renderHero(ids);
    els.trackList.innerHTML = ids.map((id, i) => trackRow(library.get(id), i)).join('');
    els.empty.hidden = ids.length > 0;
    els.empty.textContent = state.query ? `No results for “${state.query}”.`
        : state.view.type === 'liked' ? 'Songs you like will appear here. Tap the ♥ on any song.'
        : state.view.type === 'queue' ? 'Your queue is empty.'
        : state.view.type === 'playlist' ? 'This playlist is empty. Right-click a song or drag it onto the playlist to add it.'
        : 'Nothing here yet.';

    const t = state.view.type;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === t));
    $$('.pl-item').forEach(li => li.classList.toggle('active', li.dataset.key === viewKey(state.view)));
    els.queueBtn.classList.toggle('on', t === 'queue');
    markPlaying();
}

const viewKey = v => v.type === 'playlist' ? 'playlist:' + v.id : v.type;

function setView(view) {
    if (view.type !== 'search') { state.query = ''; els.search.value = ''; }
    state.view = view;
    document.body.classList.remove('sidebar-open');
    renderView();
    els.main.scrollTop = 0;
}

function markPlaying() {
    const playing = !audio.paused;
    $$('.track', els.trackList).forEach(li => {
        const on = li.dataset.id === state.currentId && state.view.type !== 'queue';
        li.classList.toggle('active', on);
        const icon = li.querySelector('.row-play i');
        if (icon) icon.className = `fa-solid fa-${on && playing ? 'pause' : 'play'}`;
    });
    const viewIsPlaying = playing && state.visibleIds.includes(state.currentId) && state.view.type !== 'queue';
    els.playAll.innerHTML = `<i class="fa-solid fa-${viewIsPlaying ? 'pause' : 'play'}"></i>`;
}

function updateDurationCells(id) {
    const s = library.get(id);
    $$(`.track[data-id="${id}"]`, els.trackList).forEach(li => {
        li.querySelector('.t-dur').textContent = s.duration ? fmt(s.duration) : '--:--';
        li.classList.toggle('missing', !!s.missing);
    });
    renderHero(state.visibleIds);
}

function renderPlaylists() {
    const items = [
        { key: 'liked', name: 'Liked Songs', sub: `Playlist • ${state.liked.size} songs`, art: '<i class="fa-solid fa-heart"></i>', cls: 'liked' },
        ...(localIds.length ? [{ key: 'local', name: 'Local files', sub: `${localIds.length} songs`, art: '<i class="fa-solid fa-folder-open"></i>', cls: 'local' }] : []),
        ...state.playlists.map(p => {
            const first = library.get(p.songIds.find(id => library.has(id)));
            return {
                key: 'playlist:' + p.id, name: p.name, sub: `Playlist • ${p.songIds.length} songs`,
                art: first ? `<img src="${esc(coverOf(first))}" alt="" ${imgFallback}>` : '<i class="fa-solid fa-music"></i>',
            };
        }),
    ];
    els.playlistList.innerHTML = items.map(it => `
        <li class="pl-item${it.key === viewKey(state.view) ? ' active' : ''}" data-key="${esc(it.key)}">
            <span class="pl-art ${it.cls || ''}">${it.art}</span>
            <span class="pl-text"><div class="pl-name">${esc(it.name)}</div><div class="pl-sub">${esc(it.sub)}</div></span>
        </li>`).join('');
}

function renderUpNext() {
    const ids = upcomingIds().slice(0, 8);
    els.upNext.innerHTML = ids.length
        ? ids.map((id, i) => {
            const s = library.get(id);
            return `<li data-idx="${i}"><img src="${esc(coverOf(s))}" alt="" ${imgFallback}>
                <span class="t-text"><span>${esc(s.title)}</span><span>${esc(s.artist)}</span></span></li>`;
        }).join('')
        : '<li class="empty">Nothing up next</li>';
}

function afterQueueChange() {
    renderUpNext();
    if (state.view.type === 'queue') renderView();
}

/* =====================================================================
   7. PLAYBACK
   ===================================================================== */
function buildOrder(ids, startId) {
    if (!state.shuffle) return [...ids];
    const rest = shuffleArr(ids.filter(x => x !== startId));
    return startId ? [startId, ...rest] : rest;
}

function playContext(ids, startId) {
    if (!ids.length) return;
    state.context = [...ids];
    if (startId == null) startId = state.shuffle ? ids[Math.floor(Math.random() * ids.length)] : ids[0];
    state.order = buildOrder(ids, startId);
    state.pos = state.order.indexOf(startId);
    loadSong(startId, true);
}

function loadSong(id, autoplay = true, startAt = 0) {
    const s = library.get(id);
    if (!s) return;
    state.currentId = id;
    state.wantPlay = autoplay;
    audio.src = s.src;
    if (startAt > 0) audio.addEventListener('loadedmetadata', () => { audio.currentTime = startAt; }, { once: true });
    els.bar.value = 0; setRangeFill(els.bar, 0);
    els.cur.textContent = fmt(startAt);
    updateNowPlaying(s);
    store.set('last', { id, t: startAt });
    if (autoplay) play();
    renderUpNext();
    if (state.view.type === 'queue') renderView(); else markPlaying();
}

async function play() {
    if (!state.currentId) {
        const ids = viewSongs().length ? viewSongs() : SONGS.map(s => s.id);
        playContext(ids);
        return;
    }
    state.wantPlay = true;
    setupAudioGraph();
    try {
        if (actx && actx.state === 'suspended') await actx.resume();
        await audio.play();
    } catch (e) {
        if (e.name !== 'AbortError') console.warn('Playback failed:', e);
    }
}

function pause() { state.wantPlay = false; audio.pause(); }
function togglePlay() { (!state.currentId || audio.paused) ? play() : pause(); }

function next(auto = false) {
    if (state.queue.length) { loadSong(state.queue.shift()); return; }
    if (!state.order.length) return;
    let p = state.pos + 1;
    if (p >= state.order.length) {
        if (state.repeat === 'all' || !auto) {
            if (state.shuffle) state.order = shuffleArr(state.order);
            p = 0;
        } else {                       // reached the end, repeat is off
            pause(); audio.currentTime = 0; return;
        }
    }
    state.pos = p;
    loadSong(state.order[p]);
}

function prev() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!state.order.length) return;
    let p = state.pos - 1;
    if (p < 0) p = state.repeat === 'all' ? state.order.length - 1 : 0;
    state.pos = p;
    loadSong(state.order[p]);
}

function jumpToUpcoming(idx) {
    if (idx < state.queue.length) {
        const [id] = state.queue.splice(idx, 1);
        loadSong(id);
    } else {
        state.pos = state.pos + 1 + (idx - state.queue.length);
        loadSong(state.order[state.pos]);
    }
}

function toggleShuffle() {
    state.shuffle = !state.shuffle;
    store.set('shuffle', state.shuffle);
    const cur = state.currentId;
    if (state.context.length) {
        if (state.context.includes(cur)) {
            state.order = state.shuffle ? [cur, ...shuffleArr(state.context.filter(x => x !== cur))] : [...state.context];
            state.pos = state.order.indexOf(cur);
        } else {
            state.order = state.shuffle ? shuffleArr(state.context) : [...state.context];
            state.pos = -1;
        }
    }
    updateModeButtons();
    afterQueueChange();
    toast(state.shuffle ? 'Shuffle on' : 'Shuffle off');
}

function cycleRepeat() {
    state.repeat = { off: 'all', all: 'one', one: 'off' }[state.repeat];
    store.set('repeat', state.repeat);
    updateModeButtons();
    toast({ off: 'Repeat off', all: 'Repeat all', one: 'Repeat one' }[state.repeat]);
}

function updateModeButtons() {
    els.shuffle.classList.toggle('on', state.shuffle);
    els.repeat.classList.toggle('on', state.repeat !== 'off');
    els.repeat.classList.toggle('one-mode', state.repeat === 'one');
}

function updatePlayState() {
    const playing = !audio.paused;
    document.body.classList.toggle('is-playing', playing);
    els.play.innerHTML = `<i class="fa-solid fa-${playing ? 'pause' : 'play'}"></i>`;
    els.gif.style.opacity = playing ? 1 : 0;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    markPlaying();
}

function updateNowPlaying(s) {
    const cover = coverOf(s);
    [els.pCover, els.npCover].forEach(img => { img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; }; img.src = cover; });
    els.name.textContent = s.title;
    els.artist.textContent = s.artist;
    els.npTitle.textContent = s.title;
    els.npArtist.textContent = s.artist;
    document.title = `${s.title} • ${s.artist}`;
    updateLikeBtn();
    extractColor(cover);
    if ('mediaSession' in navigator) {
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: s.title, artist: s.artist, album: s.album,
                artwork: s.cover ? [{ src: new URL(s.cover, location.href).href, sizes: '512x512' }] : [],
            });
        } catch { /* not supported */ }
    }
}

/* Dynamic hero colour sampled from the cover */
function extractColor(src) {
    const img = new Image();
    img.onload = () => {
        try {
            const c = document.createElement('canvas');
            c.width = c.height = 16;
            const x = c.getContext('2d');
            x.drawImage(img, 0, 0, 16, 16);
            const d = x.getImageData(0, 0, 16, 16).data;
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
            const n = d.length / 4;
            document.documentElement.style.setProperty('--dyn', `rgb(${r / n | 0}, ${g / n | 0}, ${b / n | 0})`);
        } catch { /* canvas tainted when opened via file:// — keep default */ }
    };
    img.src = src;
}

/* =====================================================================
   8. AUDIO EVENTS, SEEK BAR, VOLUME
   ===================================================================== */
const setRangeFill = (el, pct) => el.style.setProperty('--p', pct + '%');
let lastSave = 0;

audio.addEventListener('play', updatePlayState);
audio.addEventListener('pause', updatePlayState);
audio.addEventListener('playing', () => { state.errorStreak = 0; });
audio.addEventListener('loadedmetadata', () => {
    els.dur.textContent = fmt(audio.duration);
    const s = library.get(state.currentId);
    if (s && !s.duration) { s.duration = audio.duration; updateDurationCells(s.id); }
});
audio.addEventListener('timeupdate', () => {
    const d = audio.duration;
    if (!state.seeking && isFinite(d) && d > 0) {
        els.bar.value = (audio.currentTime / d) * 1000;
        setRangeFill(els.bar, (audio.currentTime / d) * 100);
        els.cur.textContent = fmt(audio.currentTime);
    }
    const now = Date.now();
    if (now - lastSave > 4000) {
        lastSave = now;
        store.set('last', { id: state.currentId, t: audio.currentTime });
        if ('mediaSession' in navigator && isFinite(d)) {
            try { navigator.mediaSession.setPositionState({ duration: d, playbackRate: audio.playbackRate, position: Math.min(audio.currentTime, d) }); } catch { }
        }
    }
});
audio.addEventListener('ended', () => {
    if (sleepAtEnd) { resetSleep(); toast('Sleep timer: goodnight 🌙'); updatePlayState(); return; }
    if (state.repeat === 'one') { audio.currentTime = 0; play(); return; }
    next(true);
});
audio.addEventListener('error', () => {
    if (!audio.getAttribute('src')) return;
    const s = library.get(state.currentId);
    if (s) { s.missing = true; updateDurationCells(s.id); toast(`Couldn't load “${s.title}” (${s.src})`); }
    state.errorStreak++;
    if (state.wantPlay && state.errorStreak < 5) setTimeout(() => next(true), 600);
});

els.bar.addEventListener('input', () => {
    state.seeking = true;
    setRangeFill(els.bar, els.bar.value / 10);
    if (isFinite(audio.duration)) els.cur.textContent = fmt(els.bar.value / 1000 * audio.duration);
});
els.bar.addEventListener('change', () => {
    if (isFinite(audio.duration)) audio.currentTime = els.bar.value / 1000 * audio.duration;
    state.seeking = false;
});

function applyVolume() {
    audio.volume = state.volume;
    audio.muted = state.muted;
    const v = state.muted ? 0 : state.volume;
    els.vol.value = Math.round(v * 100);
    setRangeFill(els.vol, v * 100);
    els.mute.innerHTML = `<i class="fa-solid fa-volume-${v === 0 ? 'xmark' : v < .5 ? 'low' : 'high'}"></i>`;
}
function setVolume(v) {
    state.volume = Math.min(1, Math.max(0, v));
    state.muted = false;
    store.set('volume', state.volume);
    applyVolume();
}
els.vol.addEventListener('input', () => setVolume(els.vol.value / 100));
els.mute.addEventListener('click', () => {
    if (state.volume === 0) { setVolume(.5); return; }
    state.muted = !state.muted; applyVolume();
});
els.speed.addEventListener('change', () => {
    audio.playbackRate = +els.speed.value;
    toast(`Speed ${els.speed.value}×`);
});

/* =====================================================================
   9. SLEEP TIMER
   ===================================================================== */
const SLEEP_OPTS = [0, 5, 15, 30, 60, 'end'];
let sleepIdx = 0, sleepTimeout = null, sleepAtEnd = false;

function resetSleep() {
    clearTimeout(sleepTimeout); sleepIdx = 0; sleepAtEnd = false;
    els.sleep.classList.remove('on'); els.sleep.querySelector('.badge').textContent = '';
}
function fadeOutAndPause() {
    const start = audio.volume, steps = 30;
    let i = 0;
    const t = setInterval(() => {
        i++;
        audio.volume = Math.max(0, start * (1 - i / steps));
        if (i >= steps) { clearInterval(t); pause(); audio.volume = state.volume; toast('Sleep timer: goodnight 🌙'); }
    }, 100);
}
els.sleep.addEventListener('click', () => {
    sleepIdx = (sleepIdx + 1) % SLEEP_OPTS.length;
    clearTimeout(sleepTimeout); sleepAtEnd = false;
    const o = SLEEP_OPTS[sleepIdx];
    if (o === 'end') { sleepAtEnd = true; toast('Sleep timer: end of this song'); }
    else if (o) { sleepTimeout = setTimeout(() => { fadeOutAndPause(); resetSleep(); }, o * 60000); toast(`Sleep timer: ${o} minutes`); }
    else toast('Sleep timer off');
    els.sleep.classList.toggle('on', !!o);
    els.sleep.querySelector('.badge').textContent = o === 'end' ? 'END' : o ? o + 'm' : '';
});

/* =====================================================================
   10. REAL-TIME VISUALIZER (Web Audio API)
   ===================================================================== */
let actx = null, analyser = null, freq = null;

function setupAudioGraph() {
    // Browsers silence audio routed through Web Audio when the page is opened via file://
    if (actx || location.protocol === 'file:') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
        actx = new AC();
        const srcNode = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = .82;
        srcNode.connect(analyser);
        analyser.connect(actx.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
        document.body.classList.add('has-viz');
        requestAnimationFrame(drawViz);
    } catch (e) { console.warn('Visualizer unavailable:', e); }
}

function drawViz() {
    requestAnimationFrame(drawViz);
    const c = els.viz;
    if (!analyser || !c.offsetWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const W = c.offsetWidth * dpr, H = c.offsetHeight * dpr;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    analyser.getByteFrequencyData(freq);
    const bars = 32, gap = 2 * dpr, bw = W / bars;
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, 'rgba(29,185,84,.95)');
    grad.addColorStop(1, 'rgba(30,215,96,.25)');
    ctx.fillStyle = grad;
    for (let i = 0; i < bars; i++) {
        const v = freq[Math.floor(i * (freq.length * .8) / bars)] / 255;
        const h = Math.max(2 * dpr, v * H * .95);
        ctx.fillRect(i * bw + gap / 2, H - h, bw - gap, h);
    }
}

/* =====================================================================
   11. LIKES, PLAYLISTS, QUEUE, LOCAL FILES
   ===================================================================== */
function toggleLike(id = state.currentId) {
    if (!id) return;
    const s = library.get(id);
    if (state.liked.has(id)) { state.liked.delete(id); toast('Removed from Liked Songs'); }
    else { state.liked.add(id); toast(`Added “${s.title}” to Liked Songs`); }
    store.set('liked', [...state.liked]);
    updateLikeBtn();
    renderPlaylists();
    if (state.view.type === 'liked') renderView();
    else $$(`.track[data-id="${id}"] .like`, els.trackList).forEach(b => {
        const on = state.liked.has(id);
        b.classList.toggle('on', on);
        b.innerHTML = `<i class="fa-${on ? 'solid' : 'regular'} fa-heart"></i>`;
    });
}
function updateLikeBtn() {
    const on = state.liked.has(state.currentId);
    els.like.classList.toggle('on', on);
    els.like.innerHTML = `<i class="fa-${on ? 'solid' : 'regular'} fa-heart"></i>`;
}

function createPlaylist() {
    const name = prompt('Playlist name', `My Playlist #${state.playlists.length + 1}`);
    if (!name || !name.trim()) return null;
    const p = { id: 'p' + Date.now().toString(36), name: name.trim(), songIds: [] };
    state.playlists.push(p);
    savePlaylists(); renderPlaylists();
    toast(`Created “${p.name}”`);
    return p;
}
function addToPlaylist(pid, sid) {
    const p = getPlaylist(pid);
    if (!p) return;
    if (p.songIds.includes(sid)) { toast(`Already in “${p.name}”`); return; }
    if (library.get(sid)?.local) { toast('Local files can’t be saved to playlists (they vanish on refresh)'); return; }
    p.songIds.push(sid);
    savePlaylists(); renderPlaylists();
    if (state.view.type === 'playlist' && state.view.id === pid) renderView();
    toast(`Added to “${p.name}”`);
}

function addFiles(fileList) {
    const files = [...fileList].filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test(f.name));
    if (!files.length) { toast('No audio files found'); return; }
    files.forEach(f => {
        const base = f.name.replace(/\.[^.]+$/, '');
        const cut = base.indexOf(' - ');
        const artist = cut > 0 ? base.slice(0, cut) : 'Unknown artist';
        const title = cut > 0 ? base.slice(cut + 3) : base;
        const id = 'u' + Math.random().toString(36).slice(2, 9);
        library.set(id, { id, title, artist, album: 'Local file', src: URL.createObjectURL(f), cover: null, duration: null, local: true });
        localIds.push(id);
    });
    loadDurations();
    renderPlaylists();
    setView({ type: 'local' });
    toast(`Added ${files.length} song${files.length > 1 ? 's' : ''}`);
}

function loadDurations() {
    library.forEach(song => {
        if (song.duration || song._probing) return;
        song._probing = true;
        const a = new Audio();
        a.preload = 'metadata';
        a.addEventListener('loadedmetadata', () => {
            song.duration = a.duration; song._probing = false;
            updateDurationCells(song.id);
            a.removeAttribute('src'); a.load();
        }, { once: true });
        a.addEventListener('error', () => {
            if (song.duration || !a.getAttribute('src')) return;
            song.missing = true; song._probing = false;
            updateDurationCells(song.id);
        }, { once: true });
        a.src = song.src;
    });
}

/* ---------- Context menu ---------- */
function openMenu(id, idx, x, y) {
    const s = library.get(id);
    const liked = state.liked.has(id);
    const v = state.view;
    let html = `
        <div class="label">${esc(s.title)}</div>
        <button data-m="play"><i class="fa-solid fa-play"></i>Play now</button>
        <button data-m="next"><i class="fa-solid fa-forward"></i>Play next</button>
        <button data-m="queue"><i class="fa-solid fa-list"></i>Add to queue</button>
        <button data-m="like"><i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>${liked ? 'Remove from' : 'Save to'} Liked Songs</button>`;
    if (v.type === 'queue' && idx < state.queue.length) html += `<button data-m="rmq"><i class="fa-solid fa-xmark"></i>Remove from queue</button>`;
    if (v.type === 'playlist') html += `<button data-m="rmpl"><i class="fa-solid fa-xmark"></i>Remove from this playlist</button>`;
    html += `<hr><div class="label">Add to playlist</div>`;
    html += state.playlists.map(p => `<button data-m="addpl:${p.id}"><i class="fa-solid fa-music"></i>${esc(p.name)}</button>`).join('');
    html += `<button data-m="newpl"><i class="fa-solid fa-plus"></i>New playlist…</button>`;
    els.menu.innerHTML = html;
    els.menu.dataset.id = id;
    els.menu.dataset.idx = idx;
    els.menu.hidden = false;
    const r = els.menu.getBoundingClientRect();
    els.menu.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
    els.menu.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
}
const closeMenu = () => { els.menu.hidden = true; };

els.menu.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    const id = els.menu.dataset.id, idx = +els.menu.dataset.idx;
    const [act, arg] = b.dataset.m.split(':');
    closeMenu();
    switch (act) {
        case 'play':  playFromRow(id, idx, true); break;
        case 'next':  state.queue.unshift(id); toast('Will play next'); afterQueueChange(); break;
        case 'queue': state.queue.push(id); toast('Added to queue'); afterQueueChange(); break;
        case 'like':  toggleLike(id); break;
        case 'addpl': addToPlaylist(arg, id); break;
        case 'newpl': { const p = createPlaylist(); if (p) addToPlaylist(p.id, id); break; }
        case 'rmq':   state.queue.splice(idx, 1); toast('Removed from queue'); afterQueueChange(); break;
        case 'rmpl': {
            const p = getPlaylist(state.view.id);
            const i = p ? p.songIds.indexOf(id) : -1;
            if (i > -1) { p.songIds.splice(i, 1); savePlaylists(); renderPlaylists(); renderView(); toast(`Removed from “${p.name}”`); }
            break;
        }
    }
});
document.addEventListener('click', e => { if (!els.menu.hidden && !els.menu.contains(e.target)) closeMenu(); });
els.main.addEventListener('scroll', closeMenu, { passive: true });
window.addEventListener('resize', closeMenu);

/* =====================================================================
   12. UI EVENTS
   ===================================================================== */
function playFromRow(id, idx, force = false) {
    if (state.view.type === 'queue') { jumpToUpcoming(idx); return; }
    if (!force && id === state.currentId) { togglePlay(); return; }
    playContext(state.visibleIds, id);
}

els.trackList.addEventListener('click', e => {
    const li = e.target.closest('.track');
    if (!li) return;
    const id = li.dataset.id, idx = +li.dataset.idx;
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'like') { toggleLike(id); return; }
    if (act === 'more') {
        e.stopPropagation();
        const r = e.target.closest('button').getBoundingClientRect();
        openMenu(id, idx, r.right - 230, r.bottom + 4);
        return;
    }
    playFromRow(id, idx);
});
els.trackList.addEventListener('contextmenu', e => {
    const li = e.target.closest('.track');
    if (!li) return;
    e.preventDefault();
    openMenu(li.dataset.id, +li.dataset.idx, e.clientX, e.clientY);
});

/* Drag a song onto a playlist in the sidebar */
els.trackList.addEventListener('dragstart', e => {
    const li = e.target.closest('.track');
    if (!li) return;
    e.dataTransfer.setData('text/song-id', li.dataset.id);
    e.dataTransfer.effectAllowed = 'copy';
    li.classList.add('dragging');
});
els.trackList.addEventListener('dragend', e => e.target.closest('.track')?.classList.remove('dragging'));
els.playlistList.addEventListener('dragover', e => {
    const li = e.target.closest('.pl-item');
    if (!li || !e.dataTransfer.types.includes('text/song-id')) return;
    if (!(li.dataset.key.startsWith('playlist:') || li.dataset.key === 'liked')) return;
    e.preventDefault();
    $$('.pl-item.drop').forEach(x => x !== li && x.classList.remove('drop'));
    li.classList.add('drop');
});
els.playlistList.addEventListener('dragleave', e => e.target.closest('.pl-item')?.classList.remove('drop'));
els.playlistList.addEventListener('drop', e => {
    const li = e.target.closest('.pl-item');
    const sid = e.dataTransfer.getData('text/song-id');
    $$('.pl-item.drop').forEach(x => x.classList.remove('drop'));
    if (!li || !sid) return;
    e.preventDefault();
    e.stopPropagation();
    if (li.dataset.key === 'liked') { if (!state.liked.has(sid)) toggleLike(sid); }
    else addToPlaylist(li.dataset.key.split(':')[1], sid);
});

els.playlistList.addEventListener('click', e => {
    const li = e.target.closest('.pl-item');
    if (!li) return;
    const [type, id] = li.dataset.key.split(':');
    setView(id ? { type, id } : { type });
});
$$('[data-view]').forEach(b => b.addEventListener('click', () => {
    setView({ type: b.dataset.view });
    if (b.dataset.view === 'search') els.search.focus();
}));
els.queueBtn.addEventListener('click', () => setView({ type: state.view.type === 'queue' ? 'home' : 'queue' }));
els.npBtn.addEventListener('click', () => {
    document.body.classList.toggle('hide-np');
    els.npBtn.classList.toggle('on', !document.body.classList.contains('hide-np'));
});
els.upNext.addEventListener('click', e => {
    const li = e.target.closest('li[data-idx]');
    if (li) jumpToUpcoming(+li.dataset.idx);
});

els.search.addEventListener('input', () => {
    state.query = els.search.value;
    if (state.view.type === 'home') state.view = { type: 'search' };
    renderView();
});

els.playAll.addEventListener('click', () => {
    if (state.view.type === 'queue') { togglePlay(); return; }
    if (state.visibleIds.includes(state.currentId) && state.context.join() === state.visibleIds.join()) togglePlay();
    else playContext(state.visibleIds);
});
els.shuffleAll.addEventListener('click', () => {
    if (!state.shuffle) toggleShuffle();
    playContext(state.visibleIds);
});
els.renamePl.addEventListener('click', () => {
    const p = getPlaylist(state.view.id);
    const name = p && prompt('Rename playlist', p.name);
    if (name && name.trim()) { p.name = name.trim(); savePlaylists(); renderPlaylists(); renderView(); }
});
els.deletePl.addEventListener('click', () => {
    const p = getPlaylist(state.view.id);
    if (!p || !confirm(`Delete “${p.name}”?`)) return;
    state.playlists = state.playlists.filter(x => x !== p);
    savePlaylists(); renderPlaylists(); setView({ type: 'home' });
    toast('Playlist deleted');
});
els.newPl.addEventListener('click', () => { const p = createPlaylist(); if (p) setView({ type: 'playlist', id: p.id }); });
els.fileInput.addEventListener('change', () => { addFiles(els.fileInput.files); els.fileInput.value = ''; });

els.play.addEventListener('click', togglePlay);
els.next.addEventListener('click', () => next());
els.prev.addEventListener('click', prev);
els.shuffle.addEventListener('click', toggleShuffle);
els.repeat.addEventListener('click', cycleRepeat);
els.like.addEventListener('click', () => toggleLike());
els.helpBtn.addEventListener('click', () => els.help.showModal());
els.menuToggle.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
els.scrim.addEventListener('click', () => document.body.classList.remove('sidebar-open'));

/* Drag & drop audio files anywhere */
let dragDepth = 0;
const hasFiles = e => e.dataTransfer && e.dataTransfer.types.includes('Files');
window.addEventListener('dragenter', e => { if (hasFiles(e)) { dragDepth++; document.body.classList.add('dragging-files'); } });
window.addEventListener('dragleave', e => { if (hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('dragging-files'); } });
window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    document.body.classList.remove('dragging-files');
    addFiles(e.dataTransfer.files);
});

/* Keyboard shortcuts */
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches('input[type=search], input[type=text], textarea, select')) {
        if (e.key === 'Escape') e.target.blur();
        return;
    }
    if (els.help.open) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const actions = {
        ' ': togglePlay,
        ArrowRight: () => { if (isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); },
        ArrowLeft:  () => { audio.currentTime = Math.max(0, audio.currentTime - 5); },
        ArrowUp:    () => { setVolume(state.volume + .05); toast(`Volume ${Math.round(state.volume * 100)}%`); },
        ArrowDown:  () => { setVolume(state.volume - .05); toast(`Volume ${Math.round(state.volume * 100)}%`); },
        n: () => next(), p: prev, s: toggleShuffle, r: cycleRepeat, l: () => toggleLike(),
        m: () => els.mute.click(), q: () => els.queueBtn.click(),
        '/': () => els.search.focus(), '?': () => els.help.showModal(),
        Escape: () => { closeMenu(); document.body.classList.remove('sidebar-open'); },
    };
    if (actions[k]) { e.preventDefault(); actions[k](); }
});

/* Lock-screen / notification / headphone controls */
function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers = {
        play, pause, previoustrack: prev, nexttrack: () => next(),
        seekbackward: d => { audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset || 10)); },
        seekforward:  d => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (d.seekOffset || 10)); },
        seekto: d => { audio.currentTime = d.seekTime; },
    };
    Object.entries(handlers).forEach(([a, fn]) => { try { ms.setActionHandler(a, fn); } catch { /* unsupported action */ } });
}

/* =====================================================================
   13. INIT
   ===================================================================== */
function setGreeting() {
    const h = new Date().getHours();
    els.greeting.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function init() {
    // drop playlist entries that no longer exist in the library
    state.playlists.forEach(p => { p.songIds = p.songIds.filter(id => library.has(id)); });
    setGreeting();
    applyVolume();
    updateModeButtons();
    els.npBtn.classList.add('on');
    renderPlaylists();
    renderView();
    loadDurations();
    setupMediaSession();

    // Restore the last song & position (without autoplay — browsers block it)
    const ids = SONGS.map(s => s.id);
    const last = store.get('last', null);
    const startId = last && library.has(last.id) ? last.id : ids[0];
    state.context = ids;
    state.order = buildOrder(ids, startId);
    state.pos = state.order.indexOf(startId);
    loadSong(startId, false, last && last.id === startId ? last.t || 0 : 0);
    updatePlayState();
}

init();
