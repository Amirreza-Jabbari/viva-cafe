const container = document.getElementById('menu-list');
const buttons = document.querySelectorAll('.category-btn');
let menu = [];

async function fetchMenu() {
  const res = await fetch('/api/get-menu');
  menu = await res.json();
  displayItems(menu);
}

function displayItems(items) {
  container.innerHTML = items.map(item => `
    <article 
      class="group relative bg-[#f9dab7] rounded-2xl overflow-hidden shadow-md 
             hover:shadow-xl transition-shadow duration-300 flex flex-col"
    >
      <!-- Image with overlay -->
      <div class="relative w-full h-48 overflow-hidden">
        <img 
          src="${item.img}" 
          alt="${item.title}" 
          class="w-full h-full object-cover transform 
                 group-hover:scale-105 transition-transform duration-500" 
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent 
                    opacity-40 pointer-events-none"></div>
        <span 
          class="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600 
                 text-white text-xs font-semibold uppercase px-3 py-1 rounded-full 
                 drop-shadow-lg"
        >
          ${item.category}
        </span>
      </div>

      <!-- Content -->
      <div class="p-5 flex flex-col flex-grow">
        <h2 class="text-xl font-bold mb-1 text-[#5a5549] group-hover:text-yellow-600 
                   transition-colors duration-300"
        >
          ${item.title}
        </h2>
        <p class="text-sm text-gray-500 flex-grow mb-4 line-clamp-3">
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

buttons.forEach(btn => btn.addEventListener('click', () => {
  const cat = btn.dataset.category;
  displayItems(cat === 'all' ? menu : menu.filter(i => i.category === cat));
}));

document.addEventListener('DOMContentLoaded', fetchMenu);
