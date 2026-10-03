import { escapeHTML } from "./utils.js"
import { auth, db } from "./firebase.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const $ = (id) => document.getElementById(id)
const LONGDO_API_KEY = "a6963b0c43a6ded0631d823197caaf26"
const cart = JSON.parse(localStorage.getItem("cart")) || []
const loading = $("loading")
const checkoutForm = $("checkoutForm")
const orderList = $("orderList")
const totalPrice = $("totalPrice")
const errorMessage = $("error")
const continueBtn = $("continuePaymentBtn")
const firstNameInput = $("firstName")
const lastNameInput = $("lastName")
const phoneInput = $("phone")
const addressInput = $("addressLine")
const subDistrictInput = $("subDistrict")
const districtInput = $("district")
const provinceInput = $("province")
const postalCodeInput = $("postalCode")
const addressSearchInput = $("addressSearch")
const addressSuggestions = $("addressSuggestions")
const addressSearchStatus = $("addressSearchStatus")
let currentUser = null
let total = 0

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "")
})

postalCodeInput.addEventListener("input", () => {
  postalCodeInput.value = postalCodeInput.value.replace(/\D/g, "")
})

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ")
    location.href = "login.html"
    return
  }
  currentUser = user
  renderOrder()
  await Promise.all([loadProfile(user.uid), loadLatestShippingAddress(user.uid)])
  loading.style.display = "none"
  checkoutForm.style.display = "block"
})

async function loadProfile(userId) {
  try {
    const snapshot = await getDoc(doc(db, "users", userId))
    if (!snapshot.exists()) return
    const data = snapshot.data()
    firstNameInput.value = data.firstName || ""
    lastNameInput.value = data.lastName || ""
    phoneInput.value = data.phone || ""
  } catch (error) {
    console.error("Load user profile error:", error)
  }
}

async function loadLatestShippingAddress(userId) {
  try {
    const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId))
    const snapshot = await getDocs(ordersQuery)
    if (snapshot.empty) return
    const orders = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => getOrderTime(b.createdAt) - getOrderTime(a.createdAt))
    const latestOrder = orders.find(
      (order) => order.shippingAddress && typeof order.shippingAddress === "object"
    )
    if (!latestOrder) return
    const address = latestOrder.shippingAddress
    addressInput.value = address.addressLine || ""
    subDistrictInput.value = address.subDistrict || ""
    districtInput.value = address.district || ""
    provinceInput.value = address.province || ""
    postalCodeInput.value = address.postalCode || ""
  } catch (error) {
    console.error("Load latest shipping address error:", error)
  }
}

function getOrderTime(timestamp) {
  if (!timestamp) return 0
  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis()
  }
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().getTime()
  }
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

let suggestTimer = null
let suggestController = null

addressSearchInput.addEventListener("input", () => {
  clearTimeout(suggestTimer)
  const keyword = addressSearchInput.value.trim()
  if (keyword.length < 3) {
    clearAddressSuggestions()
    addressSearchStatus.textContent = keyword ? "กรุณาพิมพ์อย่างน้อย 3 ตัวอักษร" : ""
    return
  }
  addressSearchStatus.textContent = ""
  suggestTimer = setTimeout(() => {
    loadAddressSuggestions(keyword)
  }, 500)
})

async function loadAddressSuggestions(keyword) {
  try {
    if (suggestController) {
      suggestController.abort()
    }
    suggestController = new AbortController()
    const url =
      "https://search.longdo.com/mapsearch/json/suggest" +
      "?keyword=" +
      encodeURIComponent(keyword) +
      "&limit=6" +
      "&key=" +
      encodeURIComponent(LONGDO_API_KEY)
    const response = await fetch(url, {
      signal: suggestController.signal
    })
    if (!response.ok) {
      throw new Error("Longdo API ไม่สามารถใช้งานได้")
    }
    const data = await response.json()
    if (addressSearchInput.value.trim() !== keyword) {
      return
    }
    renderAddressSuggestions(data.data || [])
  } catch (error) {
    if (error.name === "AbortError") {
      return
    }
    console.error("Longdo suggest error:", error)
    clearAddressSuggestions()
    addressSearchStatus.textContent = "ไม่สามารถค้นหาที่อยู่ได้"
  }
}

function renderAddressSuggestions(items) {
  addressSuggestions.innerHTML = ""
  if (!items.length) {
    addressSearchStatus.textContent = "ไม่พบผลการค้นหา"
    addressSuggestions.classList.remove("show")
    return
  }
  addressSearchStatus.textContent = ""
  items.forEach((item) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "address-suggestion-item"
    button.textContent = item.w || ""
    button.addEventListener("click", async () => {
      const keyword = item.w || ""
      addressSearchInput.value = keyword
      clearAddressSuggestions()
      await fillAddressFromLongdo(keyword)
    })
    addressSuggestions.appendChild(button)
  })
  addressSuggestions.classList.add("show")
}

function clearAddressSuggestions() {
  addressSuggestions.innerHTML = ""
  addressSuggestions.classList.remove("show")
}

