function toggleMode() {
  document.body.classList.toggle("dark-mode");
}

let heroIndex = 0;
const heroSlides = document.querySelectorAll(".hero-slide");

function showHero(index) {
  if (!heroSlides.length) return;
  heroSlides.forEach((slide) => slide.classList.remove("active"));
  heroSlides[index].classList.add("active");
}

function nextHero() {
  heroIndex = (heroIndex + 1) % heroSlides.length;
  showHero(heroIndex);
}

function prevHero() {
  heroIndex = (heroIndex - 1 + heroSlides.length) % heroSlides.length;
  showHero(heroIndex);
}

if (heroSlides.length) {
  setInterval(nextHero, 5000);
  showHero(heroIndex);
}

let cart = [];
let activeFilter = "all";
let currentCustomItem = null;
let latestReceipt = null;
let currentStoreSettings = {
  store_name: "Cafe Aroma",
  address: "Street 123, Riverside, Phnom Penh",
  receipt_footer: "Thank you for ordering from Cafe Aroma."
};
const isStaticSite = document.body?.dataset.staticSite === "true";

const cartItems = document.getElementById("cart-items");
const totalDisplay = document.getElementById("total");
const cartCount = document.getElementById("cart-count");
const emptyCart = document.getElementById("empty-cart");
const cartPopup = document.getElementById("cart-popup");
let menuItems = document.querySelectorAll(".menu-item");
const menuList = document.getElementById("menu-list");
const menuSearch = document.getElementById("menu-search");
const noResults = document.getElementById("no-results");
const customModal = document.getElementById("custom-modal");
const customForm = document.getElementById("custom-form");
const customTitle = document.getElementById("custom-title");
const customPrice = document.getElementById("custom-price");
const customTotal = document.getElementById("custom-total");
const paymentMethod = document.getElementById("payment-method");
const abaPayPanel = document.getElementById("aba-pay-panel");
const abaPayTotal = document.getElementById("aba-pay-total");
const receiptModal = document.getElementById("receipt-modal");
const receiptContent = document.getElementById("receipt-content");

attachCartButtons();
attachCustomizeButtons();

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    filterMenu();
  });
});

menuSearch?.addEventListener("input", filterMenu);

function filterMenu() {
  const searchTerm = menuSearch?.value.trim().toLowerCase() || "";
  let visibleCount = 0;

  menuItems.forEach((item) => {
    const matchesCategory = activeFilter === "all" || item.dataset.category === activeFilter;
    const itemText = item.textContent.toLowerCase();
    const itemName = item.dataset.name.toLowerCase();
    const matchesSearch = !searchTerm || itemText.includes(searchTerm) || itemName.includes(searchTerm);
    const isVisible = matchesCategory && matchesSearch;

    item.classList.toggle("hidden", !isVisible);
    if (isVisible) visibleCount += 1;
  });

  noResults?.classList.toggle("show", visibleCount === 0);
}

function attachCartButtons() {
  document.querySelectorAll(".add-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.name;
      const price = Number(button.dataset.price);
      addToCart({ name, price, options: ["Standard"] });
      flashButton(button, "Added");
    });
  });
}

function attachCustomizeButtons() {
  document.querySelectorAll(".customize-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openCustomize(button.dataset.name, Number(button.dataset.price), button.dataset.category);
    });
  });
}

function renderMenuItems(items) {
  if (!menuList || !Array.isArray(items)) return;

  menuList.innerHTML = items.map((item) => `
    <article class="menu-item" data-category="${item.category}" data-name="${item.name}">
      <img src="${item.image_url}" alt="${item.name}" class="menu-img">
      <div class="menu-copy">
        <span class="category">${item.label}</span>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
      <div class="menu-bottom">
        <strong>$${Number(item.price).toFixed(2)}</strong>
        <button class="customize-btn" type="button" data-name="${item.name}" data-price="${Number(item.price).toFixed(2)}" data-category="${item.category}">Customize</button>
      </div>
    </article>
  `).join("");

  menuItems = document.querySelectorAll(".menu-item");
  attachCustomizeButtons();
  filterMenu();
}

