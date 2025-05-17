const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type');

// Load details (including seasons if TV)
async function loadDetails() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();

    document.getElementById('title').textContent = data.title || data.name;
    document.getElementById('description').textContent = data.overview;
    document.getElementById('poster').src = IMG_URL + data.poster_path;
    document.getElementById('date').textContent = 'Release Date: ' + (data.release_date || data.first_air_date);
    document.getElementById('rating').textContent = 'Rating: ' + data.vote_average + ' ⭐';

    // Embed player
    document.getElementById('player').src = `https://vidsrc.to/embed/${type}/${id}`;

    // Show/hide episodes UI based on type
    if (type === 'tv') {
      await loadSeasons(id);
    } else {
      document.getElementById('episode-section').style.display = 'none';
    }
  } catch (error) {
    console.error(error);
    document.body.innerHTML = '<p style="color: red;">Failed to load content. Please try again later.</p>';
  }
}

// Load related titles
async function loadRelated() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();
    const genreIds = (data.genres || []).map(g => g.id).join(',');

    if (!genreIds) return;

    const relatedRes = await fetch(
      `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=popularity.desc`
    );
    const relatedData = await relatedRes.json();
    const filtered = relatedData.results.filter(item => item.id !== data.id);

    renderList('related-list', filtered.slice(0, 20));
  } catch (err) {
    console.error('Error loading related titles:', err);
  }
}

function renderList(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'related-card';

    const link = document.createElement('a');
    link.href = `watch.html?type=${type}&id=${item.id}`;

    const img = document.createElement('img');
    img.src = IMG_URL + item.poster_path;
    img.alt = item.title || item.name;

    const title = document.createElement('p');
    title.textContent = item.title || item.name;

    link.appendChild(img);
    link.appendChild(title);
    div.appendChild(link);
    container.appendChild(div);
  });
}

async function loadSeasons(tvId) {
  const seasonSelect = document.getElementById('seasonSelect');
  const episodeSection = document.getElementById('episode-section');

  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}`);
    const data = await res.json();

    if (!data.seasons || data.seasons.length === 0) {
      seasonSelect.style.display = 'none';
      episodeSection.style.display = 'none';
      return;
    }

    seasonSelect.style.display = 'inline-block';
    episodeSection.style.display = 'block';
    seasonSelect.innerHTML = '';

    data.seasons.forEach(season => {
      if (season.season_number === 0) return;
      const option = document.createElement('option');
      option.value = season.season_number;
      option.textContent = season.name;
      seasonSelect.appendChild(option);
    });

    // Attach listener here after options are created
    seasonSelect.addEventListener('change', e => {
    const seasonNum = parseInt(e.target.value, 10);
    loadEpisodes(tvId, seasonNum).then(() => {
      applyEpisodeToggleBehavior();

      // Automatically play episode 1 of the selected season
      document.getElementById('player').src =
        `https://vidsrc.to/embed/tv/${tvId}/${seasonNum}/1`;
    });
  });

    // Load first season by default
    const firstSeason = data.seasons[0].season_number;
    loadEpisodes(tvId, firstSeason).then(() => {
      applyEpisodeToggleBehavior();
      document.getElementById('player').src =
        `https://vidsrc.to/embed/tv/${tvId}/${firstSeason}/1`;
    });
  } catch (err) {
    console.error('Failed to load seasons:', err);
  }
}

async function loadEpisodes(tvId, seasonNumber = 1) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
    const data = await res.json();

    const container = document.getElementById('episode-list');
    container.innerHTML = '';

    data.episodes.forEach(episode => {
      const li = document.createElement('li');
      li.textContent = `${episode.episode_number}. ${episode.name}`;
      li.setAttribute('data-overview', episode.overview || 'No description available');

      li.onclick = () => {
        document.getElementById('player').src =
          `https://vidsrc.to/embed/tv/${tvId}/${seasonNumber}/${episode.episode_number}`;
      };

      container.appendChild(li);
    });

    updateToggleVisibility();
  } catch (err) {
    console.error('Error loading episodes:', err);
  }
}

function applyEpisodeToggleBehavior() {
  const container = document.getElementById('episode-container');
  const list = document.getElementById('episode-list');
  const toggle = document.getElementById('toggle-episodes');

  if (!container || !list || !toggle) return;

  const maxVisible = 10;
  const allEpisodes = Array.from(list.children);

  if (allEpisodes.length > maxVisible) {
    toggle.style.display = 'block';
    allEpisodes.forEach((li, index) => {
      li.style.display = index < maxVisible ? 'block' : 'none';
    });
  } else {
    toggle.style.display = 'none';
  }

  toggle.onclick = () => {
    const expanded = container.classList.toggle('expanded');
    allEpisodes.forEach(li => {
      li.style.display = expanded ? 'block' : 'none';
    });
    if (!expanded) {
      allEpisodes.forEach((li, index) => {
        li.style.display = index < maxVisible ? 'block' : 'none';
      });
    }
    toggle.textContent = expanded ? 'Show Less' : 'Show More';
  };
}

function updateToggleVisibility() {
  const list = document.getElementById('episode-list');
  const toggle = document.getElementById('toggle-episodes');

  if (!list || !toggle) return;
  toggle.style.display = list.children.length > 10 ? 'block' : 'none';
}

function initializeScrolling(wrapperSelector = '.list-wrapper') {
  document.querySelectorAll(wrapperSelector).forEach(wrapper => {
    const container = wrapper.querySelector('.list');
    const prevBtn = wrapper.querySelector('.scroll-btn.prev');
    const nextBtn = wrapper.querySelector('.scroll-btn.next');

    if (!container || !prevBtn || !nextBtn) return;

    const updateScrollButtonVisibility = () => {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      prevBtn.style.display = scrollLeft <= 5 ? 'none' : 'block';
      nextBtn.style.display = scrollLeft >= maxScrollLeft - 5 ? 'none' : 'block';
    };

    const waitForImagesToLoad = (callback) => {
      const images = container.querySelectorAll('img');
      let loaded = 0;

      if (images.length === 0) return callback();

      images.forEach(img => {
        if (img.complete) {
          loaded++;
          if (loaded === images.length) callback();
        } else {
          img.onload = img.onerror = () => {
            loaded++;
            if (loaded === images.length) callback();
          };
        }
      });
    };

    waitForImagesToLoad(() => {
      updateScrollButtonVisibility();
    });

    container.addEventListener('scroll', debounce(updateScrollButtonVisibility));

    prevBtn.addEventListener('click', () => {
      container.scrollBy({ left: -container.clientWidth * 0.8, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      container.scrollBy({ left: container.clientWidth * 0.8, behavior: 'smooth' });
    });
  });
}

function debounce(func, delay = 150) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// MAIN INIT
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadDetails();
    await loadRelated();
    initializeScrolling();
  } catch (err) {
    console.error('Error during page load:', err);
  } finally {
    hideLoadingScreen();
  }
});

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
  loadingScreen.classList.add('hidden');
  setTimeout(() => loadingScreen.style.display = 'none', 500); // optional fade-out
 }
}