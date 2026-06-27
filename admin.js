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
   LOGIN
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

const footer = document.getElementById("footer");

/* =========================
   STATE
========================= */
let selectedSlots = {};

/* =========================
   DATE DISPLAY
========================= */
function updateDateDisplay(date) {
    const display = document.getElementById("dateDisplay");
    if (!display) return;
    if (!date) {
        display.textContent = "Izaberi datum";
    } else {
        const [y, m, d] = date.split("-");
        display.textContent = `${d}.${m}.${y}`;
    }
}

/* =========================
   RENDER
========================= */
function renderSlots() {
    slots.forEach(slot => {
        const time = slot.textContent.trim();
        if (selectedSlots[time]) {
            slot.classList.add("active");
        } else {
            slot.classList.remove("active");
        }
    });
}

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
        footer.style.display = "block";

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
    footer.style.display = "none";

    showSuccess("👋 Uspešno ste se izlogovali");
});

/* =========================
   AUTO LOGIN
========================= */
if (sessionStorage.getItem("admin") === "true") {
    loginPage.style.display = "none";
    adminPage.style.display = "block";
    footer.style.display = "block";
} else {
    footer.style.display = "none";
}

/* =========================
   SLOT CLICK (PC + MOBILE FIX)
========================= */
slots.forEach(slot => {
    let touched = false;

    slot.addEventListener("touchend", (e) => {
        e.preventDefault();
        touched = true;
        const time = slot.textContent.trim();
        if (selectedSlots[time]) {
            delete selectedSlots[time];
        } else {
            selectedSlots[time] = true;
        }
        renderSlots();
        setTimeout(() => { touched = false; }, 300);
    }, { passive: false });

    slot.addEventListener("click", () => {
        if (touched) return;
        const time = slot.textContent.trim();
        if (selectedSlots[time]) {
            delete selectedSlots[time];
        } else {
            selectedSlots[time] = true;
        }
        renderSlots();
    });
});

/* =========================
   RESET
========================= */
function resetSlots() {
    selectedSlots = {};
    renderSlots();
}

/* =========================
   SAVE
========================= */
saveBtn.addEventListener("click", async () => {
    const date = adminDate.value;

    if (!date) {
        showSuccess("❌ Izaberi datum", true);
        return;
    }

    try {
        await db.collection("slots").doc(date).set(selectedSlots);

        localStorage.setItem("lastSavedDate", date);

        showSuccess("✔ Termini uspešno sačuvani");

        const doc = await db.collection("slots").doc(date).get();

        selectedSlots = doc.exists ? (doc.data() || {}) : {};

        renderSlots();
        loadBookings(date);

    } catch (err) {
        console.log(err);
        showSuccess("❌ Greška pri čuvanju", true);
    }
});

/* =========================
   DELETE BOOKING
========================= */
async function deleteBooking(id) {
    try {
        await db.collection("bookings").doc(id).delete();

        showSuccess("✔ Termin obrisan");

        const date = adminDate.value || localStorage.getItem("lastSavedDate");
        if (date) loadBookings(date);

    } catch (err) {
        console.log(err);
        showSuccess("❌ Greška pri brisanju", true);
    }
}

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
            slots.forEach(slot => {
                slot.classList.remove("taken");
                slot.style.pointerEvents = "auto";
                slot.style.opacity = "1";
            });
            return;
        }

        let html = "";
        const takenTimes = new Set();

        snap.forEach(doc => {
            const b = doc.data();
            const id = doc.id;

            takenTimes.add(b.vreme);

            html += `
                <div class="booking-card">
                    <p><b>Ime:</b> ${b.ime}</p>
                    <p><b>Email:</b> ${b.email}</p>
                    <p><b>Telefon:</b> ${b.telefon}</p>
                    <p><b>Usluga:</b> ${b.usluga}</p>
                    <p><b>Datum:</b> ${b.datum}</p>
                    <p><b>Vreme:</b> ${b.vreme}</p>
                    <button class="delete-btn" data-id="${id}">
                        Obriši termin
                    </button>
                </div>
            `;
        });

        bookingsList.innerHTML = html;

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                deleteBooking(btn.getAttribute("data-id"));
            });
        });

        /* LOCK TAKEN */
        slots.forEach(slot => {
            const time = slot.textContent.trim();

            if (takenTimes.has(time)) {
                slot.classList.add("taken");
                slot.classList.remove("active");
                slot.style.pointerEvents = "none";
                slot.style.opacity = "0.5";
            } else {
                slot.classList.remove("taken");
                slot.style.pointerEvents = "auto";
                slot.style.opacity = "1";
            }
        });

    } catch (err) {
        console.log(err);
        bookingsList.innerHTML = "<p>Greška pri učitavanju</p>";
        showSuccess("❌ Greška pri učitavanju", true);
    }
}

/* =========================
   DATE CHANGE
========================= */
adminDate.addEventListener("change", async () => {
    const date = adminDate.value;

    updateDateDisplay(date);

    if (!date) {
        resetSlots();
        bookingsList.innerHTML = "";
        localStorage.removeItem("lastSavedDate");
        slots.forEach(slot => slot.style.display = "");
        return;
    }

    resetSlots();

    const doc = await db.collection("slots").doc(date).get();

    selectedSlots = doc.exists ? (doc.data() || {}) : {};

    renderSlots();
    loadBookings(date);
});

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
    setTimeout(() => window.scrollTo(0, 0), 10);

    const savedDate = localStorage.getItem("lastSavedDate");
    if (!savedDate) return;

    adminDate.value = savedDate;
    updateDateDisplay(savedDate);

    const doc = await db.collection("slots").doc(savedDate).get();

    selectedSlots = doc.exists ? (doc.data() || {}) : {};

    renderSlots();
    loadBookings(savedDate);
});</div>
<label>Vreme:</label>
<div class="slots">
<button type="button" class="slot">06:00</button>
<button type="button" class="slot">07:00</button>
<button type="button" class="slot">08:00</button>
<button type="button" class="slot">09:00</button>
<button type="button" class="slot">10:00</button>
<button type="button" class="slot">11:00</button>
<button type="button" class="slot">12:00</button>
<button type="button" class="slot">13:00</button>
<button type="button" class="slot">14:00</button>
<button type="button" class="slot">15:00</button>
<button type="button" class="slot">16:00</button>
<button type="button" class="slot">17:00</button>
<button type="button" class="slot">18:00</button>
<button type="button" class="slot">19:00</button>
<button type="button" class="slot">20:00</button>
<button type="button" class="slot">21:00</button>
</div>
<button id="saveBtn">Pusti termine</button>
<h2>Zakazani termini</h2>
<div id="bookingsList"></div>
</section>
</div>
<!-- SUCCESS CARD -->
<div id="successCard" class="success-card"></div>
<!-- FOOTER -->
<footer class="footer" id="footer">
<p>© <span id="year"></span> JJ Admin | Sva prava zadržana</p>
</footer>
<script>
document.getElementById("year").textContent = new Date().getFullYear();
</script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="admin.js"></script>
</body>
</html>
