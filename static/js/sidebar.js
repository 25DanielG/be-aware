const logo = document.querySelector('aside .sidebar .logo');
const sidebar = document.querySelector('aside');

setTimeout(() => {
    document.body.classList.add('initialized');
}, 300);

if (logo) {
    logo.addEventListener("click", () => {
        sidebar.classList.toggle("closed");
    });
}

const send = document.querySelector("#send-journal");
const add = document.querySelector("#add-journal");

if (send) {
    send.addEventListener("click", async () => {
        try {
            send.style.pointerEvents = "none";
            // get text from pager
            const text = window.JournalPager.getText?.() ?? window.JournalPager.text?.();
            if (!text || !text.trim()) {
                alert("Cannot submit empty journal entry.");
                return;
            }
            const res = await fetch("/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text }),
            });
            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(`POST /journal failed: ${res.status} ${msg}`);
            }
            console.log(res);
            // mark page read-only
            const idx = (window.JournalPager.getIndex?.() ?? window.JournalPager.index?.());
            window.JournalPager.setReadOnly(idx, true);
        } catch (e) {
            console.error(e);
            alert("Failed to submit journal. Please try again.");
        } finally {
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