let token = null;
const loginContainer = document.getElementById('login-container');
const dashboard      = document.getElementById('dashboard');
const errorMsg       = document.getElementById('login-error');
const modal          = document.getElementById('modal');
const form           = document.getElementById('item-form');
const titleEl        = document.getElementById('modal-title');
const tbody          = document.getElementById('menu-rows');

// Display login errors
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
    if (!res.ok) throw new Error('Login failed');
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
      <tr data-id="${item.id}"
          data-img="${item.img || ''}"
          data-description="${item.description || ''}">
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${item.price}</td>
        <td class="space-x-2 rtl:space-x-reverse">
          <button class="edit text-blue-600 hover:underline">ویرایش</button>
          <button class="delete text-red-600 hover:underline">حذف</button>
        </td>
      </tr>`).join('');
    attachRowEvents();
  } catch (e) {
    console.error('Error loading menu:', e);
  }
}

// ATTACH EVENTS
function attachRowEvents() {
  tbody.querySelectorAll('.edit').forEach(btn =>
    btn.onclick = e => openModal('Edit', +e.target.closest('tr').dataset.id)
  );
  tbody.querySelectorAll('.delete').forEach(btn =>
    btn.onclick = async e => {
      const id = +e.target.closest('tr').dataset.id;
      await fetch(`/api/delete-menu/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadMenu();
    }
  );
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
    form.description.value = row.dataset.description;
  }

  modal.classList.remove('hidden');
}

// CANCEL
document.getElementById('cancel').onclick = () => {
  modal.classList.add('hidden');
};

// SUBMIT (CREATE/UPDATE)
form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.price = +data.price;             // required
  // allow img/description optional

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
    if (!res.ok) throw new Error(result.error || 'Failed to save');
    modal.classList.add('hidden');
    loadMenu();
  } catch (err) {
    console.error('Save error:', err);
    alert('خطا در ذخیره‌سازی: ' + err.message);
  }
};

// ADD ITEM BUTTON
document.getElementById('add-item').onclick = () => {
  openModal('Add');
};