async function loadMenuItems() {
  if (!menuList) return;
  if (isStaticSite) {
    filterMenu();
    return;
  }

  try {
    const response = await fetch("/api/menu_items.php");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load menu items.");
    }

    renderMenuItems(result.items);
  } catch (error) {
    filterMenu();
  }
}

function flashButton(button, text) {
  const originalText = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = originalText;
  }, 900);
}

function addToCart(item) {
  const key = createCartKey(item.name, item.options);
  const existingItem = cart.find((entry) => entry.key === key);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ ...item, key, qty: 1 });
  }

  updateCart();
}

function createCartKey(name, options) {
  return `${name}|${options.join("|")}`;
}

function updateCart() {
  if (!cartItems || !totalDisplay || !cartCount) return;

  cartItems.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    count += item.qty;

    const li = document.createElement("li");
    li.className = "cart-line";
    li.innerHTML = `
      <div>
        <h3>${item.name}</h3>
        <p>${item.options.join(", ")}</p>
        <p>$${item.price.toFixed(2)} each</p>
        <div class="qty-controls" aria-label="Quantity controls for ${item.name}">
          <button type="button" onclick="changeQty(${index}, -1)" aria-label="Decrease ${item.name}">-</button>
          <strong>${item.qty}</strong>
          <button type="button" onclick="changeQty(${index}, 1)" aria-label="Increase ${item.name}">+</button>
        </div>
      </div>
      <div>
        <p class="line-price">$${(item.price * item.qty).toFixed(2)}</p>
        <button class="remove-item" type="button" onclick="removeItem(${index})" aria-label="Remove ${item.name}">&times;</button>
      </div>
    `;
    cartItems.appendChild(li);
  });

  totalDisplay.textContent = total.toFixed(2);
  cartCount.textContent = count;
  emptyCart?.classList.toggle("show", cart.length === 0);
  updateAbaPayPanel();
}

function changeQty(index, amount) {
  cart[index].qty += amount;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  updateCart();
}

function clearCart() {
  cart = [];
  updateCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateAbaPayPanel() {
  if (!abaPayPanel || !abaPayTotal || !paymentMethod) return;
  const isAbaPay = paymentMethod.value === "ABA Pay" && cart.length > 0;
  abaPayTotal.textContent = getCartTotal().toFixed(2);
  abaPayPanel.classList.toggle("show", isAbaPay);
}

paymentMethod?.addEventListener("change", updateAbaPayPanel);

function toggleCart() {
  if (!cartPopup) return;
  const isOpen = cartPopup.classList.toggle("open");
  cartPopup.setAttribute("aria-hidden", String(!isOpen));
}

function openCustomize(name, price, category) {
  if (!customModal || !customForm) return;

  currentCustomItem = { name, price, category };
  customForm.reset();
  customTitle.textContent = name;
  customPrice.textContent = `Base price $${price.toFixed(2)}`;
  customModal.classList.add("open");
  customModal.setAttribute("aria-hidden", "false");
  updateCustomTotal();
}

function closeCustomize() {
  customModal?.classList.remove("open");
  customModal?.setAttribute("aria-hidden", "true");
  currentCustomItem = null;
}

function getCheckedOption(name) {
  return customForm.querySelector(`input[name="${name}"]:checked`);
}

function getCustomSelection() {
  const size = getCheckedOption("size");
  const milk = getCheckedOption("milk");
  const sweetness = getCheckedOption("sweetness");
  const ice = getCheckedOption("ice");
  const addons = [...customForm.querySelectorAll('input[name="addon"]:checked')];

  const extra = [size, milk, ...addons].reduce((sum, input) => {
    return sum + Number(input?.dataset.extra || 0);
  }, 0);

  const addonText = addons.map((input) => input.value);
  const options = [
    size.value,
    milk.value,
    sweetness.value,
    ice.value,
    addonText.length ? addonText.join(" + ") : "No add-ons"
  ];

  return { extra, options };
}

function updateCustomTotal() {
  if (!currentCustomItem || !customTotal) return;
  const selection = getCustomSelection();
  const total = currentCustomItem.price + selection.extra;
  customTotal.textContent = `$${total.toFixed(2)}`;
}

customForm?.addEventListener("change", updateCustomTotal);

customForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentCustomItem) return;

  const selection = getCustomSelection();
  addToCart({
    name: currentCustomItem.name,
    price: currentCustomItem.price + selection.extra,
    options: selection.options
  });

  closeCustomize();
  if (!cartPopup?.classList.contains("open")) toggleCart();
});

