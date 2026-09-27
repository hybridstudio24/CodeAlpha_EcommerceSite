/* ==========================================================================
   Foliage — storefront behavior (wired to Django backend)
   Endpoints:
     GET  /api/products/    -> list of products
     POST /api/checkout/    -> { email, items: [{id, qty}] }
     POST /api/newsletter/  -> { email }
   ========================================================================== */

(function () {
  "use strict";

  const currency = (n) => `$${n.toFixed(2)}`;

  /* --------------------------- CSRF helper (Django) ------------------------- */
  // Reads the csrftoken cookie that Django sets via @ensure_csrf_cookie on the
  // index view, so POST requests pass Django's CSRF check.
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  }
  const csrftoken = () => getCookie("csrftoken");

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken(),
      },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  /* --------------------------------- State -------------------------------------- */
  let PRODUCTS = []; // populated from the backend
  let cart = []; // [{ id, name, price, qty }]

  /* ------------------------------ DOM references -------------------------------- */
  const productGrid = document.getElementById("productGrid");
  const cartDrawer = document.getElementById("cartDrawer");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartItems = document.getElementById("cartItems");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartCount = document.getElementById("cartCount");
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const searchToggle = document.getElementById("searchToggle");
  const searchBar = document.getElementById("searchBar");
  const searchClose = document.getElementById("searchClose");
  const newsletterForm = document.getElementById("newsletterForm");
  const newsletterMsg = document.getElementById("newsletterMsg");

  const leafIcon = () =>
    `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
       <path d="M4 20C4 11 11 4 20 4C20 13 13 20 4 20Z" fill="currentColor" opacity="0.55"/>
       <path d="M4 20C9 15 13 11 18 6" stroke="currentColor" stroke-width="1.3"/>
     </svg>`;

  /* ------------------------------ Render products -------------------------------- */
  function renderProducts(products) {
    if (products.length === 0) {
      productGrid.innerHTML = `<p class="cart-empty">No products yet — add some in the Django admin.</p>`;
      return;
    }
    productGrid.innerHTML = products
      .map(
        (p) => `
      <div class="product-card">
        <div class="product-image">
          <div class="fallback-icon">${leafIcon()}</div>
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
          <button class="product-add" data-add="${p.id}" aria-label="Add ${p.name} to cart">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <p class="product-name">${p.name}</p>
        <p class="product-meta">${p.meta}</p>
        <p class="product-price">${currency(p.price)}</p>
      </div>`
      )
      .join("");
  }

  async function loadProducts() {
    try {
      const res = await fetch("/api/products/");
      PRODUCTS = await res.json();
      renderProducts(PRODUCTS);
    } catch (err) {
      productGrid.innerHTML = `<p class="cart-empty">Couldn't load products. Is the Django server running?</p>`;
      console.error(err);
    }
  }

  /* ---------------------------------- Cart ---------------------------------------- */
  function addToCart(id) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    renderCart();
    openCart();
  }

  function changeQty(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
    renderCart();
  }

  function removeFromCart(id) {
    cart = cart.filter((i) => i.id !== id);
    renderCart();
  }

  function renderCart() {
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = cart.reduce((sum, i) => sum + i.qty * i.price, 0);

    cartCount.textContent = totalQty;
    cartSubtotal.textContent = currency(subtotal);

    if (cart.length === 0) {
      cartItems.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
      return;
    }

    cartItems.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-line">
        <div class="cart-line-thumb">${leafIcon()}</div>
        <div>
          <p class="cart-line-name">${item.name}</p>
          <div class="cart-line-qty">
            <button class="qty-btn" data-qty-down="${item.id}" aria-label="Decrease quantity">–</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-qty-up="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <span class="cart-line-price">${currency(item.qty * item.price)}</span>
        <button class="cart-line-remove" data-remove="${item.id}">Remove</button>
      </div>`
      )
      .join("");
  }

  function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.getElementById("cartToggle").setAttribute("aria-expanded", "true");
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.getElementById("cartToggle").setAttribute("aria-expanded", "false");
  }

  async function checkout() {
    if (cart.length === 0) return;
    const items = cart.map((i) => ({ id: i.id, qty: i.qty }));
    try {
      const result = await postJSON("/api/checkout/", { items });
      cart = [];
      renderCart();
      closeCart();
      alert(`Order #${result.order_id} placed — total ${currency(result.total)}.`);
    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
    }
  }

  /* --------------------------------- Events ---------------------------------------- */
  productGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (btn) addToCart(btn.dataset.add);
  });

  cartItems.addEventListener("click", (e) => {
    const up = e.target.closest("[data-qty-up]");
    const down = e.target.closest("[data-qty-down]");
    const remove = e.target.closest("[data-remove]");
    if (up) changeQty(up.dataset.qtyUp, 1);
    if (down) changeQty(down.dataset.qtyDown, -1);
    if (remove) removeFromCart(remove.dataset.remove);
  });

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn").addEventListener("click", checkout);

  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  searchToggle.addEventListener("click", () => {
    const isOpen = searchBar.classList.toggle("open");
    searchToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) searchBar.querySelector("input").focus();
  });
  searchClose.addEventListener("click", () => {
    searchBar.classList.remove("open");
    searchToggle.setAttribute("aria-expanded", "false");
  });

  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value;
    try {
      await postJSON("/api/newsletter/", { email });
      newsletterMsg.textContent = `Thanks — we'll send updates to ${email}.`;
      newsletterForm.reset();
    } catch (err) {
      newsletterMsg.textContent = `Something went wrong: ${err.message}`;
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------------------------------- Init ----------------------------------------- */
  loadProducts();
  renderCart();
})();
