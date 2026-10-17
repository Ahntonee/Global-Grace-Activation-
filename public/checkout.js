(function () {
  const cart = window.ggaCart.getCart();
  const form = document.getElementById("checkout-form");
  const summaryEl = document.getElementById("checkout-summary");
  const totalEl = document.getElementById("checkout-total");
  const shippingFields = document.getElementById("shipping-fields");
  const errorBox = document.getElementById("checkout-error");

  if (!form) return;

  if (!cart.length) {
    window.location.href = "/cart";
    return;
  }

  const requiresShipping = cart.some((i) => i.type === "physical");
  if (requiresShipping) shippingFields.style.display = "block";

  const SHIPPING_FEE_DISPLAY = 2500; // mirrors src/config/shipping.js — display only, server recalculates
  const subtotal = window.ggaCart.cartSubtotal(cart);
  const shippingFee = requiresShipping ? SHIPPING_FEE_DISPLAY : 0;
  const total = subtotal + shippingFee;

  summaryEl.innerHTML =
    cart
      .map((i) => `<div style="display:flex; justify-content:space-between;"><span>${i.name} &times; ${i.quantity}</span><span>${window.ggaCart.fmtNaira(i.price * i.quantity)}</span></div>`)
      .join("") +
    (requiresShipping
      ? `<div style="display:flex; justify-content:space-between; color:var(--mist);"><span>Shipping</span><span>${window.ggaCart.fmtNaira(shippingFee)}</span></div>`
      : "");
  totalEl.textContent = window.ggaCart.fmtNaira(total);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const data = Object.fromEntries(new FormData(form).entries());
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    const payload = {
      customer: { fullName: data.fullName, email: data.email, phone: data.phone },
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      paymentProvider: data.paymentProvider,
    };

    if (requiresShipping) {
      payload.shippingAddress = {
        fullName: data.fullName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        phone: data.phone,
      };
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || "Checkout failed");
      }

      sessionStorage.removeItem("gga_cart");
      window.location.href = body.checkoutUrl;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      submitBtn.disabled = false;
    }
  });
})();