async function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm && !checkoutForm.reportValidity()) return;

  const name = document.getElementById("customer-name")?.value.trim() || "Guest";
  const phone = document.getElementById("customer-phone")?.value.trim() || "";
  const pickup = document.getElementById("pickup-time")?.value || "ASAP";
  const payment = document.getElementById("payment-method")?.value || "Cash";

  if (isStaticSite) {
    const order = {
      id: `static-${Date.now()}`,
      customer: { name, phone },
      pickup,
      payment,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0),
      createdAt: new Date().toISOString()
    };

    latestReceipt = order;
    showReceipt(order);
    clearCart();
    checkoutForm?.reset();
    updateAbaPayPanel();
    toggleCart();
    return;
  }

  try {
    const response = await fetch("/api/orders.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customer: { name, phone },
        pickup,
        payment,
        items: cart
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to place order.");
    }

    latestReceipt = result.order;
    showReceipt(result.order);
    clearCart();
    checkoutForm?.reset();
    updateAbaPayPanel();
    toggleCart();
  } catch (error) {
    const message = error instanceof TypeError
      ? "Payment server is not running. Please start the PHP server and try again."
      : error.message || "Unable to place order. Please try again.";
    alert(message);
  }
}

function formatReceiptDate(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildReceiptHtml(order) {
  const paymentStatus = order.payment === "ABA Pay" ? "Paid by ABA Pay" : "Pay at pickup";
  const items = order.items.map((item) => `
    <tr>
      <td>
        <strong>${item.name}</strong>
        <span>${item.options.join(", ")}</span>
      </td>
      <td>${item.qty}</td>
      <td>$${Number(item.price).toFixed(2)}</td>
      <td>$${(Number(item.price) * Number(item.qty)).toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <div class="receipt-print">
      <div class="receipt-heading">
        <p class="eyebrow">${currentStoreSettings.store_name || "Cafe Aroma"}</p>
        <h2 id="receipt-title">Order Receipt</h2>
        <p>${currentStoreSettings.address || ""}</p>
      </div>
      <div class="receipt-meta">
        <span>Order</span><strong>${order.id.slice(0, 8).toUpperCase()}</strong>
        <span>Date</span><strong>${formatReceiptDate(order.createdAt)}</strong>
        <span>Customer</span><strong>${order.customer.name}</strong>
        <span>Phone</span><strong>${order.customer.phone}</strong>
        <span>Pickup</span><strong>${order.pickup}</strong>
        <span>Payment</span><strong>${order.payment}</strong>
        <span>Status</span><strong>${paymentStatus}</strong>
      </div>
      <table class="receipt-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>
      <div class="receipt-total">
        <span>Total Paid</span>
        <strong>$${Number(order.total).toFixed(2)}</strong>
      </div>
      <p class="receipt-note">${currentStoreSettings.receipt_footer || "Thank you for ordering from Cafe Aroma."}</p>
    </div>
  `;
}

function showReceipt(order) {
  if (!receiptModal || !receiptContent) return;
  receiptContent.innerHTML = buildReceiptHtml(order);
  receiptModal.classList.add("open");
  receiptModal.setAttribute("aria-hidden", "false");
}

function closeReceipt() {
  receiptModal?.classList.remove("open");
  receiptModal?.setAttribute("aria-hidden", "true");
}

function printReceipt() {
  if (!latestReceipt) return;
  const printWindow = window.open("", "_blank", "width=420,height=680");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cafe Aroma Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          .receipt-heading { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
          .eyebrow { color: #006241; font-weight: 800; text-transform: uppercase; }
          h2 { margin: 6px 0; }
          .receipt-meta { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 18px 0; }
          .receipt-meta span { color: #666; }
          .receipt-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px 0; text-align: left; vertical-align: top; }
          th:nth-child(n+2), td:nth-child(n+2) { text-align: right; }
          td span { display: block; color: #666; font-size: 12px; margin-top: 2px; }
          .receipt-total { display: flex; justify-content: space-between; margin-top: 18px; font-size: 18px; font-weight: 800; }
          .receipt-note { text-align: center; margin-top: 22px; color: #666; }
        </style>
      </head>
      <body>${buildReceiptHtml(latestReceipt)}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

updateCart();
filterMenu();
loadMenuItems();

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isStaticSite) {
      if (errorMsg) {
        errorMsg.textContent = "Admin login requires PHP and MySQL hosting.";
      }
      return;
    }

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
    const response = await fetch("/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid username or password.");
      }

      alert(result.message);
      window.location.href = "/HTML/Dashboard.html";
    } catch (error) {
      if (errorMsg) {
        errorMsg.textContent = error.message || "Login failed.";
      }
    }
  });
}

const dashboardForm = document.getElementById("menu-item-form");
const dashboardItems = document.getElementById("dashboard-items");
const dashboardMessage = document.getElementById("dashboard-message");
const dashboardCount = document.getElementById("dashboard-count");
const dashboardFormTitle = document.getElementById("dashboard-form-title");
const dashboardRecentOrders = document.getElementById("dashboard-recent-orders");
const dashboardLatestProducts = document.getElementById("dashboard-latest-products");
const dashboardOrders = document.getElementById("dashboard-orders");
const dashboardInvoices = document.getElementById("dashboard-invoices");
const storeSettingsForm = document.getElementById("store-settings-form");
const storeMessage = document.getElementById("store-message");
let dashboardOrderItems = [];

document.querySelectorAll(".dashboard-tab").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.dashboardTab;
    document.querySelectorAll(".dashboard-tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".dashboard-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.dashboardPanel === target);
    });
    button.classList.add("active");
  });
});

