let cart = JSON.parse(localStorage.getItem("cart")) || []
const cartList = document.getElementById("cartList")
const totalPrice = document.getElementById("totalPrice")
const checkoutLink = document.getElementById("checkoutLink")

function renderCart() {
  let total = 0
  if (!cart.length) {
    cartList.innerHTML = `
          <p class="empty-cart">
            ยังไม่มีสินค้าในตะกร้า
          </p>
        `
    totalPrice.textContent = "0"
    checkoutLink.style.display = "none"
    return
  }
  checkoutLink.style.display = "inline"
  cartList.innerHTML = cart
    .map((item) => {
      const subtotal = Number(item.price) * Number(item.qty)
      total += subtotal
      return `
          <div class="cart-item">

            <img
              src="${item.img}"
              alt="${item.name}"
            >

            <div class="cart-info">

              <h3>${item.name}</h3>

              <p>
                ราคา:
                ${Number(item.price).toLocaleString()}
                บาท
              </p>

              <div class="quantity-control">

                <button
                  onclick="decreaseQty('${item.id}')"
                >
                  -
                </button>

                <span>${item.qty}</span>

                <button
                  onclick="increaseQty('${item.id}')"
                >
                  +
                </button>

              </div>

              <p>
                รวม:
                ${subtotal.toLocaleString()}
                บาท
              </p>

              <button
                class="remove-btn"
                onclick="removeItem('${item.id}')"
              >
                ลบสินค้า
              </button>

            </div>

          </div>
        `
    })
    .join("")
  totalPrice.textContent = total.toLocaleString()
}

function increaseQty(id) {
  const item = cart.find((item) => item.id === id)
  if (!item) return
  item.qty++
  saveCart()
}

function decreaseQty(id) {
  const item = cart.find((item) => item.id === id)
  if (!item) return
  item.qty--
  if (item.qty <= 0) {
    cart = cart.filter((item) => item.id !== id)
  }
  saveCart()
}

function removeItem(id) {
  cart = cart.filter((item) => item.id !== id)
  saveCart()
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart))
  renderCart()
}

renderCart()
