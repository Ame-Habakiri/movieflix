const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  const enterButton = document.querySelector('.enter-button');
  const backButton = document.getElementById('back-button');
  const intro = document.querySelector('.intro');
  const overlay = document.querySelector('.overlay');
  const searchContainer = document.querySelector('.search-container');

  if (!query) {
    container.innerHTML = '<p style="color: white;">Please enter a search term.</p>';
    return;
  }

  // Hide intro + overlay, show results
  intro.classList.add('hidden');
  overlay.classList.add('hidden');
  backButton.style.display = 'block';
  container.innerHTML = ''; // clear previous
  document.body.style.overflowY = 'auto'; // allow scrolling

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      container.innerHTML = '<p style="color: white;">No results found.</p>';
      return;
    }

    data.results.forEach(item => {
      if (!item.poster_path) return;

      const img = document.createElement('img');
      img.src = `${IMG_URL}${item.poster_path}`;
      img.alt = item.title || item.name;
      img.classList.add('search-result-image');

      img.onclick = () => {
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        window.location.href = `watch.html?id=${item.id}&type=${type}`;
      };

      container.appendChild(img);
    });

  } catch (error) {
    console.error("Search error:", error);
    container.innerHTML = '<p style="color: white;">Error during search. Try again later.</p>';
  }
}

function goBack() {
  const container = document.getElementById('search-results');
  const searchInput = document.getElementById('search-input');
  const backButton = document.getElementById('back-button');
  const intro = document.querySelector('.intro');
  const overlay = document.querySelector('.overlay');

  container.innerHTML = '';
  searchInput.value = '';
  backButton.style.display = 'none';
  intro.classList.remove('hidden');
  overlay.classList.remove('hidden');
  document.body.style.overflowY = 'hidden'; // disable scroll when showing intro
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchTMDB();
  });

  document.querySelector('.search-button')?.addEventListener('click', searchTMDB);
  document.getElementById('back-button')?.addEventListener('click', goBack);
});