function getDashboardPayload() {
  return {
    id: Number(document.getElementById("dashboard-item-id")?.value || 0),
    name: document.getElementById("dashboard-name")?.value.trim() || "",
    category: document.getElementById("dashboard-category")?.value || "hot",
    label: document.getElementById("dashboard-label")?.value.trim() || "",
    price: Number(document.getElementById("dashboard-price")?.value || 0),
    image_url: document.getElementById("dashboard-image")?.value.trim() || "/img/png-01.jpg",
    description: document.getElementById("dashboard-description")?.value.trim() || "",
    is_active: document.getElementById("dashboard-active")?.checked ? 1 : 0
  };
}

function setDashboardMessage(message, isError = false) {
  if (!dashboardMessage) return;
  dashboardMessage.textContent = message;
  dashboardMessage.classList.toggle("error", isError);
}

function showStaticDashboardState() {
  const message = "Live dashboard data requires PHP and MySQL hosting. GitHub Pages can show the public website, but it cannot run admin data.";
  setDashboardMessage(message, true);
  if (storeMessage) storeMessage.textContent = message;
  if (dashboardRecentOrders) dashboardRecentOrders.innerHTML = '<p class="dashboard-empty">Orders need PHP and MySQL hosting.</p>';
  if (dashboardLatestProducts) dashboardLatestProducts.innerHTML = '<p class="dashboard-empty">Products need PHP and MySQL hosting.</p>';
  if (dashboardItems) dashboardItems.innerHTML = '<p class="dashboard-empty">Product editing needs PHP and MySQL hosting.</p>';
  if (dashboardOrders) dashboardOrders.innerHTML = '<p class="dashboard-empty">Order management needs PHP and MySQL hosting.</p>';
  if (dashboardInvoices) dashboardInvoices.innerHTML = '<p class="dashboard-empty">Invoice history needs PHP and MySQL hosting.</p>';
}

function resetDashboardForm() {
  dashboardForm?.reset();
  const idInput = document.getElementById("dashboard-item-id");
  if (idInput) idInput.value = "";
  const activeInput = document.getElementById("dashboard-active");
  if (activeInput) activeInput.checked = true;
  if (dashboardFormTitle) dashboardFormTitle.textContent = "Add item";
  setDashboardMessage("");
}

