/* ============================================================
   Client-side cart — sessionStorage-backed, no login required.
   Shared by product-detail, cart, and checkout pages.
   ============================================================ */
(function () {
  const STORAGE_KEY = "gga_cart";

  function getCart() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find((i) => i.productId === item.productId);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push({ ...item, quantity: item.quantity || 1 });
    }
    saveCart(cart);
    return cart;
  }

  function setQuantity(productId, quantity) {
    let cart = getCart();
    if (quantity <= 0) {
      cart = cart.filter((i) => i.productId !== productId);
    } else {
      const item = cart.find((i) => i.productId === productId);
      if (item) item.quantity = quantity;
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(productId) {
    return setQuantity(productId, 0);
  }

  function cartSubtotal(cart) {
    return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function fmtNaira(n) {
    return "₦" + Number(n).toLocaleString();
  }

  // Generic "Add to Cart" button wiring — works on any page that includes
  // this script and has buttons matching .js-add-to-cart with data-* attrs.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-add-to-cart");
    if (!btn) return;

    addToCart({
      productId: btn.getAttribute("data-product-id"),
      slug: btn.getAttribute("data-slug"),
      name: btn.getAttribute("data-name"),
      price: Number(btn.getAttribute("data-price")),
      type: btn.getAttribute("data-type"),
      image: btn.getAttribute("data-image") || "",
    });

    const original = btn.textContent;
    btn.textContent = window.ggaT("cartAdded", "Added ✓");
    setTimeout(() => (btn.textContent = original), 1400);
  });

  // Renders the cart page (#cart-items / #cart-subtotal) — called explicitly
  // from cart.ejs since it needs to run after the DOM for those elements exists.
  window.renderCartPage = function () {
    const container = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("cart-subtotal");
    const checkoutBtn = document.getElementById("cart-checkout-btn");
    if (!container) return;

    const cart = getCart();

    if (!cart.length) {
      container.innerHTML = '<p style="color:var(--mist);">' + ggaH('cartEmpty', 'Your cart is empty.') + ' <a href="/shop">' + ggaH('cartBrowse', 'Browse the shop') + '</a>.</p>';
      subtotalEl.textContent = fmtNaira(0);
      if (checkoutBtn) checkoutBtn.style.pointerEvents = "none", (checkoutBtn.style.opacity = ".5");
      return;
    }

    container.innerHTML = cart
      .map(
        (item) => `
      <div class="card" style="display:flex; gap:16px; padding:16px; align-items:center;">
        <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex:none;background:linear-gradient(155deg,#ecfdf5,#f0fdf4);">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">` : ""}
        </div>
        <div style="flex:1;">
          <strong style="display:block; margin-bottom:4px;">${item.name}</strong>
          <span style="font-size:12.5px; color:var(--mist); text-transform:capitalize;">${item.type.replace("-", " ")}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-sm btn-outline-dark" data-qty-down="${item.productId}">&minus;</button>
          <span style="min-width:20px; text-align:center;">${item.quantity}</span>
          <button type="button" class="btn btn-sm btn-outline-dark" data-qty-up="${item.productId}">+</button>
        </div>
        <div style="font-family:'Space Mono',monospace; font-weight:700; color:var(--flame-dim); min-width:90px; text-align:right;">
          ${fmtNaira(item.price * item.quantity)}
        </div>
        <button type="button" class="btn btn-sm btn-outline-dark" data-remove="${item.productId}">${ggaH('cartRemove', 'Remove')}</button>
      </div>
    `
      )
      .join("");

    subtotalEl.textContent = fmtNaira(cartSubtotal(cart));

    container.querySelectorAll("[data-qty-up]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-qty-up");
        const item = getCart().find((i) => i.productId === id);
        setQuantity(id, (item ? item.quantity : 0) + 1);
        window.renderCartPage();
      })
    );
    container.querySelectorAll("[data-qty-down]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-qty-down");
        const item = getCart().find((i) => i.productId === id);
        setQuantity(id, (item ? item.quantity : 1) - 1);
        window.renderCartPage();
      })
    );
    container.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => {
        removeFromCart(b.getAttribute("data-remove"));
        window.renderCartPage();
      })
    );
  };

  window.ggaCart = { getCart, saveCart, addToCart, setQuantity, removeFromCart, cartSubtotal, fmtNaira };
})();
