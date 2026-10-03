import { ADMIN_UIDS } from "./config.js"
import { formatPrice, escapeHTML } from "./utils.js"
import { db, auth } from "./firebase.js"
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"

const CLOUD_NAME = "niqbbjwf"
const UPLOAD_PRESET = "shoe_shop_products"
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
const $ = (id) => document.getElementById(id)
const productList = $("productList")
const nameInput = $("name")
const priceInput = $("price")
const imageInput = $("productImage")
const preview = $("preview")
const status = $("uploadStatus")
const addProductBtn = $("addProductBtn")
const productsRef = collection(db, "products")
let products = []
let editingId = null

onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.href = "login.html?next=admin-products.html"
    return
  }
  if (!ADMIN_UIDS.includes(user.uid)) {
    alert("บัญชีนี้ไม่มีสิทธิ์เข้าหน้า Admin")
    location.href = "index.html"
    return
  }
  loadProducts()
})

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0]
  if (!file) {
    clearPreview()
    return
  }
  if (!file.type.startsWith("image/")) {
    alert("กรุณาเลือกไฟล์รูปภาพ")
    imageInput.value = ""
    clearPreview()
    return
  }
  preview.src = URL.createObjectURL(file)
  preview.style.display = "block"
})

function clearPreview() {
  preview.src = ""
  preview.style.display = "none"
}

async function uploadImage(file) {
  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", UPLOAD_PRESET)
  const response = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: form
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || "Upload รูปไม่สำเร็จ")
  }
  return data.secure_url
}

addProductBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim()
  const price = Number(priceInput.value)
  const file = imageInput.files[0]
  if (!name) {
    status.textContent = "กรุณากรอกชื่อสินค้า"
    return
  }
  if (!Number.isFinite(price) || price <= 0) {
    status.textContent = "กรุณากรอกราคาให้ถูกต้อง"
    return
  }
  if (!file) {
    status.textContent = "กรุณาเลือกรูปสินค้า"
    return
  }
  try {
    addProductBtn.disabled = true
    status.textContent = "กำลังอัปโหลดรูป..."
    const img = await uploadImage(file)
    status.textContent = "กำลังบันทึกสินค้า..."
    await addDoc(productsRef, {
      name,
      price,
      img
    })
    status.textContent = "เพิ่มสินค้าสำเร็จ"
    nameInput.value = ""
    priceInput.value = ""
    imageInput.value = ""
    clearPreview()
  } catch (error) {
    console.error(error)
    status.textContent = "เกิดข้อผิดพลาด: " + error.message
  } finally {
    addProductBtn.disabled = false
  }
})

function loadProducts() {
  onSnapshot(
    productsRef,
    (snapshot) => {
      products = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }))
      renderProducts()
    },
    (error) => {
      console.error(error)
      productList.innerHTML = `<p class="admin-product-message">
          โหลดสินค้าไม่สำเร็จ
        </p>`
    }
  )
}

function renderProducts() {
  if (!products.length) {
    productList.innerHTML = `<p class="admin-product-message">
        ยังไม่มีสินค้า
      </p>`
    return
  }
  productList.innerHTML = products.map(createCard).join("")
}

function createCard(product) {
  const editing = product.id === editingId
  return `
    <div class="product-admin-item">

      <div class="product-admin-image">
        <img
          src="${escapeHTML(product.img || "")}"
          alt="${escapeHTML(product.name || "Product")}"
        >
      </div>

      <div class="product-admin-info">

        ${editing ? createProductEditorHTML(product) : createProductDetailsHTML(product)}

      </div>

    </div>
  `
}

function createProductDetailsHTML(product) {
  return `
    <h3>
      ${escapeHTML(product.name || "-")}
    </h3>

    <p class="product-admin-price">
      ${formatPrice(product.price)} บาท
    </p>

    <div class="product-admin-actions">

      <button
        class="product-edit-btn"
        data-action="edit"
        data-id="${product.id}"
      >
        แก้ไข
      </button>

      <button
        class="product-delete-btn"
        data-action="delete"
        data-id="${product.id}"
      >
        ลบ
      </button>

    </div>
  `
}

function createProductEditorHTML(product) {
  return `
    <label>ชื่อสินค้า</label>

    <input
      id="editName"
      class="product-edit-input"
      value="${escapeHTML(product.name || "")}"
    >

    <label>ราคา</label>

    <input
      id="editPrice"
      type="number"
      min="1"
      class="product-edit-input"
      value="${Number(product.price || 0)}"
    >

    <label>เปลี่ยนรูปสินค้า</label>

    <input
      id="editImage"
      type="file"
      accept="image/*"
      class="product-edit-file"
    >

    <p
      id="editStatus"
      class="product-edit-status"
    ></p>

    <div class="product-edit-actions">

      <button
        class="product-save-btn"
        data-action="save"
        data-id="${product.id}"
      >
        บันทึก
      </button>

      <button
        class="product-cancel-btn"
        data-action="cancel"
      >
        ยกเลิก
      </button>

    </div>
  `
}

productList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]")
  if (!button) return
  const action = button.dataset.action
  const id = button.dataset.id
  if (action === "edit") {
    editingId = id
    renderProducts()
  }
  if (action === "cancel") {
    editingId = null
    renderProducts()
  }
  if (action === "save") {
    saveProduct(id)
  }
  if (action === "delete") {
    const product = products.find((item) => item.id === id)
    deleteProduct(id, product?.name || "สินค้า")
  }
})

async function saveProduct(id) {
  const name = $("editName").value.trim()
  const price = Number($("editPrice").value)
  const image = $("editImage").files[0]
  const editStatus = $("editStatus")
  const currentProduct = products.find((item) => item.id === id)
  if (!currentProduct) {
    editStatus.textContent = "ไม่พบข้อมูลสินค้า"
    return
  }
  if (!name) {
    editStatus.textContent = "กรุณากรอกชื่อสินค้า"
    return
  }
  if (!Number.isFinite(price) || price <= 0) {
    editStatus.textContent = "กรุณากรอกราคาให้ถูกต้อง"
    return
  }
  if (image && !image.type.startsWith("image/")) {
    editStatus.textContent = "กรุณาเลือกไฟล์รูปภาพ"
    return
  }
  // เช็กว่ามีการเปลี่ยนแปลงหรือไม่
  const nameChanged = name !== currentProduct.name
  const priceChanged = price !== Number(currentProduct.price)
  const imageChanged = Boolean(image)
  // ไม่มีอะไรเปลี่ยน
  if (!nameChanged && !priceChanged && !imageChanged) {
    editingId = null
    renderProducts()
    return
  }
  try {
    const data = {
      name,
      price,
      img: currentProduct.img || ""
    }
    // มีรูปใหม่
    if (image) {
      editStatus.textContent = "กำลังอัปโหลดรูปใหม่..."
      data.img = await uploadImage(image)
    }
    editStatus.textContent = "กำลังบันทึก..."
    await updateDoc(doc(db, "products", id), data)
    editingId = null
    // render เอง ไม่ต้องรอ onSnapshot
    renderProducts()
  } catch (error) {
    console.error(error)
    editStatus.textContent = "แก้ไขสินค้าไม่สำเร็จ: " + error.message
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`ต้องการลบ "${name}" หรือไม่?`)) {
    return
  }
  try {
    await deleteDoc(doc(db, "products", id))
  } catch (error) {
    console.error("Delete product error:", error)
    alert("ลบสินค้าไม่สำเร็จ")
  }
}
