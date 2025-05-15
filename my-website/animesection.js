const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const ITEMS_PER_PAGE = 30;
let currentPage = 1;
let totalPages = 1000;
let selectedYear = '';
let selectedGenre = '';

// Populate years dropdown
function populateYears() {
  const yearSelect = document.getElementById('yearSelect');
  yearSelect.innerHTML = '<option value="">All Years</option>';

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1980; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Populate genres dropdown dynamically from TMDB API
async function populateGenres() {
  const genreSelect = document.getElementById('genreSelect');
  genreSelect.innerHTML = '<option value="">All Genres</option>';

  try {
    const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
    const data = await res.json();

    data.genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load genres:', error);
  }
}

// Fetch Anime TV shows page with applied filters
async function fetchAnimePage(page) {
  const itemsNeeded = ITEMS_PER_PAGE;
  const tmdbItemsPerPage = 20;
  const tmdbPagesNeeded = Math.ceil(itemsNeeded / tmdbItemsPerPage);
  const startTmdbPage = (page - 1) * tmdbPagesNeeded + 1;

  let allResults = [];

  for (let i = 0; i < tmdbPagesNeeded; i++) {
    const tmdbPage = startTmdbPage + i;

    const url = new URL(`${BASE_URL}/discover/tv`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('page', tmdbPage);
    url.searchParams.append('sort_by', 'first_air_date.desc'); // popular first

    // Apply genre filter or default to Animation (id 16)
    if (selectedGenre) {
      url.searchParams.append('with_genres', selectedGenre);
    } else {
      url.searchParams.append('with_genres', '16');
    }
    // *** Add language filter here ***
    url.searchParams.append('with_original_language', 'ja');

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (i === 0) {
        totalPages = Math.min(Math.ceil(data.total_results / ITEMS_PER_PAGE), 1000);
      }

      let results = data.results.filter(item => item.poster_path);

      // Exclude unaired/future shows
      const today = new Date().toISOString().split('T')[0];
      results = results.filter(item => item.first_air_date && item.first_air_date <= today);

      // Apply year filter if selected
      if (selectedYear) {
        results = results.filter(item => {
          const year = item.first_air_date?.split('-')[0];
          return year === selectedYear;
        });
      }

      allResults.push(...results);
      
      allResults.sort((a, b) => {
        if (a.first_air_date === b.first_air_date) {
          return b.popularity - a.popularity;
        }
        return 0;
      });

    } catch (error) {
      console.error('Error fetching anime:', error);
      break;
    }
  }

  return allResults.slice(0, ITEMS_PER_PAGE);
}

// Display anime items in grid
function displayAnime(items) {
  const container = document.getElementById('movieList');
  container.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('item-card');

    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.name;
    img.onclick = () => {
      window.location.href = `watch.html?id=${item.id}&type=tv`;
    };

    const title = document.createElement('p');
    title.classList.add('item-title');
    title.textContent = item.name;

    card.appendChild(img);
    card.appendChild(title);
    container.appendChild(card);
  });
}

// Render pagination controls
function renderPagination(current) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const maxButtons = 5;
  let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = current === 1;
  prevBtn.onclick = () => {
    if (current > 1) {
      currentPage = current - 1;
      fetchAndDisplayPage(currentPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  pagination.appendChild(prevBtn);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.onclick = () => {
    selectedYear = '';
    selectedGenre = '';
    document.getElementById('yearSelect').value = '';
    document.getElementById('genreSelect').value = '';
    currentPage = 1;
    fetchAndDisplayPage(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  pagination.appendChild(resetBtn);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === current) btn.classList.add('active');
    btn.onclick = () => {
      if (i !== currentPage) {
        currentPage = i;
        fetchAndDisplayPage(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    pagination.appendChild(btn);
  }

  const jumpForm = document.createElement('form');
  jumpForm.onsubmit = (e) => {
    e.preventDefault();
    const inputVal = parseInt(jumpInput.value, 10);
    if (!isNaN(inputVal) && inputVal >= 1 && inputVal <= totalPages) {
      currentPage = inputVal;
      fetchAndDisplayPage(currentPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      jumpInput.value = '';
    }
  };

  const jumpInput = document.createElement('input');
  jumpInput.type = 'number';
  jumpInput.min = 1;
  jumpInput.max = totalPages;
  jumpInput.placeholder = 'Page';

  const goBtn = document.createElement('button');
  goBtn.textContent = 'Go';

  jumpForm.appendChild(jumpInput);
  jumpForm.appendChild(goBtn);
  pagination.appendChild(jumpForm);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = current === totalPages;
  nextBtn.onclick = () => {
    if (current < totalPages) {
      currentPage = current + 1;
      fetchAndDisplayPage(currentPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  pagination.appendChild(nextBtn);
}

function showSpinner(show) {
  let spinner = document.getElementById('loading-spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.textContent = 'Loading...';
    spinner.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 16px;
      user-select: none;
    `;
    document.body.appendChild(spinner);
  }
  spinner.style.display = show ? 'block' : 'none';
}

async function fetchAndDisplayPage(page) {
  localStorage.setItem('currentPage_anime', page);
  document.title = `Anime | CineStream - Page ${page}`;
  showSpinner(true);

  try {
    const shows = await fetchAnimePage(page);
    displayAnime(shows);
    renderPagination(page);
  } catch (error) {
    console.error('Error displaying anime:', error);
  } finally {
    showSpinner(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateYears();
  populateGenres();

  const savedPage = parseInt(localStorage.getItem('currentPage_anime'), 10);
  currentPage = !isNaN(savedPage) ? savedPage : 1;

  document.getElementById('applyFilters').addEventListener('click', () => {
    selectedYear = document.getElementById('yearSelect').value;
    selectedGenre = document.getElementById('genreSelect').value;
    currentPage = 1;
    fetchAndDisplayPage(currentPage);
  });

  fetchAndDisplayPage(currentPage);
});
