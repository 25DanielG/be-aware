const StatusUI = (() => {
    const el = document.getElementById("status-overlay");
    const text = el?.querySelector(".status-text");
    return {
        show(msg = "Sending…") {
            if (!el) return;
            el.classList.remove("success");
            if (text) text.textContent = msg;
            el.style.display = "grid";
            el.setAttribute("aria-hidden", "false");
        },
        success(msg = "Saved!") {
            if (!el) return;
            el.classList.add("success");
            if (text) text.textContent = msg;
        },
        hide() {
            if (!el) return;
            el.style.display = "none";
            el.setAttribute("aria-hidden", "true");
            el.classList.remove("success");
        }
    };
})();