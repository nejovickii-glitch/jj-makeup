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
   LOGIN
========================= */
loginBtn.addEventListener("click", () => {

  const user = usernameInput.value;
  const pass = passwordInput.value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {

    sessionStorage.setItem("logged", "true");

    loginPage.style.display = "none";
    adminPage.style.display = "block";

    showSuccess("✔ Uspešno ste se prijavili");

  } else {
    showError("❌ Pogrešno korisničko ime ili lozinka");
  }

});

/* =========================
   LOGOUT
========================= */
logoutBtn.addEventListener("click", () => {

  sessionStorage.removeItem("logged");

  loginPage.style.display = "flex";
  adminPage.style.display = "none";

  showSuccess("👋 Uspešno ste se odjavili");
});

/* =========================
   AUTO LOGIN
========================= */
if (sessionStorage.getItem("logged") === "true") {
  loginPage.style.display = "none";
  adminPage.style.display = "block";
}

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
    showError("Greška pri učitavanju slotova");
  }
});

/* =========================
   SAVE SLOTOVI
========================= */
saveBtn.addEventListener("click", async () => {

  const date = dateInput.value;

  if (!date) {
    showError("❌ Izaberi datum!");
    return;
  }

  try {

    await db.collection("slots").doc(date).set(selectedSlots);

    showSuccess("✔ Termini su uspešno sačuvani!");

    loadBookings(date);

  } catch (err) {
    console.log(err);
    showError("❌ Greška pri čuvanju!");
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

          <button class="delete-btn" onclick="deleteBooking('${doc.id}')">
            Obriši termin
          </button>
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
   DELETE BOOKING (NOVO)
========================= */
async function deleteBooking(id) {

  try {

    await db.collection("bookings").doc(id).delete();

    showSuccess("🗑 Termin uspešno obrisan");

    const date = dateInput.value;
    if (date) loadBookings(date);

  } catch (err) {
    console.log(err);
    showError("❌ Greška pri brisanju");
  }
}

/* =========================
   SUCCESS UI
========================= */
function showSuccess(message) {

  const el = document.getElementById("successCard");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}

/* =========================
   ERROR UI (TOAST)
========================= */
function showError(message) {

  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

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
