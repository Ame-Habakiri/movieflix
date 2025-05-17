const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/w300';

    async function fetchUpcomingMovies() {
      const res = await fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`);
      const data = await res.json();
      return data.results.filter(item => item.poster_path);
    }

    async function fetchUpcomingTVShows() {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=first_air_date.asc&first_air_date.gte=${today}&page=1`);
      const data = await res.json();
      return data.results.filter(item => item.poster_path && item.original_language !== 'ko');
    }

    async function fetchUpcomingAnime() {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=first_air_date.asc&with_original_language=ja&first_air_date.gte=${today}&page=1`);
      const data = await res.json();

  // Filter for anime (genre ID 16)
  return data.results.filter(item => item.poster_path && item.genre_ids.includes(16));
    }

    async function fetchUpcomingKoreanDramas() {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=first_air_date.asc&with_original_language=ko&first_air_date.gte=${today}&page=1`);
      const data = await res.json();
      return data.results.filter(item => item.poster_path);
    }

    function displayRow(list, containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      list.forEach(item => {
        const name = item.title || item.name;
        const date = item.release_date || item.first_air_date;

        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
          <img src="${IMG_URL}${item.poster_path}" alt="${name}">
          <p>${name}</p>
          <small>${date}</small>
        `;
        container.appendChild(div);
      });
    }

    async function init() {
      const [movies, tvShows, kdramas, anime] = await Promise.all([
        fetchUpcomingMovies(),
        fetchUpcomingTVShows(),
        fetchUpcomingKoreanDramas(),
        fetchUpcomingAnime()
      ]);

      displayRow(movies, 'upcoming-movies');
      displayRow(tvShows, 'upcoming-tv');
      displayRow(kdramas, 'upcoming-kdrama');
      displayRow(anime, 'upcoming-anime');
    }

    init();

    function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}