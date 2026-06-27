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

const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");

/* =========================
   UČITAVANJE TERMINA
========================= */

dateInput.addEventListener("change", async () => {
    const date = dateInput.value;
    if (!date) return;

    timeSelect.innerHTML = `<option>Učitavanje...</option>`;

    try {
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        const slotDoc = await db.collection("slots").doc(date).get();
        const slots = slotDoc.exists ? slotDoc.data() : {};

        const bookingsSnap = await db.collection("bookings")
            .where("datum", "==", date)
            .get();

        const taken = [];
        bookingsSnap.forEach(doc => {
            taken.push(doc.data().vreme);
        });

        const available = Object.keys(slots)
            .filter(time => {
                if (slots[time] !== true) return false;
                if (taken.includes(time)) return false;

                // sakrij prosle termine ako je danas
                if (date === today) {
                    const [hours, minutes] = time.split(":").map(Number);
                    const slotTime = new Date();
                    slotTime.setHours(hours, minutes, 0, 0);
                    if (slotTime < now) return false;
                }

                return true;
            })
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        timeSelect.innerHTML = `<option value="">Izaberi vreme</option>`;

        if (available.length === 0) {
            timeSelect.innerHTML = `<option>Nema slobodnih termina</option>`;
            return;
        }

        available.forEach(time => {
            const opt = document.createElement("option");
            opt.value = time;
            opt.textContent = time;
            timeSelect.appendChild(opt);
        });

    } catch (err) {
        console.log(err);
        timeSelect.innerHTML = `<option>Greška</option>`;
    }
});

/* =========================
   BOOKING + EMAILJS
========================= */

document.getElementById("bookingForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const date = dateInput.value;
    const time = timeSelect.value;

    const service = document.getElementById("service").value;
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;

    if (!date || !time) {
        showToast("Izaberi datum i vreme", "error");
        return;
    }

    try {

        await db.collection("bookings").add({
            datum: date,
            vreme: time,
            usluga: service,
            ime: name,
            telefon: phone,
            email: email,
            createdAt: Date.now()
        });

        emailjs.send("service_4way7mc", "template_h7n7pjj", {
            ime: name,
            email: email,
            datum: date,
            vreme: time,
            usluga: service
        });


        // ✅ NOVO - SUCCESS CARD
        showSuccessCard("✔ Uspešno ste zakazali termin!");

        document.getElementById("bookingForm").reset();
        timeSelect.innerHTML = `<option value="">Izaberite datum</option>`;

    } catch (err) {
        console.log(err);
        showToast("Greška pri zakazivanju", "error");
    }
});

/* =========================
   TOAST
========================= */

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    if (type === "error") {
        toast.classList.remove("success");
    }

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* =========================
   SUCCESS CARD (NOVO)
========================= */

function showSuccessCard(message) {

    const card = document.getElementById("successCard");

    if (!card) return;

    card.textContent = message;
    card.classList.add("show");

    setTimeout(() => {
        card.classList.remove("show");
    }, 3500);
}

/* =========================
   SCROLL FIX
========================= */

window.addEventListener("load", () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 10);
});
