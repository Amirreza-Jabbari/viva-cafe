let token = null;
const loginContainer = document.getElementById('login-container');
const dashboard      = document.getElementById('dashboard');
const errorMsg       = document.getElementById('login-error');
const modal          = document.getElementById('modal');
const form           = document.getElementById('item-form');
const titleEl        = document.getElementById('modal-title');
const tbody          = document.getElementById('menu-rows');
const notification   = document.getElementById('notification');

// Helper to show green toast for 5s
function showNotification(msg) {
  notification.textContent = msg;
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

// Show login errors
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

// LOGIN
document.getElementById('login-btn').addEventListener('click', async () => {
  const pw = document.getElementById('pw').value.trim();
  if (!pw) return showError('لطفا رمز عبور را وارد کنید');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    if (!res.ok) throw new Error();
    token = (await res.json()).token;
    loginContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadMenu();
  } catch {
    showError('رمز عبور اشتباه است');
  }
});

// LOAD MENU
async function loadMenu() {
  try {
    const res = await fetch('/api/get-menu', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const menu = await res.json();
    tbody.innerHTML = menu.map(item => `
      <tr data-id="${item.id}" data-img="${item.img || ''}" data-visibility="${item.visibility || 'True'}">
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${item.price}</td>
        <td>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="visibility-toggle sr-only peer" ${String(item.visibility).toLowerCase() === 'true' ? 'checked' : ''}>
            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:-translate-x-full"></div>
          </label>
        </td>
        <td class="space-x-2 rtl:space-x-reverse">
          <button class="edit text-blue-600 hover:underline">ویرایش</button>
          <button class="delete text-red-600 hover:underline">حذف</button>
        </td>
      </tr>
    `).join('');
    attachRowEvents();
  } catch (e) {
    console.error('Error loading menu:', e);
  }
}

// ATTACH EDIT & DELETE EVENTS
function attachRowEvents() {
  tbody.querySelectorAll('.edit').forEach(btn =>
    btn.onclick = e => openModal('Edit', +e.target.closest('tr').dataset.id)
  );
  tbody.querySelectorAll('.delete').forEach(btn =>
    btn.onclick = async e => {
      const id = +e.target.closest('tr').dataset.id;
      try {
        const res = await fetch(`/api/delete-menu?id=${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        showNotification(`آیتم #${id} با موفقیت حذف شد`);
        loadMenu();
      } catch (err) {
        console.error('Delete error:', err);
        alert('خطا در حذف آیتم');
      }
    }
  );
  
  // Add event listener for visibility toggles
  tbody.querySelectorAll('.visibility-toggle').forEach(toggle => {
    toggle.onchange = async e => {
      const row = e.target.closest('tr');
      const id = +row.dataset.id;
      const newVisibility = e.target.checked ? "True" : "False";
      
      try {
        // Get current item data
        const title = row.children[1].textContent;
        const category = row.children[2].textContent;
        const price = row.children[3].textContent;
        const img = row.dataset.img;
        
        // Update the item with new visibility
        const res = await fetch('/api/update-menu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id,
            title,
            category,
            price: +price,
            img,
            visibility: newVisibility
          })
        });
        
        if (!res.ok) throw new Error();
        
        // Update the row's data attribute
        row.dataset.visibility = newVisibility;
        
        showNotification(`وضعیت نمایش آیتم #${id} به ${newVisibility === "True" ? "فعال" : "غیرفعال"} تغییر کرد`);
      } catch (err) {
        console.error('Visibility toggle error:', err);
        alert('خطا در تغییر وضعیت نمایش');
        // Revert the toggle state if there was an error
        e.target.checked = !e.target.checked;
      }
    };
  });
}

// OPEN MODAL
function openModal(mode, id = null) {
  titleEl.textContent = mode === 'Add' ? 'افزودن آیتم' : 'ویرایش آیتم';
  form.reset();
  form.id.value = id || '';
  if (id) {
    const row = tbody.querySelector(`tr[data-id="${id}"]`);
    form.title.value       = row.children[1].textContent;
    form.category.value    = row.children[2].textContent;
    form.price.value       = row.children[3].textContent;
    form.img.value         = row.dataset.img;
    form.visibility.value  = row.dataset.visibility || "True";
  }
  modal.classList.remove('hidden');
}

// CANCEL BUTTON
document.getElementById('cancel').onclick = () => {
  modal.classList.add('hidden');
};

// SUBMIT (CREATE/UPDATE)
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.price = +data.price; // coerce
  try {
    const res = await fetch('/api/update-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Save failed');
    modal.classList.add('hidden');
    if (data.id) {
      showNotification(`آیتم #${data.id} با موفقیت ویرایش شد`);
    } else {
      showNotification('آیتم جدید با موفقیت اضافه شد');
    }
    loadMenu();
  } catch (err) {
    console.error('Save error:', err);
    alert('خطا در ذخیره‌سازی');
  }
};

// ADD ITEM BUTTON
document.getElementById('add-item').onclick = () => {
  openModal('Add');
};
