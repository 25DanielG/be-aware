const logo = document.querySelector('aside .sidebar #logo');
const sidebar = document.querySelector('aside');

setTimeout(() => {
    document.body.classList.add('initialized');
}, 300);

if (logo) {
    logo.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
}

function localISO(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function getActiveCalendarISO() {
    const el = document.querySelector(".calendar .day.active");
    return el?.dataset?.date || localISO();
}

async function loadDay(iso) {
    const days = document.querySelectorAll(".calendar .day");
    days.forEach(d => d.classList.remove("active"));
    const active = Array.from(days).find(d => d.dataset.date === iso);
    if (active) active.classList.add("active");

    const ta = document.querySelector("main .journal textarea");
    if (ta) { ta.value = "Loading…"; ta.readOnly = true; }

    const res = await fetch(`/journal/date?date=${encodeURIComponent(iso)}`);
    if (!res.ok) throw new Error(`GET /journal/date ${res.status}`);
    const { entries } = await res.json();

    const texts = entries.map(e => e.content ?? e.journal ?? "");
    if (texts.length) {
        JournalPager.init(texts); // readonly pages
    } else {
        JournalPager.init([""]); // blank page
        JournalPager.setReadOnly(JournalPager.index?.() ?? JournalPager.getIndex?.(), false);
    }
}

const send = document.querySelector("#send-journal");
const add = document.querySelector("#add-journal");

if (send) {
    send.addEventListener("click", async () => {
        try {
            send.style.pointerEvents = "none";

            const text = window.JournalPager.getText?.() ?? window.JournalPager.text?.();
            if (!text || !text.trim()) {
                alert("Cannot submit empty journal entry.");
                return;
            }
            StatusUI.show("Sending...");

            const date = getActiveCalendarISO();
            const res = await fetch("/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text, date }),
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(`POST /journal failed: ${res.status} ${msg}`);
            }

            StatusUI.success("Saved");
            await new Promise(r => setTimeout(r, 900));
            const idx = (window.JournalPager.getIndex?.() ?? window.JournalPager.index?.());
            window.JournalPager.setReadOnly(idx, true);
        } catch (e) {
            console.error(e);
            alert("Failed to submit journal. Please try again.");
        } finally {
            StatusUI.hide();
            send.style.pointerEvents = "";
        }
    });
}


if (add) {
    add.addEventListener("click", () => {
        const text = window.JournalPager.text();
        if (!text.trim()) {
            alert("Cannot add a new page while the current one is empty.");
            return;
        }
        window.JournalPager.addPage();
    });
}

// init calendar

const calendar = document.querySelector("aside .sidebar .calendar");
if (calendar) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const lastSunday = new Date(today); lastSunday.setDate(today.getDate() - today.getDay());
    calendar.innerHTML = "";
    for (let d = new Date(lastSunday); d <= today; d.setDate(d.getDate() + 1)) {
        const dayEl = document.createElement("div");
        dayEl.className = "day";
        dayEl.textContent = d.toLocaleDateString(undefined, { weekday: "short" })[0];
        dayEl.dataset.date = localISO(d);
        if (d.getTime() === today.getTime()) {
            dayEl.classList.add("today", "active");
        }
        calendar.appendChild(dayEl);
    }
}

const initCal = () => {
    const days = document.querySelectorAll(".calendar .day");
    if (!days.length || !window.JournalPager) return;

    days.forEach(dayEl => {
        dayEl.addEventListener("click", async () => {
            const iso = dayEl.dataset.date;
            if (!iso) return;
            try {
                window.JournalPager.resetPrompt();
                await loadDay(iso);
            }
            catch (e) {
                console.error(e);
                alert("Could not load journals for that day.");
                const ta = document.querySelector("main .journal textarea");
                if (ta) { ta.value = ""; ta.readOnly = false; }
            }
        });
    });

    const todayISO = localISO(); // today
    loadDay(todayISO).catch(e => {
        console.error(e);
        const ta = document.querySelector("main .journal textarea");
        if (ta) { ta.value = ""; ta.readOnly = false; }
    });
}

initCal();

const backgroundLinks = document.querySelectorAll(".background-link");
if (backgroundLinks) {
    backgroundLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            if (link.classList.contains("null")) {
                document.body.style.backgroundImage = "";
            } else {
                const img = link.querySelector("img");
                if (img) {
                    document.body.style.backgroundImage = `url(${img.src})`;
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                }
            }
        });
    });
}