function editDashboardItem(item) {
  document.getElementById("dashboard-item-id").value = item.id;
  document.getElementById("dashboard-name").value = item.name;
  document.getElementById("dashboard-category").value = item.category;
  document.getElementById("dashboard-label").value = item.label;
  document.getElementById("dashboard-price").value = Number(item.price).toFixed(2);
  document.getElementById("dashboard-image").value = item.image_url;
  document.getElementById("dashboard-description").value = item.description;
  document.getElementById("dashboard-active").checked = Number(item.is_active) === 1;
  if (dashboardFormTitle) dashboardFormTitle.textContent = "Edit item";
  setDashboardMessage("");
}

function renderDashboardItems(items) {
  if (!dashboardItems) return;
  if (dashboardCount) dashboardCount.textContent = items.length;
  const productStat = document.getElementById("stat-products");
  if (productStat) productStat.textContent = items.length;

  if (!items.length) {
    dashboardItems.innerHTML = '<p class="dashboard-empty">No menu items yet.</p>';
    return;
  }

  dashboardItems.innerHTML = items.map((item) => `
    <article class="dashboard-item">
      <img src="${item.image_url}" alt="${item.name}">
      <div>
        <div class="dashboard-item-title">
          <h3>${item.name}</h3>
          <span>$${Number(item.price).toFixed(2)}</span>
        </div>
        <p>${item.description}</p>
        <small>${item.label} - ${Number(item.is_active) === 1 ? "Visible" : "Hidden"}</small>
        <div class="dashboard-item-actions">
          <button class="clear-btn" type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="clear-btn danger-btn" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </div>
    </article>
  `).join("");

  dashboardItems.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);
      const item = items.find((entry) => Number(entry.id) === id);

      if (button.dataset.action === "edit" && item) {
        editDashboardItem(item);
        return;
      }

      if (button.dataset.action === "delete") {
        await deleteDashboardItem(id);
      }
    });
  });

  if (dashboardLatestProducts) {
    dashboardLatestProducts.innerHTML = items.slice(0, 4).map((item) => `
      <article class="dashboard-mini-row">
        <img src="${item.image_url}" alt="${item.name}">
        <div>
          <strong>${item.name}</strong>
          <span>$${Number(item.price).toFixed(2)} - ${item.label}</span>
        </div>
      </article>
    `).join("");
  }
}

async function loadDashboardItems() {
  if (!dashboardItems) return;

  try {
    const response = await fetch("/api/menu_items.php?all=1");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load dashboard items.");
    }

    renderDashboardItems(result.items);
  } catch (error) {
    setDashboardMessage(error.message || "Unable to load dashboard items.", true);
  }
}

function orderToReceiptOrder(order) {
  return {
    id: order.order_code,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone
    },
    pickup: order.pickup_time,
    payment: order.payment_method,
    items: order.items || [],
    total: Number(order.total),
    status: order.status,
    createdAt: order.created_at
  };
}

function renderOrderList(target, orders, compact = false) {
  if (!target) return;

  if (!orders.length) {
    target.innerHTML = '<p class="dashboard-empty">No orders yet.</p>';
    return;
  }

  target.innerHTML = orders.map((order) => `
    <article class="dashboard-order ${compact ? "compact-order" : ""}">
      <div class="dashboard-order-main">
        <div>
          <strong>${order.order_code.slice(0, 8).toUpperCase()}</strong>
          <span>${order.customer_name} - ${order.customer_phone}</span>
        </div>
        <div>
          <strong>$${Number(order.total).toFixed(2)}</strong>
          <span>${order.payment_method} - ${order.pickup_time}</span>
        </div>
      </div>
      <div class="dashboard-order-items">
        ${(order.items || []).map((item) => `<span>${item.qty}x ${item.name}</span>`).join("")}
      </div>
      <div class="dashboard-order-actions">
        <select data-order-status="${order.id}">
          ${["received", "preparing", "ready", "completed", "cancelled"].map((status) => `
            <option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>
          `).join("")}
        </select>
        <button class="clear-btn" type="button" data-print-invoice="${order.id}">Print Invoice</button>
      </div>
    </article>
  `).join("");
}

