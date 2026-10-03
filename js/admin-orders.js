import { ADMIN_UIDS } from "./config.js"
import { formatPrice, escapeHTML } from "./utils.js"
import { db, auth } from "./firebase.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const ORDERS_PER_PAGE = 10
const STATUS = {
  pending_verification: ["รอตรวจสอบการชำระเงิน", "รอตรวจสอบ", "order-status-pending"],
  paid: ["ชำระเงินแล้ว", "ชำระแล้ว", "order-status-paid"],
  preparing: ["กำลังเตรียมสินค้า", "กำลังเตรียม", "order-status-preparing"],
  shipped: ["จัดส่งแล้ว", "จัดส่งแล้ว", "order-status-shipped"],
  completed: ["สำเร็จ", "สำเร็จ", "order-status-completed"],
  cancelled: ["ยกเลิก", "ยกเลิก", "order-status-cancelled"]
}
const $ = (id) => document.getElementById(id)
const table = $("ordersTableBody")
const search = $("orderSearch")
const filter = $("orderStatusFilter")
const prevBtn = $("prevPageBtn")
const nextBtn = $("nextPageBtn")
const pageInfo = $("pageInfo")
const modal = $("orderModal")
const modalBody = $("orderModalBody")
const closeModalBtn = $("closeOrderModal")
let allOrders = []
let filteredOrders = []
let currentPage = 1

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "login.html?next=admin-orders.html"
    return
  }
  if (!ADMIN_UIDS.includes(user.uid)) {
    alert("บัญชีนี้ไม่มีสิทธิ์เข้าหน้า Admin")
    location.href = "index.html"
    return
  }
  loadOrders()
})

function loadOrders() {
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"))
  onSnapshot(
    ordersQuery,
    (snapshot) => {
      allOrders = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }))
      applyFilters()
    },
    (error) => {
      console.error("Load orders error:", error)
      showMessage("โหลด Orders ไม่สำเร็จ")
    }
  )
}

search.addEventListener("input", resetFilter)

filter.addEventListener("change", resetFilter)

function resetFilter() {
  currentPage = 1
  applyFilters()
}

