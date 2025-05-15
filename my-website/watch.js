const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');
const type = urlParams.get('type');

// Fetch media details
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
  } catch (error) {
    document.body.innerHTML = '<p style="color: red;">Failed to load content. Please try again later.</p>';
    console.error(error);
  }
}

// Fetch related items based on type
async function loadRelated() {
  try {
    // First, fetch the current media again to get genres
    const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`);
    const data = await res.json();

    const genreIds = (data.genres || []).map(g => g.id).join(',');
    if (!genreIds) return;

    // Now, fetch related content by genre
    const relatedRes = await fetch(
      `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=popularity.desc`
    );
    const relatedData = await relatedRes.json();

    // Filter out the current item
    const filtered = relatedData.results.filter(item => item.id !== data.id);

    renderList('related-list', filtered.slice(0, 20));
  } catch (err) {
    console.error('Error loading related titles:', err);
  }
}


// Render related titles
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


// Init
loadDetails();
loadRelated();

function waitForImagesToLoad(container, callback) {
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
}

function debounce(func, delay = 150) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function updateScrollButtonVisibility(container, prevBtn, nextBtn) {
  const scrollLeft = container.scrollLeft;
  const maxScrollLeft = container.scrollWidth - container.clientWidth;

  prevBtn.style.display = scrollLeft <= 5 ? 'none' : 'block';
  nextBtn.style.display = scrollLeft >= maxScrollLeft - 5 ? 'none' : 'block';
}

function initializeScrolling(wrapperSelector = '.list-wrapper') {
  document.querySelectorAll(wrapperSelector).forEach(wrapper => {
    const container = wrapper.querySelector('.list');
    const prevBtn = wrapper.querySelector('.scroll-btn.prev');
    const nextBtn = wrapper.querySelector('.scroll-btn.next');

    waitForImagesToLoad(container, () => {
      updateScrollButtonVisibility(container, prevBtn, nextBtn);
    });

    container.addEventListener('scroll', debounce(() => {
      updateScrollButtonVisibility(container, prevBtn, nextBtn);
    }));

    [prevBtn, nextBtn].forEach(button => {
      button.addEventListener('click', () => {
        const scrollAmount = container.clientWidth * 0.8;
        container.scrollBy({
          left: button.classList.contains('prev') ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });

        setTimeout(() => {
          updateScrollButtonVisibility(container, prevBtn, nextBtn);
        }, 350);
      });
    });
  });
}

loadRelated().then(() => {
  initializeScrolling();
});
