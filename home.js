const API_KEY = 'a6df4f6938a6d277a9cae99e8179c1af';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    let currentItem;

    // Helper to check if a date string is within range (inclusive)
    function isWithinDateRange(dateStr, minDate, maxDate) {
      if (!dateStr) return false; // Handle missing or null dates gracefully
      const date = new Date(dateStr);
      return date >= minDate && date <= maxDate;
    }

    // Helper to get minDate based on yearsAgo and maxDate (today)
    function getDateRange(yearsAgo) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const minDate = new Date(`${currentYear - yearsAgo}-01-01`);
      return { minDate, today };
    }

    async function fetchPaginatedResults(urlBuilder, filterFn = null, maxPages = 5) {
      let allResults = [];

      for (let page = 1; page <= maxPages; page++) {  
        try {
          const url = urlBuilder(page);
          const res = await fetch(url);

          if (!res.ok) {
            console.error(`Error fetching page ${page}: ${res.status}`);
            break;
          }

          const data = await res.json();

          if (!data.results || data.results.length === 0) break;

          const results = filterFn ? data.results.filter(filterFn) : data.results;
          allResults = allResults.concat(results);
        } catch (error) {
          console.error('Fetch error:', error);
          break;
        }
      }

      return allResults;
    }

    // Specialized Fetchers

    async function fetchTrending(type) {
    const { minDate, today } = getDateRange(1); // you can adjust the range

    return await fetchPaginatedResults(
      page => `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&page=${page}`,
      item => {
        const dateStr = item.release_date || item.first_air_date || '';
        return (
          item.poster_path &&
          isWithinDateRange(dateStr, minDate, today)
        );
      }
    );
  }

    async function fetchTrendingAnime() {
      const { minDate, today } = getDateRange(5);

      return await fetchPaginatedResults(
        page => `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ja&with_genres=16&sort_by=popularity.desc&page=${page}`,
        item => {
          return (
            item.original_language === 'ja' &&
            item.genre_ids.includes(16) &&
            item.poster_path &&
            isWithinDateRange(item.first_air_date, minDate, today)
          );
        }
      );
    }

    async function fetchTrendingKoreanDramas() {
      const { minDate, today } = getDateRange(5);

      return await fetchPaginatedResults(
        page =>
          `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_original_language=ko&include_null_first_air_dates=false&page=${page}`,
        item => {
          return (
            item.original_language === 'ko' &&
            item.poster_path &&
            isWithinDateRange(item.first_air_date, minDate, today)
          );
        }
      );
    }

    async function fetchTrendingFilipinoSeries() {
      const { minDate, today } = getDateRange(5);

      return await fetchPaginatedResults(
        page =>
          `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_original_language=tl&page=${page}`,
        item => {
          return (
            item.original_language === 'tl' &&
            item.poster_path &&
            isWithinDateRange(item.release_date, minDate, today)
          );
        }
      );
    }

    const banner = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');
    const bannerDots = document.getElementById('banner-dots');
    const prevBtn = document.getElementById('banner-prev');
    const nextBtn = document.getElementById('banner-next');

    let bannerIndex = 0;
    let bannerItems = [];
    let bannerInterval;
    let isHovered = false;

    async function loadBannerCarousel() {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
        const data = await res.json();
        bannerItems = data.results.filter(item => item.backdrop_path).slice(0,10);

        if (bannerItems.length > 0) {
          createDots(bannerItems.length);
          displayBanner(bannerItems[bannerIndex]);
          startCarousel();
        }
      } catch (err) {
        console.error('Failed to load banner items:', err);
      }
    }

    function displayBanner(item) {
      banner.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
      bannerTitle.textContent = item.title || item.name;
      updateDots();
    }

    function createDots(count) {
      bannerDots.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('span');
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          bannerIndex = i;
          displayBanner(bannerItems[bannerIndex]);
          resetCarousel();
        });
        bannerDots.appendChild(dot);
      }
    }

    function updateDots() {
      const dots = bannerDots.querySelectorAll('span');
      dots.forEach(dot => dot.classList.remove('active'));
      if (dots[bannerIndex]) {
        dots[bannerIndex].classList.add('active');
      }
    }

    function startCarousel() {
      bannerInterval = setInterval(() => {
        if (!isHovered) {
          bannerIndex = (bannerIndex + 1) % bannerItems.length;
          displayBanner(bannerItems[bannerIndex]);
        }
      }, 5000);
    }

    function stopCarousel() {
      clearInterval(bannerInterval);
    }

    function resetCarousel() {
      stopCarousel();
      startCarousel();
    }

    // Navigation buttons
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent banner click
      bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
      displayBanner(bannerItems[bannerIndex]);
      resetCarousel();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent banner click
      bannerIndex = (bannerIndex + 1) % bannerItems.length;
      displayBanner(bannerItems[bannerIndex]);
      resetCarousel();
    });

    // Pause on hover
    banner.addEventListener('mouseenter', () => { isHovered = true; });
    banner.addEventListener('mouseleave', () => { isHovered = false; });

    banner.addEventListener('click', () => {
      const currentItem = bannerItems[bannerIndex];
      if (!currentItem) return;
      const type = currentItem.media_type || (currentItem.title ? 'movie' : 'tv');
      window.location.href = `watch.html?id=${currentItem.id}&type=${type}`;
    });

    loadBannerCarousel();


    function displayList(items, containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('item-card');

        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => {
          const type = item.media_type || (item.title ? 'movie' : 'tv');
          window.location.href = `watch.html?id=${item.id}&type=${type}`;
        };

        const title = document.createElement('p');
        title.classList.add('item-title');
        title.textContent = item.title || item.name;

        card.appendChild(img);
        card.appendChild(title);
        container.appendChild(card);
      });
    }

    function showDetails(item) {
      currentItem = item;
      document.getElementById('modal-title').textContent = item.title || item.name;
      document.getElementById('modal-description').textContent = item.overview;
      document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
      document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
      changeServer();
      document.getElementById('modal').style.display = 'flex';
    }

    function changeServer() {
      const server = document.getElementById('server').value;
      const type = currentItem.media_type === "movie" ? "movie" : "tv";
      let embedURL = "";

      if (server === "vidsrc.cc") {
        embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
      } else if (server === "vidsrc.me") {
        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
      } else if (server === "player.videasy.net") {
        embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
      }

      document.getElementById('modal-video').src = embedURL;
    }

    function closeModal() {
      document.getElementById('modal').style.display = 'none';
      document.getElementById('modal-video').src = '';
    }

    function openSearchModal() {
      document.getElementById('search-modal').style.display = 'flex';
      document.getElementById('search-input').focus();
    }

    function closeSearchModal() {
      document.getElementById('search-modal').style.display = 'none';
      document.getElementById('search-results').innerHTML = '';
    }

    async function searchTMDB() {
      const query = document.getElementById('search-input').value;
      if (!query.trim()) {
        document.getElementById('search-results').innerHTML = '';
        return;
      }

      const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
      const data = await res.json();

      const container = document.getElementById('search-results');
      container.innerHTML = '';
      data.results.forEach(item => {
        if (!item.poster_path) return;
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => {
          closeSearchModal();
          showDetails(item);
        };
        container.appendChild(img);
      });
    }

    async function init() {
      const movies = await fetchTrending('movie');
      const tvShows = await fetchTrending('tv');
      const anime = await fetchTrendingAnime();
      const kdrama = await fetchTrendingKoreanDramas();
      const filipinos = await fetchTrendingFilipinoSeries();

      displayBanner(movies[Math.floor(Math.random() * movies.length)]);
      displayList(movies.slice(0, 30), 'movies-list');
      displayList(tvShows.slice(0, 30), 'tvshows-list');
      displayList(anime.slice(0, 30), 'anime-list');
      displayList(kdrama.slice(0, 30), 'k-dramas-list');
      displayList(filipinos.slice(0, 30), 'filipino-movies');

      hideLoadingScreen(); // <--- hide loader once all is ready
    }

    init();

    function waitforImagesToLoad(container, callback){
      const images = container.querySelectorAll('img');
      let loadedCount = 0;

      if (images.length === 0 ){
        callback();
        return;
      }

      images.forEach(img => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount ===images.length) callback();
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === images.length) callback();
          });
          img.addEventListener('error', () => {
            loadedCount++;
            if (loadedCount === images.length) callback()
          })
        }
      })
    }

        // Example JS for toggling active class
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', function() {
        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
        this.classList.add('active');
      });
    });

    function updateScrollButtonVisibility(container, prevBtn, nextBtn) {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

        // Hide prev button if at start
        prevBtn.style.display = scrollLeft <= 5 ? 'none' : 'block';

        // Hide next button if at end
        nextBtn.style.display = scrollLeft >= maxScrollLeft - 5 ? 'hidden' : 'block';
      }

    document.querySelectorAll('.list-wrapper').forEach(wrapper => {
      const container = wrapper.querySelector('.list');
      const prevBtn = wrapper.querySelector('.scroll-btn.prev');
      const nextBtn = wrapper.querySelector('.scroll-btn.next');

      // Initial check
      waitforImagesToLoad(container, () => {
        updateScrollButtonVisibility(container, prevBtn, nextBtn);
    });

      // On scroll
      container.addEventListener('scroll', debounce(() => {
      updateScrollButtonVisibility(container, prevBtn, nextBtn);
    }));

      // On button click
      wrapper.querySelectorAll('.scroll-btn').forEach(button => {
        button.addEventListener('click', () => {
          const scrollAmount = container.clientWidth * 0.8;;
          container.scrollBy({
            left: button.classList.contains('prev') ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
          });

          // Delay update slightly to wait for smooth scroll
          setTimeout(() => {
            updateScrollButtonVisibility(container, prevBtn, nextBtn);
          }, 350);
        });
      });
    });


        document.querySelectorAll('.scroll-btn').forEach(button => {
        button.addEventListener('click', () => {
          const targetId = button.getAttribute('data-target');
          const container = document.getElementById(targetId);
          const item = container.querySelector('img');

          if (!item) return;

          const itemWidth = item.offsetWidth + 10; // Adjust for margin/padding
          const containerWidth = container.clientWidth;
          const itemsPerPage = Math.floor(containerWidth / itemWidth);
          const scrollStep = itemWidth * itemsPerPage;

          const isPrev = button.classList.contains('prev');
          const currentScroll = container.scrollLeft;
          const maxScroll = container.scrollWidth - container.clientWidth;

          // Calculate new scroll without exceeding bounds
          let newScroll = isPrev
            ? currentScroll - scrollStep
            : currentScroll + scrollStep;

          // Clamp newScroll between 0 and maxScroll
          newScroll = Math.max(0, Math.min(newScroll, maxScroll));

          // Align newScroll to nearest multiple of itemWidth
          newScroll = Math.round(newScroll / itemWidth) * itemWidth;

          // Clamp again after rounding, just in case
          newScroll = Math.max(0, Math.min(newScroll, maxScroll));

          container.scrollTo({
            left: newScroll,
            behavior: 'smooth'
          });
        });
      });

      function debounce(func, wait = 100) {
        let timeout;
        return function (...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      }

      function renderList(containerId, items) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear any existing content

        items.forEach(item => {
          const img = document.createElement('img');
          img.src = `${IMG_URL}${item.poster_path}`;  // <-- Fixed here
          img.alt = item.title || item.name;
          container.appendChild(img);
        });
      }   

      async function loadTrendingContentSequentially() {
        const movieResults = await fetchTrending('movie');
        renderList('movies-list', movieResults);

        const tvResults = await fetchTrending('tv');
        renderList('tvshows-list', tvResults);

        const kDramaResults = await fetchTrendingKoreanDramas();
        renderList('k-dramas-list', kDramaResults);

        const filipinoResults = await fetchTrendingFilipinoSeries();
        renderList('filipino-movies', filipinoResults);

        const animeResults = await fetchTrendingAnime();
        displayList(animeResults, 'anime-list');
      }

      document.addEventListener('DOMContentLoaded', () => {
        loadTrendingContentSequentially();
      });

      document.addEventListener('DOMContentLoaded', () => {
        if (prevBtn && nextBtn) {
          // Bind your button events
        }

        loadTrendingContentSequentially();
      });

      function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
          setTimeout(() => loadingScreen.style.display = 'none', 500); // optional fade-out
        }
      }

      const img = document.createElement('img');
        img.loading = 'lazy'; // Add this line

      

      