function applyFilters() {
  const keyword = search.value.trim().toLowerCase()
  const status = filter.value
  filteredOrders = allOrders.filter((order) => {
    const text = [order.id, order.userEmail, getCustomerName(order)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    const matchSearch = !keyword || text.includes(keyword)
    const matchStatus = status === "all" || order.status === status
    return matchSearch && matchStatus
  })
  currentPage = Math.min(currentPage, getTotalPages())
  renderOrders()
}

function renderOrders() {
  if (!filteredOrders.length) {
    showMessage("ไม่พบคำสั่งซื้อ")
    updatePagination()
    return
  }
  const start = (currentPage - 1) * ORDERS_PER_PAGE
  const orders = filteredOrders.slice(start, start + ORDERS_PER_PAGE)
  table.innerHTML = orders
    .map(
      (order) => `
    <tr>
      <td>${escapeHTML(shortId(order.id))}</td>

      <td>${escapeHTML(getCustomerName(order))}</td>

      <td>${escapeHTML(order.userEmail || "-")}</td>

      <td>฿${formatPrice(order.total)}</td>

      <td>
        <span class="order-status ${getStatusClass(order.status)}">
          ${escapeHTML(getStatusText(order.status))}
        </span>
      </td>

      <td>${escapeHTML(formatDate(order.createdAt))}</td>

      <td>
        <button
          type="button"
          class="order-view-btn"
        >
          ดูรายละเอียด
        </button>
      </td>
    </tr>
  `
    )
    .join("")
  table.querySelectorAll(".order-view-btn").forEach((button, index) => {
    button.addEventListener("click", () => {
      openOrderDetails(orders[index])
    })
  })
  updatePagination()
}

function showMessage(message) {
  table.innerHTML = `
    <tr>
      <td colspan="7" class="admin-orders-message">
        ${escapeHTML(message)}
      </td>
    </tr>
  `
}

function openOrderDetails(order) {
  modalBody.innerHTML = `
    <div class="order-detail-section">
      <p><strong>Order ID:</strong> ${escapeHTML(order.id)}</p>
      <p><strong>วันที่:</strong> ${escapeHTML(formatDate(order.createdAt))}</p>
      <p><strong>Email:</strong> ${escapeHTML(order.userEmail || "-")}</p>
      <p><strong>ผู้รับ:</strong> ${escapeHTML(getCustomerName(order))}</p>
      <p><strong>เบอร์โทร:</strong> ${escapeHTML(order.customer?.phone || order.phone || "-")}</p>
      <p><strong>ที่อยู่:</strong> ${escapeHTML(getAddress(order))}</p>
    </div>

    <div class="order-detail-section">
      <h3>รายการสินค้า</h3>
      ${createItemsHTML(order.items)}
    </div>

    <div class="order-detail-section">
      <h3>ยอดรวม: ฿${formatPrice(order.total)}</h3>
    </div>

    <div class="order-detail-section">
      <label for="modalOrderStatus">
        <strong>สถานะคำสั่งซื้อ</strong>
      </label>

      <select id="modalOrderStatus">
        ${createStatusOptions(order.status)}
      </select>
    </div>
  `
  const statusSelect = $("modalOrderStatus")
  statusSelect.addEventListener("change", async () => {
    const oldStatus = order.status
    const newStatus = statusSelect.value
    statusSelect.disabled = true
    if (await updateOrderStatus(order.id, newStatus)) {
      order.status = newStatus
    } else {
      statusSelect.value = oldStatus
    }
    statusSelect.disabled = false
  })
  modal.classList.add("show")
}

function createItemsHTML(items) {
  if (!Array.isArray(items) || !items.length) {
    return "<p>ไม่มีข้อมูลสินค้า</p>"
  }
  return items
    .map((item) => {
      const qty = Number(item.qty ?? item.quantity ?? 1)
      const subtotal = Number(item.price || 0) * qty
      return `
      <div class="order-product">
        <span>
          ${escapeHTML(item.name || "-")} × ${qty}
        </span>

        <strong>
          ฿${formatPrice(subtotal)}
        </strong>
      </div>
    `
    })
    .join("")
}

async function updateOrderStatus(orderId, status) {
  try {
    await updateDoc(doc(db, "orders", orderId), { status })
    return true
  } catch (error) {
    console.error("Update order status error:", error)
    alert("เปลี่ยนสถานะ Order ไม่สำเร็จ")
    return false
  }
}

function closeModal() {
  modal.classList.remove("show")
  modalBody.innerHTML = ""
}

closeModalBtn.addEventListener("click", closeModal)

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal()
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("show")) {
    closeModal()
  }
})

function getTotalPages() {
  return Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE))
}

function updatePagination() {
  const totalPages = getTotalPages()
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`
  prevBtn.disabled = currentPage <= 1
  nextBtn.disabled = currentPage >= totalPages
}

prevBtn.addEventListener("click", () => {
  if (currentPage <= 1) return
  currentPage--
  renderOrders()
  scrollToOrders()
})

nextBtn.addEventListener("click", () => {
  if (currentPage >= getTotalPages()) return
  currentPage++
  renderOrders()
  scrollToOrders()
})

function scrollToOrders() {
  document.querySelector(".admin-orders-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  })
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

function createStatusOptions(currentStatus) {
  return Object.entries(STATUS)
    .map(
      ([value, data]) => `
      <option
        value="${value}"
        ${value === currentStatus ? "selected" : ""}
      >
        ${data[0]}
      </option>
    `
    )
    .join("")
}

function getStatusText(status) {
  return STATUS[status]?.[1] || "ไม่ทราบสถานะ"
}

function getStatusClass(status) {
  return STATUS[status]?.[2] || ""
}

function shortId(id) {
  if (!id) return "-"
  return id.length > 10 ? `${id.slice(0, 10)}...` : id
}

function formatDate(timestamp) {
  if (!timestamp) return "-"
  try {
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short"
    })
  } catch {
    return "-"
  }
}
