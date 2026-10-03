# PoohShop - เว็บแอปพลิเคชัน E-Commerce ร้านรองเท้า

PoohShop เป็นเว็บแอปพลิเคชัน E-Commerce สำหรับร้านรองเท้าออนไลน์  
พัฒนาขึ้นเพื่อเรียนรู้และฝึกใช้งานระบบ Authentication, Database, API Integration,
Shopping Cart, Checkout, Order Management และระบบ Admin

## 🌐 Live Demo

https://woodpekerrr.github.io/pooh-shop/

---

## ✨ Features

### 👤 ระบบผู้ใช้งาน

- สมัครสมาชิก
- เข้าสู่ระบบ / ออกจากระบบ
- ลืมรหัสผ่านและส่ง Reset Password ผ่าน Email
- แก้ไขข้อมูลส่วนตัว
- ดูรายการสินค้า
- เพิ่มสินค้าลงตะกร้า
- เพิ่ม / ลดจำนวนสินค้า
- ลบสินค้าออกจากตะกร้า
- Checkout
- ดึงข้อมูลผู้ใช้จาก Profile อัตโนมัติ
- ดึงที่อยู่จัดส่งล่าสุด
- ค้นหาที่อยู่ด้วย Longdo Map API
- กรอกเขต จังหวัด และรหัสไปรษณีย์อัตโนมัติ
- ชำระเงินด้วย PromptPay QR
- สร้างคำสั่งซื้อ
- ดูประวัติคำสั่งซื้อ
- ติดตามสถานะคำสั่งซื้อ
- ระบบ Active / Inactive Account

### 🛠️ ระบบ Admin

- รองรับ Multi Admin
- Admin Dashboard
- ดูจำนวนคำสั่งซื้อทั้งหมด
- ดูยอดขายรวม
- ดูสรุปสถานะคำสั่งซื้อ
- ดูคำสั่งซื้อล่าสุด
- ค้นหาและกรองคำสั่งซื้อ
- ดูรายละเอียดคำสั่งซื้อ
- เปลี่ยนสถานะคำสั่งซื้อ
- เพิ่มสินค้า
- แก้ไขสินค้า
- ลบสินค้า
- Upload รูปสินค้าผ่าน Cloudinary
- ดูรายชื่อผู้ใช้งาน
- เปิด / ปิดการใช้งานบัญชีผู้ใช้

---

## 🧰 Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- ES6 Modules
- Responsive Web Design

### Backend Services

- Firebase Authentication
- Cloud Firestore

### APIs & Services

- Cloudinary
- Longdo Map API
- PromptPay QR

### Development & Deployment

- Git
- GitHub
- GitHub Pages
- Visual Studio Code

---

## 🔄 Application Flow

```mermaid
flowchart TD
    A[ผู้ใช้งานเข้าสู่ PoohShop] --> B{เข้าสู่ระบบแล้วหรือไม่}

    B -- ยัง --> C[Login]
    B -- แล้ว --> H{ประเภทบัญชี}

    C --> D{มีบัญชีแล้วหรือไม่}

    D -- ไม่มี --> E[Register]
    E --> F[Firebase Authentication]
    F --> C

    D -- มี --> G{ลืมรหัสผ่านหรือไม่}

    G -- ใช่ --> RP[Forgot Password]
    RP --> RE[ส่ง Reset Password Email]
    RE --> RA[Firebase Authentication]
    RA --> C

    G -- ไม่ --> LI[Login ด้วย Email และ Password]
    LI --> FA[Firebase Authentication]
    FA --> H

    H -- User --> I[หน้ารายการสินค้า]
    H -- Admin --> AD[Admin Dashboard]

    I --> PF[ข้อมูลส่วนตัว]
    PF --> I

    I --> J[เลือกสินค้า]
    J --> K[เพิ่มสินค้าลงตะกร้า]
    K --> L[Shopping Cart]
    L --> M[Checkout]

    M --> N[โหลดข้อมูลจาก Profile]
    N --> O[ค้นหาที่อยู่]
    O --> P[Longdo Map API]
    P --> Q[Payment]

    Q --> R[PromptPay QR]
    R --> S[ผู้ใช้ยืนยันการชำระเงิน]
    S --> T[สร้าง Order ใน Firestore]
    T --> U[Order Success]
    U --> V[My Orders]
    V --> W[ติดตามสถานะคำสั่งซื้อ]

    AD --> AO[Orders]
    AD --> AP[Products]
    AD --> AU[Users]

    AO --> AO1[ค้นหา / กรอง Orders]
    AO1 --> AO2[ดูรายละเอียด Order]
    AO2 --> AO3[เปลี่ยนสถานะ Order]

    AP --> AP1[เพิ่มสินค้า]
    AP --> AP2[แก้ไขสินค้า]
    AP --> AP3[ลบสินค้า]
    AP1 --> CL[Upload รูปผ่าน Cloudinary]
    AP2 --> CL

    AU --> AU1[ดูรายชื่อผู้ใช้งาน]
    AU1 --> AU2[Active / Inactive User]
```

