let cart = JSON.parse(localStorage.getItem("cart")) || []

function addToCart(id) {
  // หาสินค้าจากข้อมูล Firestore
  const product = window.products.find((product) => product.id === id)
  if (!product) {
    alert("ไม่พบสินค้า")
    return
  }
  // เช็กว่ามีในตะกร้าแล้วหรือยัง
  const cartItem = cart.find((item) => item.id === id)
  if (cartItem) {
    cartItem.qty++
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      img: product.img,
      qty: 1
    })
  }
  // บันทึกลง LocalStorage
  localStorage.setItem("cart", JSON.stringify(cart))
  alert("เพิ่มสินค้าลงตะกร้าแล้ว")
}
// ให้ products.js เรียกได้

window.addToCart = addToCart
