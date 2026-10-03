import { auth, db } from "./firebase.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const checkoutData = JSON.parse(sessionStorage.getItem("checkoutData"))
let currentUser = null
const paymentSection = document.getElementById("paymentSection")
const paymentContent = document.getElementById("paymentContent")
const paymentError = document.getElementById("paymentError")
const paymentOrderList = document.getElementById("paymentOrderList")
const paymentTotal = document.getElementById("paymentTotal")
const paymentCompleteBtn = document.getElementById("paymentCompleteBtn")
const backCheckoutBtn = document.getElementById("backCheckoutBtn")
const orderSuccess = document.getElementById("orderSuccess")
const successOrderId = document.getElementById("successOrderId")
const successInfo = document.getElementById("successInfo")
const myOrdersBtn = document.getElementById("myOrdersBtn")
const backShopBtn = document.getElementById("backShopBtn")

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน")
    window.location.href = "login.html"
    return
  }
  currentUser = user
  checkCheckoutData()
})

function checkCheckoutData() {
  if (!checkoutData || !checkoutData.items || checkoutData.items.length === 0) {
    paymentContent.style.display = "none"
    paymentError.textContent = "ไม่พบข้อมูลคำสั่งซื้อ กรุณากลับไปเลือกสินค้าใหม่"
    return
  }
  // ป้องกันข้อมูล Checkout ของ User คนอื่น
  if (checkoutData.userId !== currentUser.uid) {
    paymentContent.style.display = "none"
    paymentError.textContent = "ข้อมูลคำสั่งซื้อไม่ถูกต้อง"
    sessionStorage.removeItem("checkoutData")
    return
  }
  renderPayment()
}

function renderPayment() {
  paymentOrderList.innerHTML = ""
  checkoutData.items.forEach((item) => {
    const subtotal = Number(item.price) * Number(item.qty)
    const row = document.createElement("div")
    row.className = "summary-row"
    const name = document.createElement("span")
    name.textContent = `${item.name} × ${item.qty}`
    const price = document.createElement("strong")
    price.textContent = `${subtotal.toLocaleString()} บาท`
    row.appendChild(name)
    row.appendChild(price)
    paymentOrderList.appendChild(row)
  })
  paymentTotal.textContent = Number(checkoutData.total).toLocaleString()
}

paymentCompleteBtn.addEventListener("click", async () => {
  paymentError.textContent = ""
  if (!currentUser) {
    paymentError.textContent = "กรุณาเข้าสู่ระบบ"
    return
  }
  if (!checkoutData) {
    paymentError.textContent = "ไม่พบข้อมูลคำสั่งซื้อ"
    return
  }
  try {
    // ป้องกันการกดซ้ำ
    paymentCompleteBtn.disabled = true
    backCheckoutBtn.disabled = true
    paymentCompleteBtn.textContent = "กำลังสร้างคำสั่งซื้อ..."
    const orderRef = await addDoc(collection(db, "orders"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,

      customer: {
        firstName: checkoutData.customer.firstName,
        lastName: checkoutData.customer.lastName,
        phone: checkoutData.customer.phone
      },
      // เก็บฟิลด์เดิมไว้ให้หน้าประวัติคำสั่งซื้อและหน้าผู้ดูแลระบบอ่านได้
      customerName: `${checkoutData.customer.firstName} ${checkoutData.customer.lastName}`,
      phone: checkoutData.customer.phone,

      shippingAddress: {
        addressLine: checkoutData.shippingAddress.addressLine,
        subDistrict: checkoutData.shippingAddress.subDistrict,
        district: checkoutData.shippingAddress.district,
        province: checkoutData.shippingAddress.province,
        postalCode: checkoutData.shippingAddress.postalCode
      },
      // หน้าเดิมยังอ่านที่อยู่แบบข้อความ
      address: createFullAddress(),

      items: checkoutData.items,

      total: Number(checkoutData.total),

      status: "pending_verification",

      createdAt: serverTimestamp()
    })
    showSuccess(orderRef.id)
    // ล้างตะกร้าหลังบันทึกคำสั่งซื้อสำเร็จเท่านั้น
    localStorage.removeItem("cart")

    sessionStorage.removeItem("checkoutData")
  } catch (error) {
    console.error("Create order error:", error)
    paymentError.textContent = "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่"
    paymentCompleteBtn.disabled = false
    backCheckoutBtn.disabled = false
    paymentCompleteBtn.textContent = "ฉันชำระเงินแล้ว"
  }
})

function createFullAddress() {
  const address = checkoutData.shippingAddress
  return [
    address.addressLine,
    address.subDistrict,
    address.district,
    address.province,
    address.postalCode
  ]
    .filter(Boolean)
    .join(" ")
}

function showSuccess(orderId) {
  paymentSection.style.display = "none"
  orderSuccess.style.display = "block"
  successOrderId.textContent = orderId
  const customer = checkoutData.customer
  const address = checkoutData.shippingAddress
  successInfo.innerHTML = ""
  const info = [
    ["ผู้รับ", `${customer.firstName} ${customer.lastName}`],
    ["เบอร์โทร", customer.phone],
    ["ที่อยู่", createFullAddress()],
    ["ยอดชำระ", `${Number(checkoutData.total).toLocaleString()} บาท`],
    ["สถานะ", "รอตรวจสอบการชำระเงิน"]
  ]
  info.forEach(([label, value]) => {
    const row = document.createElement("p")
    const strong = document.createElement("strong")
    strong.textContent = `${label}: `
    row.appendChild(strong)
    row.appendChild(document.createTextNode(value))
    successInfo.appendChild(row)
  })
}

backCheckoutBtn.addEventListener("click", () => {
  window.location.href = "checkout.html"
})

myOrdersBtn.addEventListener("click", () => {
  window.location.href = "my-orders.html"
})

backShopBtn.addEventListener("click", () => {
  window.location.href = "index.html"
})
