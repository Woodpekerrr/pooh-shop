import { ADMIN_UIDS } from "./config.js"
import { escapeHTML } from "./utils.js"
import { db, auth } from "./firebase.js"
import {
  collection,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"

const $ = (id) => document.getElementById(id)
const totalUsers = $("totalUsers")
const activeUsers = $("activeUsers")
const inactiveUsers = $("inactiveUsers")
const userSearch = $("userSearch")
const table = $("usersTableBody")
let users = []
let orders = []
let usersReady = false
let ordersReady = false

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "login.html?next=admin-users.html"
    return
  }
  if (!ADMIN_UIDS.includes(user.uid)) {
    alert("บัญชีนี้ไม่มีสิทธิ์เข้าหน้า Admin")
    location.href = "index.html"
    return
  }
  loadUsers()
  loadOrders()
})

function loadUsers() {
  onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      users = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }))
      usersReady = true
      render()
    },
    (error) => {
      console.error("Users error:", error)
      table.innerHTML = `
        <tr>
          <td colspan="8" class="users-message">
            โหลด Users ไม่สำเร็จ
          </td>
        </tr>
      `
    }
  )
}

function loadOrders() {
  onSnapshot(
    collection(db, "orders"),
    (snapshot) => {
      orders = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }))
      ordersReady = true
      render()
    },
    (error) => {
      console.error("Orders error:", error)
      orders = []
      ordersReady = true
      render()
    }
  )
}

function render() {
  if (!usersReady || !ordersReady) return
  updateSummary()
  renderUsers()
}

function updateSummary() {
  const inactive = users.filter((user) => getStatus(user) === "inactive").length
  totalUsers.textContent = users.length
  inactiveUsers.textContent = inactive
  activeUsers.textContent = users.length - inactive
}

userSearch.addEventListener("input", renderUsers)

function renderUsers() {
  const keyword = userSearch.value.trim().toLowerCase()
  const filtered = users.filter((user) => {
    const text = [getFullName(user), user.email, user.phone].filter(Boolean).join(" ").toLowerCase()
    return text.includes(keyword)
  })
  if (!filtered.length) {
    table.innerHTML = `
      <tr>
        <td colspan="8" class="users-message">
          ไม่พบข้อมูล User
        </td>
      </tr>
    `
    return
  }
  const completedOrders = {}
  orders.forEach((order) => {
    if (order.status === "completed") {
      completedOrders[order.userId] = (completedOrders[order.userId] || 0) + 1
    }
  })
  table.innerHTML = filtered
    .map((user) => {
      const status = getStatus(user)
      const isAdmin = ADMIN_UIDS.includes(user.id)
      const statusClass = status === "inactive" ? "user-status-inactive" : "user-status-active"
      const buttonClass = status === "inactive" ? "user-activate-btn" : "user-deactivate-btn"
      const buttonText = isAdmin ? "Admin" : status === "inactive" ? "เปิดใช้งาน" : "ปิดใช้งาน"
      return `
        <tr>
          <td>${escapeHTML(getFullName(user))}</td>

          <td>${escapeHTML(user.email || "-")}</td>

          <td>${escapeHTML(user.phone || "-")}</td>

          <td>${formatDate(user.createdAt)}</td>

          <td>${formatDate(user.updatedAt)}</td>

          <td>
            ${completedOrders[user.id] || 0}
          </td>

          <td>
            <span class="user-status ${statusClass}">
              ${status === "inactive" ? "Inactive" : "Active"}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="user-status-btn ${buttonClass}"
              data-id="${escapeHTML(user.id)}"
              ${isAdmin ? "disabled" : ""}
            >
              ${buttonText}
            </button>
          </td>
        </tr>
      `
    })
    .join("")
}

table.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-id]")
  if (!button) return
  const user = users.find((item) => item.id === button.dataset.id)
  if (!user || ADMIN_UIDS.includes(user.id)) {
    return
  }
  const currentStatus = getStatus(user)
  const newStatus = currentStatus === "inactive" ? "active" : "inactive"
  const action = newStatus === "inactive" ? "ปิดใช้งาน" : "เปิดใช้งาน"
  if (!confirm(`ต้องการ${action}บัญชี "${getFullName(user)}" หรือไม่?`)) {
    return
  }
  try {
    button.disabled = true
    await updateDoc(doc(db, "users", user.id), {
      status: newStatus
    })
  } catch (error) {
    console.error("Update user status error:", error)
    alert("เปลี่ยนสถานะ User ไม่สำเร็จ")
    button.disabled = false
  }
})

function getStatus(user) {
  return user.status === "inactive" ? "inactive" : "active"
}

function getFullName(user) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "-"
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
