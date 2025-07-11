document.addEventListener('DOMContentLoaded', () => {
    const menuListContainer = document.getElementById('menu-list');
    const mainNav = document.getElementById('main-nav');
    const stickyNav = document.getElementById('sticky-nav');
    const stickyNavContainer = stickyNav.querySelector('.max-w-7xl > div');

    let menu = [];
    let allCategories = [];

    // 1. Fetch menu data
    async function fetchMenu() {
        try {
            const res = await fetch('/api/get-menu');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            menu = await res.json();
            
            // Extract unique categories from the main nav buttons
            const categoryButtons = mainNav.querySelectorAll('.category-btn');
            allCategories = Array.from(categoryButtons).map(btn => {
                return {
                    id: btn.dataset.category,
                    label: btn.querySelector('span').textContent,
                    icon: btn.querySelector('img').src,
                    alt: btn.querySelector('img').alt,
                };
            });
            
            // Don't re-render main buttons, just set up the sticky ones
            setupStickyNav();
            setupFiltering();
            displayItems(menu); // Initial display of all items
            setupScrollAnimations();

        } catch (error) {
            console.error("Failed to fetch menu:", error);
            menuListContainer.innerHTML = `<p class="text-center text-red-400 col-span-full">Failed to load menu. Please try again later.</p>`;
        }
    }

    // 2. Render items based on a filter
    function displayItems(items) {
        menuListContainer.innerHTML = items.map((item, idx) => `
            <article data-index="${idx}"
                     class="group relative bg-white rounded-2xl overflow-hidden shadow-lg
                            opacity-0 translate-y-8 transition-all duration-700 ease-out flex flex-col"
            >
                <div class="relative w-full h-48 overflow-hidden">
                    <img src="${item.img}" alt="${item.title}"
                         class="w-full h-full object-cover transform 
                                group-hover:scale-105 transition-transform duration-500"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-40 pointer-events-none"></div>
                    <span class="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600
                                  text-white text-sm font-semibold uppercase px-3 py-1 rounded-full drop-shadow-lg">
                        ${item.category}
                    </span>
                </div>
                <div class="p-5 flex flex-col flex-grow text-gray-800">
                    <h2 class="text-2xl font-bold mb-1 text-slate-700 group-hover:text-yellow-600 transition-colors duration-300">
                        ${item.title}
                    </h2>
                    <p class="text-xl text-gray-500 flex-grow mb-4 line-clamp-3">
                        ${item.description}
                    </p>
                    <div class="flex items-center justify-between mt-auto">
                        <span class="text-xl font-extrabold text-yellow-500">
                            ${item.price.toLocaleString()} تومان
                        </span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    // 3. Setup IntersectionObserver for scroll-in animations
    function setupScrollAnimations() {
        const articles = menuListContainer.querySelectorAll('article');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const idx = Number(el.dataset.index);
                    // Stagger animation
                    el.style.transitionDelay = `${idx * 100}ms`;
                    el.classList.remove('opacity-0', 'translate-y-8');
                    el.classList.add('opacity-100', 'translate-y-0');
                    obs.unobserve(el);
                }
            });
        }, {
            rootMargin: '0px 0px -20% 0px',
            threshold: 0
        });

        articles.forEach(article => observer.observe(article));
    }

    // 4. Create and manage the sticky navigation bar
    function setupStickyNav() {
        // Create compact buttons for the sticky nav
        stickyNavContainer.innerHTML = allCategories.map(cat => `
            <button data-category="${cat.id}" aria-label="${cat.label}"
                    class="sticky-category-btn flex flex-row-reverse items-center gap-2 px-3 py-1.5
                           border rounded-lg transition border-yellow-600 bg-slate-700
                           text-gray-200 text-sm hover:bg-yellow-500 hover:text-white">
                <img src="${cat.icon}" alt="${cat.alt}" class="h-5 w-5 flex-shrink-0"/>
                <span>${cat.label}</span>
            </button>
        `).join('');
        
        // Observer to show/hide the sticky nav
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                stickyNav.classList.remove('hidden');
                stickyNav.classList.add('flex');
            } else {
                stickyNav.classList.add('hidden');
                stickyNav.classList.remove('flex');
            }
        }, { threshold: 0 });

        observer.observe(mainNav);
    }
    
    // 5. Setup filtering logic for ALL category buttons (main and sticky)
    function setupFiltering() {
        const allButtons = document.querySelectorAll('.category-btn, .sticky-category-btn');

        allButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                const filteredItems = category === 'all'
                    ? menu
                    : menu.filter(item => item.category === category);
                
                displayItems(filteredItems);
                // Re-apply animations to the new set of items
                setupScrollAnimations();
            });
        });
    }

    // Initial call
    fetchMenu();
});