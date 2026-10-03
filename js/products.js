import { db } from "./firebase.js"
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const productsContainer = document.getElementById("products")
// เก็บข้อมูลสินค้าไว้ให้ cart.js ใช้

window.products = []

const productsRef = collection(db, "products")

onSnapshot(
  productsRef,
  (snapshot) => {
    window.products = []
    productsContainer.innerHTML = ""
    snapshot.forEach((doc) => {
      const product = {
        id: doc.id,
        ...doc.data()
      }
      window.products.push(product)
      productsContainer.innerHTML += `
        <div class="card">

          <img
            src="${product.img}"
            alt="${product.name}"
          >

          <h4>
            ${product.name}
          </h4>

          <p>
            ${Number(product.price).toLocaleString()}
            บาท
          </p>

          <button
            onclick="addToCart('${product.id}')"
          >
            เพิ่มลงตะกร้า
          </button>

        </div>
      `
    })
    if (window.products.length === 0) {
      productsContainer.innerHTML = `
        <p>ยังไม่มีสินค้า</p>
      `
    }
  },
  (error) => {
    console.error("โหลดสินค้าไม่สำเร็จ:", error)
    productsContainer.innerHTML = "<p>ไม่สามารถโหลดสินค้าได้</p>"
  }
)
