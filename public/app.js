document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const menuListContainer = document.getElementById('menu-list');
    const mainNav = document.getElementById('main-nav');
    const stickyNav = document.getElementById('sticky-nav');
    const stickyNavContainer = stickyNav.querySelector('div');

    // --- State Management ---
    let menu = [];
    let allCategories = [];

    // --- Main Function to Initialize the Menu ---
    async function initializeMenu() {
        try {
            const res = await fetch('/api/get-menu');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const allMenuItems = await res.json();
            
            // Filter out items with visibility set to False
            menu = allMenuItems.filter(item => item.visibility === "True");
            
            const categoryButtons = mainNav.querySelectorAll('.category-btn');
            allCategories = Array.from(categoryButtons).map(btn => ({
                id: btn.dataset.category,
                label: btn.querySelector('span').textContent,
                icon: btn.querySelector('img').src,
                alt: btn.querySelector('img').alt,
            }));
            
            // Set up all functionalities
            setupStickyNav();
            setupFiltering();
            displayItems(menu); 
            setupScrollAnimations();

            // Set the "All" button as active on initial load
            updateActiveButton('all');

        } catch (error) {
            console.error("Failed to fetch and initialize menu:", error);
            menuListContainer.innerHTML = `<p class="text-center text-red-400 col-span-full">Failed to load menu. Please try again later.</p>`;
        }
    }

    /**
     * Renders menu items into the container.
     * @param {Array} items - The array of menu items to display.
     */
    function displayItems(items) {
        menuListContainer.innerHTML = items.map((item, idx) => `
            <article data-index="${idx}"
                     class="flex items-center justify-between bg-white rounded-2xl shadow-lg overflow-hidden p-4
                            opacity-0 translate-y-8 transition-all duration-700 ease-out"
            >
                <div class="flex-grow text-right pr-4">
                    <h2 class="text-3xl font-bold mb-1 text-slate-800">
                        ${item.title}
                    </h2>

                    <span class="text-xl font-bold text-yellow-600">
                        ${item.price.toLocaleString()} تومان
                    </span>
                </div>

                <div class="w-32 h-32 md:w-36 md:h-36 flex-shrink-0">
                    <img src="${item.img}" alt="${item.title}"
                         class="w-full h-full object-contain"/>
                </div>
            </article>
        `).join('');
    }

    /**
     * Sets up IntersectionObserver for scroll-in animations.
     */
    function setupScrollAnimations() {
        const articles = menuListContainer.querySelectorAll('article');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const idx = Number(el.dataset.index);
                    el.style.transitionDelay = `${idx * 50}ms`;
                    el.classList.remove('opacity-0', 'translate-y-8');
                    el.classList.add('opacity-100', 'translate-y-0');
                    obs.unobserve(el);
                }
            });
        }, {
            rootMargin: '0px 0px -15% 0px',
            threshold: 0
        });

        articles.forEach(article => observer.observe(article));
    }

    /**
     * Populates the sticky navbar and sets up its visibility logic.
     */
    function setupStickyNav() {
        stickyNavContainer.innerHTML = allCategories.map(cat => `
            <button data-category="${cat.id}" aria-label="${cat.label}"
                    class="sticky-category-btn flex flex-row-reverse items-center gap-2 px-3 py-1.5
                           border rounded-lg transition border-yellow-600 bg-slate-700
                           text-gray-200 text-sm hover:bg-yellow-500 hover:text-white">
                <img src="${cat.icon}" alt="${cat.alt}" class="h-5 w-5 flex-shrink-0"/>
                <span>${cat.label}</span>
            </button>
        `).join('');
        
        const observer = new IntersectionObserver(([entry]) => {
            stickyNav.classList.toggle('hidden', entry.isIntersecting);
            stickyNav.classList.toggle('flex', !entry.isIntersecting);
        }, { threshold: 0 });

        observer.observe(mainNav);
    }
    
    /**
     * Updates the visual state of all category buttons to highlight the active one.
     * @param {string} activeCategory - The data-category value of the button to be activated.
     */
    function updateActiveButton(activeCategory) {
        const allButtons = document.querySelectorAll('.category-btn, .sticky-category-btn');
        allButtons.forEach(button => {
            if (button.dataset.category === activeCategory) {
                // Activate this button
                button.classList.add('bg-yellow-500', 'text-white');
                button.classList.remove('bg-slate-700', 'text-gray-200');
            } else {
                // Deactivate all other buttons
                button.classList.remove('bg-yellow-500', 'text-white');
                button.classList.add('bg-slate-700', 'text-gray-200');
            }
        });
    }

    /**
     * Attaches click event listeners to all category buttons for filtering.
     */
    function setupFiltering() {
        // We must select the buttons again here because the sticky nav buttons are created dynamically.
        const allButtons = document.querySelectorAll('.category-btn, .sticky-category-btn');

        allButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;

                // 1. Update the active button visuals
                updateActiveButton(category);
                
                // 2. Filter and display the menu items
                const filteredItems = category === 'all'
                    ? menu
                    : menu.filter(item => item.category === category);
                
                displayItems(filteredItems);
                
                // 3. Re-apply scroll animations to the new items
                setupScrollAnimations();
            });
        });
    }

    // --- Initial Call ---
    initializeMenu();
});