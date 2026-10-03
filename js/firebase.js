import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyCNynpbH5EADFW7oAwWpFL24ik7zlHA1tk",
  authDomain: "shoeshop-306ec.firebaseapp.com",
  projectId: "shoeshop-306ec",
  storageBucket: "shoeshop-306ec.firebasestorage.app",
  messagingSenderId: "263506073283",
  appId: "1:263506073283:web:7a35fcb1926d88de157476"
}
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
export { app, auth, db }