---

## 📦 Order Flow

```text
เลือกสินค้า
   ↓
Shopping Cart
   ↓
Checkout
   ↓
ข้อมูลผู้รับ
   ↓
ที่อยู่จัดส่ง
   ↓
ค้นหาที่อยู่ด้วย Longdo
   ↓
Payment
   ↓
PromptPay QR
   ↓
ยืนยันการชำระเงิน
   ↓
สร้าง Order
   ↓
รอตรวจสอบ
   ↓
ชำระแล้ว
   ↓
กำลังเตรียมสินค้า
   ↓
จัดส่งแล้ว
   ↓
สำเร็จ
```

Admin สามารถเปลี่ยนสถานะคำสั่งซื้อเป็น `ยกเลิก` ได้

---

## 📋 สถานะคำสั่งซื้อ

| Status | ความหมาย |
| --- | --- |
| Pending Verification | รอตรวจสอบการชำระเงิน |
| Paid | ชำระเงินแล้ว |
| Preparing | กำลังเตรียมสินค้า |
| Shipped | จัดส่งแล้ว |
| Completed | คำสั่งซื้อสำเร็จ |
| Cancelled | ยกเลิกคำสั่งซื้อ |

---

## 📸 Screenshots

### หน้าแรก

แสดงรายการสินค้าจากระบบ และสามารถเพิ่มสินค้าลงตะกร้าได้

![หน้าแรก PoohShop](./screenshots/home-page.png)

### ตะกร้าสินค้า

ผู้ใช้สามารถดูสินค้า เพิ่มหรือลดจำนวน ลบสินค้า และดูยอดรวมทั้งหมดได้

![ตะกร้าสินค้า](./screenshots/cart-page.png)

### Checkout

ระบบดึงข้อมูลผู้ใช้จาก Profile และสามารถค้นหาที่อยู่ผ่าน Longdo Map API

![Checkout](./screenshots/checkout-page.png)

### คำสั่งซื้อของฉัน

ผู้ใช้สามารถดูประวัติคำสั่งซื้อ รายละเอียดสินค้า ยอดรวม และติดตามสถานะคำสั่งซื้อได้

![คำสั่งซื้อของฉัน](./screenshots/my-orders.png)

### ข้อมูลส่วนตัว

ผู้ใช้สามารถดูและแก้ไขข้อมูลส่วนตัว เช่น ชื่อ นามสกุล และเบอร์โทรศัพท์

![ข้อมูลส่วนตัว](./screenshots/profile.png)

### Admin Dashboard

แสดงภาพรวมของระบบ เช่น จำนวน Orders ยอดขายรวม สถานะคำสั่งซื้อ และ Recent Orders

![Admin Dashboard](./screenshots/admin-dashboard.png)

### Admin Orders

Admin สามารถค้นหา กรอง ดูรายละเอียด และเปลี่ยนสถานะคำสั่งซื้อได้