async function fillAddressFromLongdo(keyword) {
  try {
    addressSearchStatus.textContent = "กำลังค้นหาข้อมูลที่อยู่..."
    // 1. SEARCH → LAT / LON
    const searchUrl =
      "https://search.longdo.com/mapsearch/json/search" +
      "?keyword=" +
      encodeURIComponent(keyword) +
      "&limit=1" +
      "&locale=th" +
      "&key=" +
      encodeURIComponent(LONGDO_API_KEY)
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error("ค้นหาสถานที่ไม่สำเร็จ")
    }
    const searchData = await searchResponse.json()
    const place = searchData.data?.[0]
    if (!place || place.lat == null || place.lon == null) {
      addressSearchStatus.textContent = "ไม่พบตำแหน่งของสถานที่นี้"
      return
    }
    // 2. LAT / LON → ADDRESS
    const addressUrl =
      "https://api.longdo.com/map/services/address" +
      "?lon=" +
      encodeURIComponent(place.lon) +
      "&lat=" +
      encodeURIComponent(place.lat) +
      "&locale=th" +
      "&noelevation=1" +
      "&key=" +
      encodeURIComponent(LONGDO_API_KEY)
    const addressResponse = await fetch(addressUrl)
    if (!addressResponse.ok) {
      throw new Error("โหลดข้อมูลที่อยู่ไม่สำเร็จ")
    }
    const address = await addressResponse.json()
    subDistrictInput.value = address.subdistrict || ""
    districtInput.value = address.district || ""
    provinceInput.value = address.province || ""
    postalCodeInput.value = address.postcode ? String(address.postcode) : ""
    if (!addressInput.value.trim() && address.road) {
      addressInput.value = address.road
    }
    addressSearchStatus.textContent = "เติมข้อมูลที่อยู่ให้อัตโนมัติแล้ว กรุณาตรวจสอบข้อมูลอีกครั้ง"
  } catch (error) {
    console.error("Longdo address error:", error)
    addressSearchStatus.textContent = "ไม่สามารถโหลดข้อมูลที่อยู่ได้"
  }
}
// คลิกพื้นที่อื่นแล้วปิด Suggest

document.addEventListener("click", (event) => {
  if (!addressSearchInput.contains(event.target) && !addressSuggestions.contains(event.target)) {
    clearAddressSuggestions()
  }
})

function renderOrder() {
  if (!cart.length) {
    orderList.innerHTML = "<p>ไม่มีสินค้าในตะกร้า</p>"
    totalPrice.textContent = "0"
    continueBtn.disabled = true
    return
  }
  total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0)
  orderList.innerHTML = cart
    .map((item) => {
      const subtotal = Number(item.price) * Number(item.qty)
      return `
        <div class="order-item">
          <span>
            ${escapeHTML(item.name)}
            × ${Number(item.qty)}
          </span>

          <strong>
            ${subtotal.toLocaleString()} บาท
          </strong>
        </div>
      `
    })
    .join("")
  totalPrice.textContent = total.toLocaleString()
  continueBtn.disabled = false
}

continueBtn.addEventListener("click", () => {
  errorMessage.textContent = ""
  if (!currentUser) {
    showError("กรุณาเข้าสู่ระบบ")
    return
  }
  if (!cart.length) {
    showError("ไม่มีสินค้าในตะกร้า")
    return
  }
  const firstName = firstNameInput.value.trim()
  const lastName = lastNameInput.value.trim()
  const phone = phoneInput.value.trim()
  const addressLine = addressInput.value.trim()
  const subDistrict = subDistrictInput.value.trim()
  const district = districtInput.value.trim()
  const province = provinceInput.value.trim()
  const postalCode = postalCodeInput.value.trim()
  if (
    !firstName ||
    !lastName ||
    !phone ||
    !addressLine ||
    !subDistrict ||
    !district ||
    !province ||
    !postalCode
  ) {
    showError("กรุณากรอกข้อมูลจัดส่งให้ครบ")
    return
  }
  const namePattern = /^[A-Za-zก-๙\s]+$/
  if (!namePattern.test(firstName)) {
    showError("ชื่อผู้รับต้องเป็นตัวอักษรเท่านั้น")
    return
  }
  if (!namePattern.test(lastName)) {
    showError("นามสกุลต้องเป็นตัวอักษรเท่านั้น")
    return
  }
  if (!/^0[0-9]{9}$/.test(phone)) {
    showError("กรุณากรอกเบอร์โทร 10 หลัก")
    return
  }
  if (!/^[0-9]{5}$/.test(postalCode)) {
    showError("กรุณากรอกรหัสไปรษณีย์ 5 หลัก")
    return
  }
  const items = cart.map((item) => ({
    productId: String(item.id),
    name: String(item.name),
    price: Number(item.price),
    qty: Number(item.qty),
    img: String(item.img || "")
  }))
  const checkoutData = {
    userId: currentUser.uid,
    userEmail: currentUser.email,
    customer: {
      firstName,
      lastName,
      phone
    },
    shippingAddress: {
      addressLine,
      subDistrict,
      district,
      province,
      postalCode
    },
    items,
    total
  }
  sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData))
  location.href = "payment.html"
})

function showError(message) {
  errorMessage.textContent = message
}