function renderDashboardOrders(orders) {
  dashboardOrderItems = orders;
  const orderStat = document.getElementById("stat-orders");
  const revenueStat = document.getElementById("stat-revenue");
  const pendingStat = document.getElementById("stat-pending");
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const pending = orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length;

  if (orderStat) orderStat.textContent = orders.length;
  if (revenueStat) revenueStat.textContent = revenue.toFixed(2);
  if (pendingStat) pendingStat.textContent = pending;

  renderOrderList(dashboardOrders, orders);
  renderOrderList(dashboardInvoices, orders);
  renderOrderList(dashboardRecentOrders, orders.slice(0, 3), true);

  document.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", () => updateDashboardOrderStatus(Number(select.dataset.orderStatus), select.value));
  });

  document.querySelectorAll("[data-print-invoice]").forEach((button) => {
    button.addEventListener("click", () => printDashboardInvoice(Number(button.dataset.printInvoice)));
  });
}

async function loadDashboardOrders() {
  if (!dashboardOrders && !dashboardRecentOrders && !dashboardInvoices) return;

  try {
    const response = await fetch("/api/orders.php");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load orders.");
    }

    renderDashboardOrders(result.orders || []);
  } catch (error) {
    setDashboardMessage(error.message || "Unable to load orders.", true);
  }
}

async function updateDashboardOrderStatus(id, status) {
  try {
    const response = await fetch("/api/orders.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to update order.");
    }

    loadDashboardOrders();
  } catch (error) {
    alert(error.message || "Unable to update order.");
  }
}

function printDashboardInvoice(id) {
  const order = dashboardOrderItems.find((entry) => Number(entry.id) === id);
  if (!order) return;
  latestReceipt = orderToReceiptOrder(order);
  printReceipt();
}

async function loadStoreSettings() {
  try {
    const response = await fetch("/api/store_settings.php");
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to load store settings.");
    }

    currentStoreSettings = { ...currentStoreSettings, ...result.settings };

    if (!storeSettingsForm) return;

    document.getElementById("store-name").value = result.settings.store_name || "";
    document.getElementById("store-address").value = result.settings.address || "";
    document.getElementById("store-phone").value = result.settings.phone || "";
    document.getElementById("store-hours").value = result.settings.hours || "";
    document.getElementById("store-receipt-footer").value = result.settings.receipt_footer || "";
  } catch (error) {
    if (storeMessage) storeMessage.textContent = error.message || "Unable to load store settings.";
  }
}

function refreshDashboard() {
  if (isStaticSite) {
    showStaticDashboardState();
    return;
  }

  loadDashboardItems();
  loadDashboardOrders();
  loadStoreSettings();
}

async function deleteDashboardItem(id) {
  if (!id || !confirm("Delete this menu item?")) return;

  try {
    const response = await fetch("/api/menu_items.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to delete item.");
    }

    setDashboardMessage(result.message);
    loadDashboardItems();
  } catch (error) {
    setDashboardMessage(error.message || "Unable to delete item.", true);
  }
}

dashboardForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isStaticSite) {
    showStaticDashboardState();
    return;
  }

  const payload = getDashboardPayload();
  const isEditing = payload.id > 0;

  try {
    const response = await fetch("/api/menu_items.php", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save menu item.");
    }

    setDashboardMessage(result.message);
    resetDashboardForm();
    loadDashboardItems();
  } catch (error) {
    setDashboardMessage(error.message || "Unable to save menu item.", true);
  }
});

storeSettingsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isStaticSite) {
    showStaticDashboardState();
    return;
  }

  const payload = {
    store_name: document.getElementById("store-name")?.value.trim() || "",
    address: document.getElementById("store-address")?.value.trim() || "",
    phone: document.getElementById("store-phone")?.value.trim() || "",
    hours: document.getElementById("store-hours")?.value.trim() || "",
    receipt_footer: document.getElementById("store-receipt-footer")?.value.trim() || ""
  };

  try {
    const response = await fetch("/api/store_settings.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save store settings.");
    }

    if (storeMessage) storeMessage.textContent = result.message;
  } catch (error) {
    if (storeMessage) storeMessage.textContent = error.message || "Unable to save store settings.";
  }
});

refreshDashboard();
