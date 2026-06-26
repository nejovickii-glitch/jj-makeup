const firebaseConfig = {
  apiKey: "AIzaSyAado2iT2H6gEwUhoQvAJQHItGf-nFjH7o",
  authDomain: "jj-makeup-web.firebaseapp.com",
  projectId: "jj-makeup-web",
  storageBucket: "jj-makeup-web.firebasestorage.app",
  messagingSenderId: "64389217512",
  appId: "1:64389217512:web:baecd738d273ee4732dd5d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================
   LOGIN PODACI
========================= */
const ADMIN_USER = "admin";
const ADMIN_PASS = "123456";

/* =========================
   ELEMENTI
========================= */
const loginPage = document.getElementById("loginPage");
const adminPage = document.getElementById("adminPage");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const slots = document.querySelectorAll(".slot");
const saveBtn = document.getElementById("saveBtn");
const dateInput = document.getElementById("adminDate");
const bookingsList = document.getElementById("bookingsList");

/* =========================
   STATE
========================= */
let selectedSlots = {};

/* =========================
   INIT VIEW (AUTO LOGIN)
========================= */
function initAuthView() {
  if (sessionStorage.getItem("logged") === "true") {
    loginPage.style.display = "none";
    adminPage.style.display = "block";
  } else {
    loginPage.style.display = "block";
    adminPage.style.display = "none";
  }
}

initAuthView();

/* =========================
   LOGIN
========================= */
loginBtn.addEventListener("click", () => {

  const user = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {

    sessionStorage.setItem("logged", "true");
    initAuthView();

    showToast("✔ Uspešno ste se prijavili");

  } else {
    showToast("❌ Pogrešno korisničko ime ili lozinka", "error");
  }

});

/* =========================
   LOGOUT
========================= */
logoutBtn.addEventListener("click", () => {

  sessionStorage.removeItem("logged");
  initAuthView();

  showToast("👋 Uspešno ste se odjavili");
});

/* =========================
   SLOT TOGGLE
========================= */
slots.forEach(slot => {

  slot.addEventListener("click", () => {

    slot.classList.toggle("active");

    const time = slot.textContent;
    selectedSlots[time] = slot.classList.contains("active");

  });

});

/* =========================
   LOAD SLOTOVI
========================= */
dateInput.addEventListener("change", async () => {

  const date = dateInput.value;
  if (!date) return;

  try {

    const docSnap = await db.collection("slots").doc(date).get();
    const data = docSnap.exists ? docSnap.data() : {};

    selectedSlots = { ...data };

    slots.forEach(slot => {
      const time = slot.textContent;
      slot.classList.toggle("active", !!data[time]);
    });

    loadBookings(date);

  } catch (err) {
    console.log(err);
    showToast("Greška pri učitavanju slotova", "error");
  }
});

/* =========================
   SAVE SLOTOVI
========================= */
saveBtn.addEventListener("click", async () => {

  const date = dateInput.value;

  if (!date) {
    showToast("❌ Izaberi datum!", "error");
    return;
  }

  try {

    await db.collection("slots").doc(date).set(selectedSlots);

    showToast("✔ Termini uspešno sačuvani");

    loadBookings(date);

  } catch (err) {
    console.log(err);
    showToast("❌ Greška pri čuvanju!", "error");
  }
});

/* =========================
   LOAD BOOKINGS
========================= */
async function loadBookings(date) {

  bookingsList.innerHTML = "Učitavanje...";

  try {

    const snap = await db.collection("bookings")
      .where("datum", "==", date)
      .get();

    if (snap.empty) {
      bookingsList.innerHTML = "<p>Nema zakazanih termina</p>";
      return;
    }

    let html = "";

    snap.forEach(doc => {

      const b = doc.data();

      html += `
        <div class="booking-card">
          <p><b>Ime:</b> ${b.ime}</p>
          <p><b>Email:</b> ${b.email}</p>
          <p><b>Telefon:</b> ${b.telefon}</p>
          <p><b>Usluga:</b> ${b.usluga}</p>
          <p><b>Datum:</b> ${b.datum}</p>
          <p><b>Vreme:</b> ${b.vreme}</p>
        </div>
      `;
    });

    bookingsList.innerHTML = html;

  } catch (err) {
    console.log(err);
    bookingsList.innerHTML = "<p>Greška pri učitavanju</p>";
  }
}

/* =========================
   TOAST (CLEAN VERSION)
========================= */
function showToast(message, type = "success") {

  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  if (type === "error") {
    toast.style.background = "rgba(120,60,60,0.95)";
  } else {
    toast.style.background = "rgba(200,159,130,0.95)";
  }

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================
   SCROLL FIX
========================= */
window.addEventListener("load", () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);
});