![Admin Orders](./screenshots/admin-orders.png)

### Admin Products

Admin สามารถเพิ่ม แก้ไข และลบสินค้า รวมถึง Upload รูปสินค้าผ่าน Cloudinary

![Admin Products](./screenshots/admin-products.png)

### Admin Users

Admin สามารถดูรายชื่อผู้ใช้งาน และเปิดหรือปิดการใช้งานบัญชีผู้ใช้ได้

![Admin Users](./screenshots/admin-users.png)

---

## 📁 Project Structure

```text
pooh-shop/
│
├── css/
│   ├── admin.css
│   └── style.css
│
├── images/
│   ├── promptpay-qr.png
│   ├── shoe1.jpg
│   ├── shoe2.jpg
│   ├── shoe3.jpg
│   ├── shoe4.jpg
│   └── ...
│
├── screenshots/
│   ├── home-page.png
│   ├── cart-page.png
│   ├── checkout-page.png
│   ├── my-orders.png
│   ├── profile.png
│   ├── admin-dashboard.png
│   ├── admin-orders.png
│   ├── admin-products.png
│   └── admin-users.png
│
├── js/
│   ├── admin-dashboard.js
│   ├── admin-orders.js
│   ├── admin-products.js
│   ├── admin-users.js
│   ├── auth.js
│   ├── cart.js
│   ├── cart-page.js
│   ├── checkout.js
│   ├── config.js
│   ├── firebase.js
│   ├── my-orders.js
│   ├── payment.js
│   ├── products.js
│   ├── profile.js
│   ├── user-status-guard.js
│   ├── user.js
│   └── utils.js
│
├── admin.html
├── admin-orders.html
├── admin-products.html
├── admin-users.html
├── cart.html
├── checkout.html
├── index.html
├── login.html
├── my-orders.html
├── payment.html
├── profile.html
├── register.html
├── .gitignore
├── .prettierrc.json
└── README.md
```

---

## 🔐 Authentication

ระบบใช้ Firebase Authentication สำหรับ

- Register
- Login
- Logout
- Forgot Password
- Reset Password ผ่าน Email

ข้อมูล Profile ของผู้ใช้ถูกจัดเก็บใน Cloud Firestore

### Forgot Password Flow

```text
Login
   ↓
ลืมรหัสผ่าน?
   ↓
กรอก Email
   ↓
Firebase Authentication
   ↓
ส่ง Reset Password Email
   ↓
ผู้ใช้ตั้งรหัสผ่านใหม่
   ↓
กลับเข้าสู่ระบบ
```

---

## 🗄️ Database

Cloud Firestore ใช้จัดเก็บข้อมูลหลักของระบบ

```text
users/
products/
orders/
```

### users

เก็บข้อมูล Profile และสถานะบัญชีผู้ใช้งาน

### products

เก็บข้อมูลสินค้า เช่น ชื่อ ราคา และ URL รูปสินค้า

### orders

เก็บข้อมูลคำสั่งซื้อ รายการสินค้า ข้อมูลจัดส่ง ยอดรวม และสถานะคำสั่งซื้อ

---

## 🖼️ Product Images

รูปสินค้าที่เพิ่มผ่านระบบ Admin จะถูก Upload และจัดเก็บผ่าน Cloudinary

Cloudinary จะส่ง URL ของรูปกลับมาเพื่อจัดเก็บไว้กับข้อมูลสินค้าใน Cloud Firestore

---

## 📍 Address Search

หน้า Checkout ใช้ Longdo Map API สำหรับค้นหาที่อยู่

เมื่อผู้ใช้เลือกสถานที่จาก Suggestion ระบบจะช่วยกรอกข้อมูล เช่น

- แขวง / ตำบล
- เขต / อำเภอ
- จังหวัด
- รหัสไปรษณีย์

ผู้ใช้ยังสามารถแก้ไขข้อมูลที่อยู่ด้วยตัวเองก่อนดำเนินการชำระเงิน

