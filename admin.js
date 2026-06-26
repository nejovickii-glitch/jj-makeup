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

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const adminDate = document.getElementById("adminDate");
const saveBtn = document.getElementById("saveBtn");

const slots = document.querySelectorAll(".slot");
const bookingsList = document.getElementById("bookingsList");

/* =========================
   STATE
========================= */
let selectedSlots = {};

/* =========================
   SUCCESS POPUP
========================= */
function showSuccess(message, isError = false) {

    const card = document.getElementById("successCard");
    if (!card) return;

    card.textContent = message;
    card.classList.add("show");

    card.style.background = isError ? "#8b3a3a" : "#fff";
    card.style.color = isError ? "#fff" : "#5c4538";

    setTimeout(() => {
        card.classList.remove("show");
    }, 2500);
}

/* =========================
   LOGIN
========================= */
loginBtn.addEventListener("click", () => {

    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (user === ADMIN_USER && pass === ADMIN_PASS) {

        sessionStorage.setItem("admin", "true");

        loginPage.style.display = "none";
        adminPage.style.display = "block";

        showSuccess("✔ Uspešno ste se ulogovali");

    } else {
        showSuccess("❌ Pogrešno korisničko ime ili lozinka", true);
    }

});

/* =========================
   LOGOUT
========================= */
logoutBtn.addEventListener("click", () => {

    sessionStorage.removeItem("admin");
    localStorage.removeItem("lastSavedDate");

    loginPage.style.display = "block";
    adminPage.style.display = "none";

    showSuccess("👋 Uspešno ste se izlogovali");

});

/* =========================
   AUTO LOGIN
========================= */
if (sessionStorage.getItem("admin") === "true") {
    loginPage.style.display = "none";
    adminPage.style.display = "block";
}

/* =========================
   SLOT SELEKCIJA (🔥 FIXED MOBILE)
========================= */
slots.forEach(slot => {

    slot.addEventListener("click", () => {

        const time = slot.textContent.trim();

        const isActive = slot.classList.toggle("active");

        selectedSlots[time] = isActive;

        /* 🔥 MOBILE FORCE UI UPDATE */
        slot.style.transform = "scale(1.04)";
        setTimeout(() => {
            slot.style.transform = "";
        }, 80);
    });

});

/* =========================
   RESET SLOTOVA
========================= */
function resetSlots() {
    selectedSlots = {};

    slots.forEach(slot => {
        slot.classList.remove("active");
    });
}

/* =========================
   SAVE TERMINA
========================= */
saveBtn.addEventListener("click", async () => {

    const date = adminDate.value;

    if (!date) {
        showSuccess("❌ Izaberi datum", true);
        return;
    }

    try {

        await db.collection("slots").doc(date).set(selectedSlots);

        showSuccess("✔ Termini uspešno sačuvani");

        localStorage.setItem("lastSavedDate", date);

        loadBookings(date);

    } catch (err) {
        console.log(err);
        showSuccess("❌ Greška pri čuvanju", true);
    }
});

/* =========================
   DATE CHANGE
========================= */
adminDate.addEventListener("change", async () => {

    const date = adminDate.value;

    if (!date) return;

    localStorage.setItem("lastSavedDate", date);

    resetSlots();

    try {

        const doc = await db.collection("slots").doc(date).get();

        if (doc.exists) {
            selectedSlots = doc.data() || {};
        }

        slots.forEach(slot => {
            const time = slot.textContent.trim();

            if (selectedSlots[time]) {
                slot.classList.add("active");
            }
        });

        loadBookings(date);

    } catch (err) {
        console.log(err);
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
        showSuccess("❌ Greška pri učitavanju", true);
    }
}

/* =========================
   INIT (RESTORE STATE)
========================= */
window.addEventListener("load", async () => {

    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 10);

    const savedDate = localStorage.getItem("lastSavedDate");

    if (!savedDate) return;

    adminDate.value = savedDate;

    try {

        const doc = await db.collection("slots").doc(savedDate).get();

        if (doc.exists) {
            selectedSlots = doc.data() || {};
        }

        slots.forEach(slot => {
            const time = slot.textContent.trim();

            if (selectedSlots[time]) {
                slot.classList.add("active");
            }
        });

        loadBookings(savedDate);

    } catch (err) {
        console.log(err);
    }
});
