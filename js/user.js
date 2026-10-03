import { ADMIN_UIDS } from "./config.js"
import { auth, db } from "./firebase.js"
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const userMenu = document.getElementById("userMenu")
const userMenuBtn = document.getElementById("userMenuBtn")
const userDropdown = document.getElementById("userDropdown")
const userEmail = document.getElementById("userEmail")
const loginLink = document.getElementById("loginLink")
const logoutBtn = document.getElementById("logoutBtn")
const adminLink = document.getElementById("adminLink")
let unsubscribeUserStatus = null

userMenuBtn.addEventListener("click", (event) => {
  event.stopPropagation()
  const isOpen = userDropdown.classList.toggle("show")
  userMenuBtn.classList.toggle("active", isOpen)
  userMenuBtn.setAttribute("aria-expanded", String(isOpen))
})

document.addEventListener("click", (event) => {
  if (!userMenu.contains(event.target)) {
    closeUserMenu()
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeUserMenu()
  }
})

function closeUserMenu() {
  userDropdown.classList.remove("show")
  userMenuBtn.classList.remove("active")
  userMenuBtn.setAttribute("aria-expanded", "false")
}

onAuthStateChanged(auth, (user) => {
  if (unsubscribeUserStatus) {
    unsubscribeUserStatus()
    unsubscribeUserStatus = null
  }
  if (!user) {
    userEmail.textContent = ""
    userMenu.style.display = "none"
    loginLink.style.display = "inline"
    adminLink.style.display = "none"
    closeUserMenu()
    return
  }
  userEmail.textContent = user.email || "บัญชีของฉัน"
  userMenu.style.display = "block"
  loginLink.style.display = "none"
  if (ADMIN_UIDS.includes(user.uid)) {
    adminLink.style.display = "inline"
    return
  }
  adminLink.style.display = "none"
  const userRef = doc(db, "users", user.uid)
  unsubscribeUserStatus = onSnapshot(
    userRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        return
      }
      const userData = snapshot.data()
      const status = userData.status || "active"
      if (status === "inactive") {
        try {
          await signOut(auth)
          alert("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ")
          window.location.href = "login.html"
        } catch (error) {
          console.error("Inactive logout error:", error)
        }
      }
    },
    (error) => {
      console.error("User status listener error:", error)
    }
  )
})

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth)
    window.location.href = "login.html"
  } catch (error) {
    console.error("Logout error:", error)
    alert("เกิดข้อผิดพลาดในการออกจากระบบ")
  }
})
