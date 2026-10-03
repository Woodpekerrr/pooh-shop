import { formatPrice, escapeHTML } from "./utils.js"
import { db, auth } from "./firebase.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const list = document.getElementById("myOrderList")
const STATUS = {
  pending_verification: ["รอตรวจสอบการชำระเงิน", "status-pending"],
  paid: ["ชำระเงินแล้ว", "status-paid"],
  preparing: ["กำลังเตรียมสินค้า", "status-preparing"],
  shipped: ["จัดส่งแล้ว", "status-shipped"],
  completed: ["สำเร็จ", "status-completed"],
  cancelled: ["ยกเลิก", "status-cancelled"]
}
const STEPS = [
  ["pending_verification", "รอตรวจสอบ"],
  ["paid", "ชำระแล้ว"],
  ["preparing", "กำลังเตรียม"],
  ["shipped", "จัดส่งแล้ว"],
  ["completed", "สำเร็จ"]
]

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("กรุณาเข้าสู่ระบบก่อนดูคำสั่งซื้อ")
    location.href = "login.html"
    return
  }
  loadOrders(user.uid)
})

function loadOrders(userId) {
  const q = query(collection(db, "orders"), where("userId", "==", userId))
  onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...item.data()
        }))
        .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt))
      renderOrders(orders)
    },
    (error) => {
      console.error("Load my orders error:", error)
      list.innerHTML = `
        <div class="order-message">
          ไม่สามารถโหลดคำสั่งซื้อได้
        </div>
      `
    }
  )
}

function renderOrders(orders) {
  if (!orders.length) {
    list.innerHTML = `
      <div class="my-order-empty">
        <h2> ยังไม่มีคำสั่งซื้อ</h2>
        <p>
          เมื่อคุณสั่งซื้อสินค้า
          รายการจะปรากฏที่นี่
        </p>

        <a
          href="index.html"
          class="my-order-shop-btn"
        >
          เลือกซื้อสินค้า
        </a>
      </div>
    `
    return
  }
  list.innerHTML = orders.map(createOrderCard).join("")
}

function createOrderCard(order) {
  const status = STATUS[order.status] || ["ไม่ทราบสถานะ", ""]
  return `
    <div class="my-order-card">

      <div class="my-order-top">
        <div>
          <h3>
            Order #${escapeHTML(order.id)}
          </h3>

          <p class="my-order-date">
            ${escapeHTML(formatDate(order.createdAt))}
          </p>
        </div>

        <span
          class="my-order-status ${status[1]}"
        >
          ${status[0]}
        </span>
      </div>


      <div class="my-order-products">
        ${createProducts(order.items)}
      </div>


      <div class="my-order-total">
        <span>ยอดรวม</span>

        <strong>
          ${formatPrice(order.total)} บาท
        </strong>
      </div>


      <div class="my-order-progress">
        ${createProgress(order.status)}
      </div>


      <button
        type="button"
        class="my-order-detail-btn"
      >
        ดูรายละเอียด
      </button>


      <div
        class="my-order-details"
        style="display:none"
      >
        <p>
          <strong>ผู้รับ:</strong>
          ${escapeHTML(getCustomerName(order))}
        </p>

        <p>
          <strong>เบอร์โทร:</strong>
          ${escapeHTML(order.customer?.phone || order.phone || "-")}
        </p>

        <p>
          <strong>ที่อยู่:</strong>
          ${escapeHTML(getAddress(order))}
        </p>

        <p>
          <strong>Order ID:</strong>
          ${escapeHTML(order.id)}
        </p>
      </div>

    </div>
  `
}

list.addEventListener("click", (event) => {
  const button = event.target.closest(".my-order-detail-btn")
  if (!button) return
  const card = button.closest(".my-order-card")
  const details = card.querySelector(".my-order-details")
  const open = details.style.display === "block"
  details.style.display = open ? "none" : "block"
  button.textContent = open ? "ดูรายละเอียด" : "ซ่อนรายละเอียด"
})

function createProducts(items) {
  if (!Array.isArray(items) || !items.length) {
    return "<p>ไม่พบข้อมูลสินค้า</p>"
  }
  return items
    .map((item) => {
      const qty = Number(item.qty ?? item.quantity ?? 0)
      const price = Number(item.price || 0)
      return `
      <div class="my-order-product">

        <div>
          <strong>
            ${escapeHTML(item.name || "สินค้า")}
          </strong>

          <p>
            ${formatPrice(price)}
            บาท × ${qty}
          </p>
        </div>

        <strong>
          ${formatPrice(price * qty)}
          บาท
        </strong>

      </div>
    `
    })
    .join("")
}

function createProgress(status) {
  if (status === "cancelled") {
    return `
      <div class="order-cancelled-message">
        ❌ คำสั่งซื้อนี้ถูกยกเลิก
      </div>
    `
  }
  const current = STEPS.findIndex(([value]) => value === status)
  return `
    <div class="order-progress-title">
      สถานะคำสั่งซื้อ
    </div>

    <div class="order-progress-steps">

      ${STEPS.map(([value, label], index) => {
        const state = index < current ? "completed" : index === current ? "current" : ""
        return `
          <div
            class="order-progress-step ${state}"
          >
            <div class="progress-circle">
              ${index < current ? "✓" : index + 1}
            </div>

            <span>${label}</span>
          </div>
        `
      }).join("")}

    </div>
  `
}

function getCustomerName(order) {
  const name = [order.customer?.firstName, order.customer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  return name || order.customerName || "-"
}

function getAddress(order) {
  const address = order.shippingAddress
  if (address && typeof address === "object") {
    const result = [
      address.addressLine,
      address.subDistrict,
      address.district,
      address.province,
      address.postalCode
    ]
      .filter(Boolean)
      .join(" ")
    if (result) return result
  }
  return order.address || "-"
}

function getTime(timestamp) {
  return timestamp?.toMillis?.() || 0
}

function formatDate(timestamp) {
  if (!timestamp) return "-"
  try {
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString("th-TH")
  } catch {
    return "-"
  }
}
