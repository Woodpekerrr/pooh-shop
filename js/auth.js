import { ADMIN_UIDS } from "./config.js"
import { auth, db } from "./firebase.js"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const registerBtn = document.getElementById("registerBtn")
if (registerBtn) {
  const phoneInput = document.getElementById("registerPhone")
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "")
  })
  registerBtn.addEventListener("click", async () => {
    const firstName = document.getElementById("registerFirstName").value.trim()
    const lastName = document.getElementById("registerLastName").value.trim()
    const phone = document.getElementById("registerPhone").value.trim()
    const email = document.getElementById("registerEmail").value.trim()
    const password = document.getElementById("registerPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value
    const message = document.getElementById("message")
    if (!firstName || !lastName || !phone || !email || !password || !confirmPassword) {
      message.innerText = "กรุณากรอกข้อมูลให้ครบ"
      return
    }
    const namePattern = /^[A-Za-zก-๙\s]+$/
    if (!namePattern.test(firstName)) {
      message.innerText = "ชื่อต้องเป็นตัวอักษรเท่านั้น"
      return
    }
    if (!namePattern.test(lastName)) {
      message.innerText = "นามสกุลต้องเป็นตัวอักษรเท่านั้น"
      return
    }
    const phonePattern = /^0[0-9]{9}$/
    if (!phonePattern.test(phone)) {
      message.innerText = "กรุณากรอกเบอร์โทร 10 หลัก"
      return
    }
    if (password !== confirmPassword) {
      message.innerText = "Password ไม่ตรงกัน"
      return
    }
    registerBtn.disabled = true
    message.innerText = "กำลังสมัครสมาชิก..."
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        phone,
        email,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      await signOut(auth)
      message.innerText = "สมัครสมาชิกสำเร็จ กำลังไปหน้าเข้าสู่ระบบ..."
      setTimeout(() => {
        window.location.replace("login.html")
      }, 1000)
    } catch (error) {
      console.error("Register error:", error)
      message.innerText = "สมัครสมาชิกไม่สำเร็จ: " + getErrorMessage(error.code)
      registerBtn.disabled = false
    }
  })
}
const loginBtn = document.getElementById("loginBtn")
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim()
    const password = document.getElementById("loginPassword").value
    const message = document.getElementById("message")
    if (!email || !password) {
      message.innerText = "กรุณากรอก Email และ Password"
      return
    }
    loginBtn.disabled = true
    message.innerText = "กำลังเข้าสู่ระบบ..."
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      if (ADMIN_UIDS.includes(user.uid)) {
        message.innerText = "เข้าสู่ระบบ Admin สำเร็จ"
        const params = new URLSearchParams(window.location.search)
        const nextPage = params.get("next")
        const allowedAdminPages = [
          "admin.html",
          "admin-orders.html",
          "admin-products.html",
          "admin-users.html"
        ]
        const redirectPage = allowedAdminPages.includes(nextPage) ? nextPage : "admin.html"
        setTimeout(() => {
          window.location.replace(redirectPage)
        }, 500)
        return
      }
      const userRef = doc(db, "users", user.uid)
      const userSnapshot = await getDoc(userRef)
      if (!userSnapshot.exists()) {
        await signOut(auth)
        message.innerText = "ไม่พบข้อมูลบัญชีผู้ใช้งาน"
        loginBtn.disabled = false
        return
      }
      const userData = userSnapshot.data()
      const userStatus = userData.status || "active"
      if (userStatus === "inactive") {
        await signOut(auth)
        message.innerText = "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
        loginBtn.disabled = false
        return
      }
      message.innerText = "เข้าสู่ระบบสำเร็จ"
      setTimeout(() => {
        window.location.replace("index.html")
      }, 500)
    } catch (error) {
      console.error("Login error:", error)
      message.innerText = "Email หรือ Password ไม่ถูกต้อง"
      loginBtn.disabled = false
    }
  })
}
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn")
if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim()
    const message = document.getElementById("message")
    if (!email) {
      message.innerText = "กรุณากรอก Email ก่อนรีเซ็ตรหัสผ่าน"
      return
    }
    try {
      forgotPasswordBtn.disabled = true
      message.innerText = "กำลังส่งอีเมลรีเซ็ตรหัสผ่าน..."
      await sendPasswordResetEmail(auth, email)
      message.innerText = "หาก Email นี้มีบัญชีอยู่ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ"
    } catch (error) {
      console.error("Reset password error:", error)
      if (error.code === "auth/invalid-email") {
        message.innerText = "รูปแบบ Email ไม่ถูกต้อง"
      } else {
        message.innerText = "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้"
      }
    } finally {
      forgotPasswordBtn.disabled = false
    }
  })
}

function getErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Email นี้ถูกใช้งานแล้ว"
    case "auth/invalid-email":
      return "รูปแบบ Email ไม่ถูกต้อง"
    case "auth/weak-password":
      return "Password ไม่ปลอดภัยเพียงพอ"
    case "permission-denied":
      return "ไม่มีสิทธิ์บันทึกข้อมูล User"
    default:
      return "เกิดข้อผิดพลาด"
  }
}
