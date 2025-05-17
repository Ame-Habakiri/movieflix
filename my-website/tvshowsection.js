const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const ITEMS_PER_PAGE = 30;
let currentPage = 1;
let totalPages = 1000; // TMDB max pages
let selectedGenre = '';
let selectedYear = '';

// Populate genre dropdown from TMDB API
async function populateGenres() {
  const genreSelect = document.getElementById('genreSelect');
  genreSelect.innerHTML = '<option value="">All Genres</option>';

  try {
    const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
    const data = await res.json();

    if (data.genres) {
      data.genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

// Populate year dropdown from current year to 1950
function populateYears() {
  const yearSelect = document.getElementById('yearSelect');
  yearSelect.innerHTML = '<option value="">All Years</option>';

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1950; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Fetch movies from TMDB with filters and pagination
async function fetchMoviesPage(page) {
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
    url.searchParams.append('sort_by', 'popularity.desc');

    if (selectedGenre) url.searchParams.append('with_genres', selectedGenre);
    if (selectedYear) url.searchParams.append('primary_release_year', selectedYear);

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (i === 0) {
        totalPages = Math.min(Math.ceil(data.total_results / ITEMS_PER_PAGE), 1000);
      }

      allResults.push(...data.results.filter(item => item.poster_path));
    } catch (error) {
      console.error('Error fetching movies page:', error);
      break;
    }
  }

  return allResults.slice(0, ITEMS_PER_PAGE);
}

// Display movies on the page
function displayMovies(movies) {
  const container = document.getElementById('movieList');
  container.innerHTML = '';

  movies.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('item-card');

    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.style.cursor = 'pointer';
    img.onclick = () => {
    window.location.href = `watch.html?id=${item.id}&type=tv`;
    };

    const title = document.createElement('p');
    title.classList.add('item-title');
    title.textContent = item.title || item.name;

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

  // Prev button
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

  // Reset filters button
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.onclick = () => {
    selectedGenre = '';
    selectedYear = '';
    document.getElementById('genreSelect').value = '';
    document.getElementById('yearSelect').value = '';
    currentPage = 1;
    fetchAndDisplayPage(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  pagination.appendChild(resetBtn);

  // Numbered buttons
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

  // Jump to page form
  const jumpForm = document.createElement('form');
  jumpForm.style.display = 'inline-block';
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
  jumpInput.style.width = '60px';
  jumpInput.style.marginLeft = '10px';
  jumpInput.style.padding = '4px';
  jumpInput.style.borderRadius = '4px';
  jumpInput.style.border = '1px solid #444';
  jumpInput.style.background = '#222';
  jumpInput.style.color = 'white';

  const goBtn = document.createElement('button');
  goBtn.textContent = 'Go';
  goBtn.style.marginLeft = '5px';
  goBtn.style.padding = '6px 10px';

  jumpForm.appendChild(jumpInput);
  jumpForm.appendChild(goBtn);
  pagination.appendChild(jumpForm);

  // Next button
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

// Show or hide loading spinner
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

// Main fetch + display function
async function fetchAndDisplayPage(page) {
  localStorage.setItem('currentPage', page);
  document.title = `TV Show | CineStream - Page ${page}`;
  showSpinner(true);

  try {
    const movies = await fetchMoviesPage(page);
    displayMovies(movies);
    renderPagination(page);
  } catch (error) {
    console.error('Error fetching movies:', error);
  } finally {
    showSpinner(false);
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  populateGenres();
  populateYears();

  const savedPage = parseInt(localStorage.getItem('currentPage'), 10);
  currentPage = !isNaN(savedPage) ? savedPage : 1;

  document.getElementById('applyFilters').addEventListener('click', () => {
    selectedGenre = document.getElementById('genreSelect').value;
    selectedYear = document.getElementById('yearSelect').value;
    currentPage = 1;
    fetchAndDisplayPage(currentPage);
  });

  // Hide loading screen after first page loaded
  fetchAndDisplayPage(currentPage).then(() => {
    hideLoadingScreen();
  });
});

function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
          setTimeout(() => loadingScreen.style.display = 'none', 500); // optional fade-out
        }
      }
