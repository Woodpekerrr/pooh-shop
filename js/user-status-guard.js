import { ADMIN_UIDS } from "./config.js"
import { auth, db } from "./firebase.js"
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

let unsubscribeStatus = null
let handlingInactive = false

onAuthStateChanged(auth, (user) => {
  // ยกเลิก Listener เดิม
  if (unsubscribeStatus) {
    unsubscribeStatus()
    unsubscribeStatus = null
  }
  // ถ้ายังไม่ได้ Login
  // ปล่อยให้แต่ละหน้าจัดการเอง
  if (!user) {
    return
  }
  // Admin ไม่ต้องตรวจ Active / Inactive
  if (ADMIN_UIDS.includes(user.uid)) {
    return
  }
  const userRef = doc(db, "users", user.uid)
  unsubscribeStatus = onSnapshot(
    userRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        return
      }
      const userData = snapshot.data()
      // User เก่าที่ไม่มี status
      // ถือว่า Active
      const status = userData.status || "active"
      if (status === "inactive" && !handlingInactive) {
        handlingInactive = true
        try {
          if (unsubscribeStatus) {
            unsubscribeStatus()
            unsubscribeStatus = null
          }
          await signOut(auth)
          alert("บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ")
          window.location.href = "login.html"
        } catch (error) {
          console.error("Inactive user logout error:", error)
          handlingInactive = false
        }
      }
    },
    (error) => {
      console.error("User status guard error:", error)
    }
  )
})