---

## 💳 Payment

ระบบใช้ PromptPay QR สำหรับการชำระเงิน

เมื่อผู้ใช้กดยืนยันว่าชำระเงินแล้ว ระบบจะสร้าง Order ใน Cloud Firestore
โดยสถานะเริ่มต้นคือ

```text
pending_verification
```

จากนั้น Admin จะเป็นผู้ตรวจสอบและเปลี่ยนสถานะคำสั่งซื้อ

> ระบบนี้ยังไม่ได้ใช้ Payment Gateway หรือระบบตรวจสอบการชำระเงินอัตโนมัติ

---

## 👤 User Account Status

บัญชีผู้ใช้รองรับสถานะ

```text
active
inactive
```

Admin สามารถเปลี่ยนสถานะบัญชีผู้ใช้งานได้

หากบัญชีถูกเปลี่ยนเป็น `inactive` ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบ
หรือใช้งานหน้าที่ต้องผ่าน Authentication ได้ตามปกติ

---

## 🔒 Security

ระบบใช้ Firebase Authentication ร่วมกับ Firestore Security Rules
เพื่อควบคุมการเข้าถึงข้อมูล

ตัวอย่างการควบคุมสิทธิ์:

- ผู้ใช้สามารถเข้าถึง Profile ของตัวเอง
- ผู้ใช้สามารถดู Orders ของตัวเอง
- ผู้ใช้ไม่สามารถแก้ไข Profile ของผู้ใช้อื่น
- Admin เท่านั้นที่สามารถจัดการสินค้า
- Admin เท่านั้นที่สามารถเปลี่ยนสถานะ Order
- Admin เท่านั้นที่สามารถเปลี่ยนสถานะ Active / Inactive ของ User
- สิทธิ์ Admin ตรวจสอบจาก UID ที่กำหนดไว้ในระบบ

---

## 💻 วิธีเปิดโปรเจกต์ในเครื่อง

Clone Repository

```bash
git clone https://github.com/Woodpekerrr/pooh-shop.git
```

เข้าโฟลเดอร์

```bash
cd pooh-shop
```

จากนั้นเปิดโปรเจกต์ด้วย Visual Studio Code และใช้งานผ่าน Live Server

> เนื่องจากโปรเจกต์ใช้ JavaScript ES6 Modules จึงแนะนำให้เปิดผ่าน Local Web Server แทนการเปิดด้วย `file://`

---

## 🚀 Deployment

เว็บไซต์ถูก Deploy ผ่าน GitHub Pages

https://woodpekerrr.github.io/pooh-shop/

```text
Branch: main
Directory: / (root)
```

---

## 🔮 Future Improvements

ฟีเจอร์ที่มีแผนพัฒนาต่อ:

- Stock Management
- Size / Variant
- Product Search / Filter
- Payment Gateway
- Email Notification
- Coupon / Discount System
- Dashboard Analytics
- Wishlist
- Product Reviews
- Order Cancellation
- Backend / REST API

---

## 🎯 จุดประสงค์ของโปรเจกต์

PoohShop ถูกพัฒนาขึ้นเพื่อใช้เป็น Portfolio Project และฝึกการพัฒนา
E-Commerce Web Application ตั้งแต่ Frontend ไปจนถึงการเชื่อมต่อ Cloud Services

สิ่งที่ได้ฝึกจากโปรเจกต์นี้:

- Frontend Development
- Firebase Authentication
- Cloud Firestore
- CRUD Operations
- API Integration
- Authentication & Authorization
- Shopping Cart Logic
- Checkout Flow
- Order Management
- Admin Dashboard
- Responsive Web Design
- Git & GitHub
- GitHub Pages Deployment

---

## 👨‍💻 Author

Developed by **Woodpekerrr**

GitHub:  
https://github.com/Woodpekerrr

---

## 📄 License

โปรเจกต์นี้จัดทำขึ้นเพื่อการศึกษาและใช้เป็น Portfolio