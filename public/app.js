document.addEventListener('DOMContentLoaded', () => {
    const menuList = document.getElementById('menu-list');
    const mainNav = document.getElementById('main-nav');
    const stickyNavContainer = document.getElementById('sticky-nav-container');
    const stickyNavButtons = document.getElementById('sticky-nav-buttons');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    let menu = [];
    let currentCategory = 'all';

    // 1. --- INITIALIZATION ---
    async function init() {
        await fetchMenu();
        cloneNavButtons();
        setupEventListeners();
        handleScroll(); // Initial check
        updateActiveButtons();
    }

    // 2. --- DATA FETCHING ---
    async function fetchMenu() {
        try {
            const res = await fetch('/api/get-menu');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            menu = await res.json();
            displayItems(menu);
        } catch (error) {
            console.error("Failed to fetch menu:", error);
            menuList.innerHTML = `<p class="text-center text-red-400">متاسفانه در بارگیری منو مشکلی پیش آمد.</p>`;
        }
    }

    // 3. --- RENDERING & UI UPDATES ---
    function displayItems(items) {
        if (items.length === 0) {
            menuList.innerHTML = `<p class="text-center text-xl w-full">موردی در این دسته بندی یافت نشد.</p>`;
            return;
        }

        menuList.innerHTML = items.map((item, idx) => `
            <article data-index="${idx}" class="snap-start shrink-0 w-4/5 sm:w-1/3 lg:w-1/4 xl:w-1/5 bg-white text-gray-800 rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all duration-300">
                <div class="relative w-full h-48 overflow-hidden">
                    <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <span class="absolute top-3 left-3 bg-amber-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                        ${item.category}
                    </span>
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <h2 class="text-2xl font-bold mb-2 text-gray-900">${item.title}</h2>
                    <p class="text-gray-600 flex-grow mb-4 text-base">${item.description}</p>
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
                        <span class="text-xl font-extrabold text-amber-600">
                            ${item.price.toLocaleString()} تومان
                        </span>
                    </div>
                </div>
            </article>
        `).join('');
        
        // Reset scroll position on filter change
        menuList.scrollTo({ left: 0, behavior: 'smooth' });
    }

    function cloneNavButtons() {
        const mainButtons = mainNav.querySelectorAll('.category-btn');
        mainButtons.forEach(btn => {
            const clone = btn.cloneNode(true);
            // Make sticky nav buttons smaller
            clone.classList.remove('text-xl', 'px-6', 'py-3');
            clone.classList.add('text-sm', 'px-3', 'py-2');
            clone.querySelector('img').classList.remove('h-7', 'w-7');
            clone.querySelector('img').classList.add('h-5', 'w-5');
            stickyNavButtons.appendChild(clone);
        });
    }

    function updateActiveButtons() {
        const allButtons = document.querySelectorAll('.category-btn');
        allButtons.forEach(btn => {
            if (btn.dataset.category === currentCategory) {
                btn.classList.remove('bg-gray-700', 'text-gray-200');
                btn.classList.add('bg-amber-500', 'text-white');
            } else {
                btn.classList.remove('bg-amber-500', 'text-white');
                btn.classList.add('bg-gray-700', 'text-gray-200');
            }
        });
    }


    // 4. --- EVENT HANDLING ---
    function setupEventListeners() {
        // Category filtering for ALL buttons (main + sticky)
        document.body.addEventListener('click', (e) => {
            const button = e.target.closest('.category-btn');
            if (button) {
                currentCategory = button.dataset.category;
                const filtered = currentCategory === 'all'
                    ? menu
                    : menu.filter(i => i.category === currentCategory);
                displayItems(filtered);
                updateActiveButtons();
            }
        });

        // Scroll event for sticky nav
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Carousel navigation
        nextBtn.addEventListener('click', () => scrollCarousel(-1));
        prevBtn.addEventListener('click', () => scrollCarousel(1));
    }

    function handleScroll() {
        const navBottom = mainNav.getBoundingClientRect().bottom;
        if (window.scrollY > navBottom) {
            stickyNavContainer.classList.remove('-translate-y-full');
        } else {
            stickyNavContainer.classList.add('-translate-y-full');
        }
    }

    function scrollCarousel(direction) {
        const cardWidth = menuList.querySelector('article')?.offsetWidth || 0;
        const gap = parseInt(window.getComputedStyle(menuList).gap) || 24;
        const scrollAmount = (cardWidth + gap) * direction;
        
        menuList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }

    // 5. --- START THE APP ---
    init();
});