import { ADMIN_UIDS } from "./config.js"
import { formatPrice } from "./utils.js"
import { db, auth } from "./firebase.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const dashboardOrders = document.getElementById("dashboardOrders")
const dashboardPending = document.getElementById("dashboardPending")
const dashboardPaid = document.getElementById("dashboardPaid")
const dashboardPreparing = document.getElementById("dashboardPreparing")
const dashboardShipped = document.getElementById("dashboardShipped")
const dashboardCompleted = document.getElementById("dashboardCompleted")
const dashboardCancelled = document.getElementById("dashboardCancelled")
const dashboardSales = document.getElementById("dashboardSales")
const recentOrders = document.getElementById("recentOrders")

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html?next=admin.html"
    return
  }
  if (!ADMIN_UIDS.includes(user.uid)) {
    alert("บัญชีนี้ไม่มีสิทธิ์เข้าหน้า Admin")
    window.location.href = "index.html"
    return
  }
  loadDashboard()
})

function loadDashboard() {
  const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"))
  onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      updateSummary(orders)
      renderRecentOrders(orders)
    },
    (error) => {
      console.error("Dashboard orders error:", error)
      recentOrders.innerHTML = `
        <tr>
          <td
            colspan="6"
            class="dashboard-message"
          >
            โหลด Orders ไม่สำเร็จ
          </td>
        </tr>
      `
    }
  )
}

function updateSummary(orders) {
  const summary = {
    pending_verification: 0,
    paid: 0,
    preparing: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0
  }
  const paidStatuses = ["paid", "preparing", "shipped", "completed"]
  let totalSales = 0
  orders.forEach((order) => {
    if (order.status in summary) {
      summary[order.status]++
    }
    if (paidStatuses.includes(order.status)) {
      totalSales += Number(order.total || 0)
    }
  })
  dashboardOrders.textContent = orders.length
  dashboardPending.textContent = summary.pending_verification
  dashboardPaid.textContent = summary.paid
  dashboardPreparing.textContent = summary.preparing
  dashboardShipped.textContent = summary.shipped
  dashboardCompleted.textContent = summary.completed
  dashboardCancelled.textContent = summary.cancelled
  dashboardSales.textContent = `฿${formatPrice(totalSales)}`
}

function renderRecentOrders(orders) {
  recentOrders.innerHTML = ""
  if (orders.length === 0) {
    recentOrders.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="dashboard-message"
        >
          ยังไม่มีคำสั่งซื้อ
        </td>
      </tr>
    `
    return
  }
  const latestOrders = orders.slice(0, 5)
  latestOrders.forEach((order) => {
    const row = document.createElement("tr")
    row.append(
      createCell(shortOrderId(order.id), "recent-order-id", order.id),
      createCell(getCustomerName(order)),
      createCell(order.userEmail || "-"),
      createCell(`${formatPrice(order.total)} บาท`),
      createStatusCell(order.status),
      createCell(formatDate(order.createdAt))
    )
    recentOrders.appendChild(row)
  })
}

function createCell(text, className = "", title = "") {
  const cell = document.createElement("td")
  cell.textContent = text
  if (className) {
    cell.className = className
  }
  if (title) {
    cell.title = title
  }
  return cell
}

function createStatusCell(status) {
  const cell = document.createElement("td")
  const badge = document.createElement("span")
  badge.className = "status-badge"
  badge.textContent = getStatusText(status)
  cell.appendChild(badge)
  return cell
}

function getCustomerName(order) {
  const firstName = order.customer?.firstName || ""
  const lastName = order.customer?.lastName || ""
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || order.customerName || "-"
}

function shortOrderId(orderId) {
  if (!orderId) {
    return "-"
  }
  return orderId.length > 10 ? `${orderId.slice(0, 10)}...` : orderId
}

function getStatusText(status) {
  const statusMap = {
    pending_verification: "รอตรวจสอบ",
    paid: "ชำระแล้ว",
    preparing: "กำลังเตรียม",
    shipped: "จัดส่งแล้ว",
    completed: "สำเร็จ",
    cancelled: "ยกเลิก"
  }
  return statusMap[status] || status || "-"
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "-"
  }
  return timestamp.toDate().toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short"
  })
}
