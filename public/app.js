const container = document.getElementById('menu-list');
const buttons = document.querySelectorAll('.category-btn');
let menu = [];

// 1. Fetch & render
async function fetchMenu() {
  const res = await fetch('/api/get-menu');
  menu = await res.json();
  displayItems(menu);
  setupScrollAnimations();
}

// 2. Render items with initial hidden state & data-index
function displayItems(items) {
  container.innerHTML = items.map((item, idx) => `
    <article data-index="${idx}"
             class="group relative bg-[#f9dab7] rounded-2xl overflow-hidden shadow-md
                    opacity-0 translate-y-8 transition-all duration-700 ease-out flex flex-col"
    >
      <!-- Image with overlay -->
      <div class="relative w-full h-48 overflow-hidden">
        <img src="${item.img}" alt="${item.title}"
             class="w-full h-full object-cover transform 
                    group-hover:scale-105 transition-transform duration-500"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-40 pointer-events-none"></div>
        <span class="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600
                      text-white text-base font-semibold uppercase px-3 py-1 rounded-full drop-shadow-lg">
          ${item.category}
        </span>
      </div>
      <!-- Content -->
      <div class="p-5 flex flex-col flex-grow">
        <h2 class="text-3xl font-bold mb-1 text-[#5a5549] group-hover:text-yellow-600 transition-colors duration-300">
          ${item.title}
        </h2>
        <p class="text-2xl text-gray-500 flex-grow mb-4 line-clamp-3">
          ${item.description}
        </p>
        <div class="flex items-center justify-between mt-auto">
          <span class="text-lg font-extrabold text-yellow-500">
            ${item.price.toLocaleString()} تومان
          </span>
        </div>
      </div>
    </article>
  `).join('');
}

// 3. Scroll animations using IntersectionObserver
function setupScrollAnimations() {
  const articles = container.querySelectorAll('article');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const idx = Number(el.dataset.index);
        // Stagger by 100ms per item
        el.style.transitionDelay = `${idx * 100}ms`;
        el.classList.remove('opacity-0', 'translate-y-8');
        el.classList.add('opacity-100', 'translate-y-0');
        obs.unobserve(el);
      }
    });
  }, {
    rootMargin: '0px 0px -20% 0px', // trigger a bit before fully in view
    threshold: 0
  });

  articles.forEach(article => observer.observe(article));
}

// 4. Category filtering
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.category;
    const filtered = cat === 'all'
      ? menu
      : menu.filter(i => i.category === cat);
    displayItems(filtered);
    setupScrollAnimations();
  });
});

document.addEventListener('DOMContentLoaded', fetchMenu);
