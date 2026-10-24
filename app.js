'use strict';
const grid = document.querySelector('#repos');
const statusLine = document.querySelector('#status');
const search = document.querySelector('#search');
const sort = document.querySelector('#sort');
let repositories = [];
const languageColors = { JavaScript: '#FFA411', TypeScript: '#789be8', Python: '#84E543', HTML: '#e77c61', CSS: '#b57be0', Shell: '#84E543', Rust: '#d6aa8a', 'C#': '#a585df' };
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function render() {
  const query = search.value.trim().toLowerCase();
  const visible = repositories.filter(repo => `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase().includes(query));
  visible.sort(sort.value === 'stars' ? (a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0) || a.name.localeCompare(b.name) : sort.value === 'name' ? (a, b) => a.name.localeCompare(b.name) : (a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  grid.replaceChildren();
  document.querySelector('#count').textContent = `${visible.length} / ${repositories.length} repositories`;
  visible.forEach((repo, index) => {
    const card = element('a', 'repo-card');
    // Construct the destination from the name; never trust a URL from cached data.
    card.href = `https://github.com/Qwiso/${encodeURIComponent(repo.name)}`;
    const top = element('div', 'card-top');
    top.append(element('span', 'repo-icon', '⌘'), element('span', 'card-number', `REPO / ${String(index + 1).padStart(2, '0')}`));
    const heading = element('h3', '', repo.name);
    if (repo.archived) heading.append(element('span', 'archive', 'ARCHIVED'));
    const meta = element('div', 'card-meta');
    const language = element('span', 'language');
    const dot = element('span', 'dot');
    dot.style.backgroundColor = languageColors[repo.language] || '#9542CD';
    language.append(dot, document.createTextNode(repo.language || 'Repository'));
    const stars = element('span', '', `☆ ${repo.stargazers_count || 0}`);
    stars.setAttribute('aria-label', `${repo.stargazers_count || 0} stars`);
    const forks = element('span', '', `⑂ ${repo.forks_count || 0}`);
    forks.setAttribute('aria-label', `${repo.forks_count || 0} forks`);
    const arrow = element('span', 'card-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    meta.append(language, stars, forks, arrow);
    card.append(top, heading, element('p', '', repo.description || (repo.fork ? 'An open-source project, forked and ready to explore.' : 'An idea taking shape. Explore the code on GitHub.')), meta);
    grid.append(card);
  });
  if (!visible.length) grid.append(element('p', 'empty', query ? 'No repositories match your search. Try another name or language.' : 'No public repositories to display yet.'));
}
function validRepos(data) {
  if (!Array.isArray(data) || data.some(repo => !repo || typeof repo.name !== 'string')) throw new Error('Invalid repository response');
  return data.filter(repo => !repo.private);
}
async function getJSON(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
async function load() {
  try {
    repositories = validRepos(await getJSON('repos.json'));
    render();
    statusLine.textContent = 'Saved repository snapshot · checking for updates…';
  } catch { /* The live API can still populate the page if the snapshot is unavailable. */ }
  try {
    const live = [];
    for (let page = 1; ; page++) {
      const batch = validRepos(await getJSON(`https://api.github.com/users/Qwiso/repos?per_page=100&sort=updated&page=${page}`));
      live.push(...batch);
      if (batch.length < 100) break;
    }
    repositories = live;
    render();
    statusLine.textContent = 'Up to date with GitHub · public code, open possibilities.';
  } catch {
    statusLine.textContent = repositories.length ? 'Showing a saved snapshot · live GitHub updates are temporarily unavailable.' : 'GitHub is temporarily unavailable. Visit the profile link below to explore the repositories.';
    if (!repositories.length) render();
  }
}
search.addEventListener('input', render);
sort.addEventListener('change', render);
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let pending = false;
  addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--drift', `${Math.min(scrollY, 850)}px`);
      pending = false;
    });
  }, { passive: true });
}
load();

// Separate timings keep the sky from pulsing as a single layer.
const starField = document.querySelector('.stars');
for (let index = 0; index < 65; index++) {
  const star = document.createElement('i');
  const random = value => {
    const seed = Math.sin(value * 127.1) * 43758.5453;
    return seed - Math.floor(seed);
  };
  star.className = 'twinkle-star';
  star.style.left = `${random(index + 1) * 100}%`;
  star.style.top = `${random(index + 101) * 57}%`;
  star.style.setProperty('--duration', `${2.4 + random(index + 201) * 4.5}s`);
  star.style.setProperty('--delay', `${-random(index + 301) * 9}s`);
  star.style.setProperty('--size', `${index % 11 === 0 ? 2.5 : 1 + random(index + 401)}px`);
  if (index % 11 === 0) star.classList.add('bright-star');
  starField.append(star);
}

// Perspective wave field: slow swells carry finer ripples and broken moonlight.
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'living-ocean';
  document.querySelector('.scene').append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, frame = 0;
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function draw(milliseconds) {
    const time = motion.matches ? 0 : milliseconds / 1000;
    ctx.clearRect(0, 0, width, height);
    const horizon = height * .595;
    const seaHeight = height - horizon;
    const glow = ctx.createRadialGradient(width * .775, horizon, 0, width * .775, horizon + seaHeight * .3, seaHeight * 1.25);
    glow.addColorStop(0, '#c7a4f230'); glow.addColorStop(.4, '#9542cd0b'); glow.addColorStop(1, '#12101300');
    ctx.fillStyle = glow; ctx.fillRect(0, horizon - 5, width, seaHeight + 5);
    for (let row = 0; row < 64; row++) {
      const depth = row / 63;
      const y = horizon + Math.pow(depth, 1.85) * seaHeight;
      const amplitude = .5 + depth * depth * 13;
      const wavelength = 35 + depth * 170;
      const speed = .45 + depth * .65;
      ctx.beginPath();
      for (let x = -12; x <= width + 12; x += 8) {
        const wave = Math.sin(x / wavelength + time * speed + row * .78) * amplitude
          + Math.sin(x / (wavelength * .43) - time * .65 + row * 1.7) * amplitude * .3;
        if (x === -12) ctx.moveTo(x, y + wave); else ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = `rgba(164,119,205,${.06 + Math.sin(row * 2.4 + time * .7) ** 2 * .16})`;
      ctx.lineWidth = .6 + depth * .9;
      ctx.stroke();
      // A widening, fragmented reflection beneath the moon.
      const center = width * .775 + Math.sin(time * .6 + row * .7) * (5 + depth * 24);
      const spread = 10 + depth * width * .14;
      for (let glint = 0; glint < 5; glint++) {
        const seed = Math.sin(row * 127.1 + glint * 311.7) * 43758.5453;
        const random = seed - Math.floor(seed);
        const x = center + (random - .5) * spread * 2;
        const shimmer = Math.max(0, Math.sin(time * 1.6 + row * 1.3 + glint * 2));
        const length = (3 + random * 24) * (.4 + depth);
        const offset = Math.sin(x / wavelength + time * speed + row * .78) * amplitude;
        ctx.strokeStyle = `rgba(217,194,238,${(.07 + shimmer * .34) * (1 - depth * .65)})`;
        ctx.lineWidth = .7 + depth;
        ctx.beginPath(); ctx.moveTo(x, y + offset); ctx.lineTo(x + length, y + offset - .4); ctx.stroke();
      }
    }
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function restart() { cancelAnimationFrame(frame); draw(performance.now()); }
  resize(); restart();
  addEventListener('resize', () => { resize(); if (motion.matches) restart(); }, { passive: true });
  document.addEventListener('visibilitychange', restart);
  motion.addEventListener('change', restart);
})();

