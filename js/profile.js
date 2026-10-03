import { auth, db } from "./firebase.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const firstNameInput = document.getElementById("profileFirstName")
const lastNameInput = document.getElementById("profileLastName")
const phoneInput = document.getElementById("profilePhone")
const emailInput = document.getElementById("profileEmail")
const saveProfileBtn = document.getElementById("saveProfileBtn")
const profileMessage = document.getElementById("profileMessage")
let currentUser = null

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "")
})

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("กรุณาเข้าสู่ระบบก่อน")
    window.location.href = "login.html"
    return
  }
  currentUser = user
  emailInput.value = user.email || ""
  await loadProfile(user.uid)
})

async function loadProfile(userId) {
  try {
    profileMessage.innerText = "กำลังโหลดข้อมูล..."
    const userRef = doc(db, "users", userId)
    const userSnapshot = await getDoc(userRef)
    if (!userSnapshot.exists()) {
      profileMessage.innerText = "ไม่พบข้อมูล Profile"
      return
    }
    const userData = userSnapshot.data()
    firstNameInput.value = userData.firstName || ""
    lastNameInput.value = userData.lastName || ""
    phoneInput.value = userData.phone || ""
    profileMessage.innerText = ""
  } catch (error) {
    console.error("Load profile error:", error)
    profileMessage.innerText = "ไม่สามารถโหลดข้อมูลได้"
  }
}

saveProfileBtn.addEventListener("click", async () => {
  if (!currentUser) {
    return
  }
  const firstName = firstNameInput.value.trim()
  const lastName = lastNameInput.value.trim()
  const phone = phoneInput.value.trim()
  if (!firstName || !lastName || !phone) {
    profileMessage.innerText = "กรุณากรอกข้อมูลให้ครบ"
    return
  }
  const namePattern = /^[A-Za-zก-๙\s]+$/
  if (!namePattern.test(firstName)) {
    profileMessage.innerText = "ชื่อต้องเป็นตัวอักษรเท่านั้น"
    return
  }
  if (!namePattern.test(lastName)) {
    profileMessage.innerText = "นามสกุลต้องเป็นตัวอักษรเท่านั้น"
    return
  }
  const phonePattern = /^0[0-9]{9}$/
  if (!phonePattern.test(phone)) {
    profileMessage.innerText = "กรุณากรอกเบอร์โทร 10 หลัก"
    return
  }
  try {
    saveProfileBtn.disabled = true
    profileMessage.innerText = "กำลังบันทึก..."
    const userRef = doc(db, "users", currentUser.uid)
    await updateDoc(userRef, {
      firstName: firstName,
      lastName: lastName,
      phone: phone,
      updatedAt: serverTimestamp()
    })
    profileMessage.innerText = "บันทึกข้อมูลเรียบร้อยแล้ว"
  } catch (error) {
    console.error("Update profile error:", error)
    profileMessage.innerText = "ไม่สามารถบันทึกข้อมูลได้"
  } finally {
    saveProfileBtn.disabled = false
  }
})
