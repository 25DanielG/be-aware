(() => {
    const ta = document.querySelector("main .journal textarea");
    const left = document.querySelector(".page-control .page-left");
    const right = document.querySelector(".page-control .page-right");
    const curEl = document.querySelector(".page-control .current");
    const totEl = document.querySelector(".page-control .total");
    const modal = document.querySelector(".tip-modal");
    const modalCloseBtns = modal?.querySelectorAll(".tip-close");
    const modalBackdrop = modal?.querySelector(".tip-backdrop");
    const tipTextEl = modal?.querySelector(".tip-text");
    const hintBtn = document.querySelector(".hint");

    const pageHints = new Map();

    if (!ta || !left || !right || !curEl || !totEl || !hintBtn || !modal || !tipTextEl) {
        console.warn("Pagination init: missing required elements");
        return;
    }

    let timer = null;
    let lastSent = "";
    let latest = "";

    const pages = [
        { value: "", readOnly: false }
    ];
    let idx = 0;

    const signature = (s) => `${s.length}:${s.slice(0, 50)}`;

    async function requestTip() {
        console.log("Requesting tip...");
        const text = (window.JournalPager?.text?.() ?? ta.value ?? "").trim();
        if (text.length < 20) return;

        const sig = signature(text);
        if (sig === lastSent) return;

        try {
            const res = await fetch("/api/journal/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error(`Prompt failed: ${res.status}`);
            const data = await res.json();
            const tip =
                typeof data?.prompt === "string"
                    ? data.prompt.trim()
                    : typeof data?.prompt?.text === "string"
                        ? data.prompt.text.trim()
                        : typeof data?.prompt?.message === "string"
                            ? data.prompt.message.trim()
                            : "";

            lastSent = sig;

            if (tip) {
                showHint(tip);
                pageHints.set(idx, tip);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function scheduleTip() {
        if (pages[idx]?.readOnly) return;
        console.log("Scheduling tip...");
        clearTimeout(timer);
        timer = setTimeout(requestTip, 1000 * 15); // 15s
    }

    ta.addEventListener("input", () => {
        pageHints.delete(idx);
        scheduleTip();
        saveCurrent();
    });

    hintBtn.addEventListener("click", () => {
        if (!latest) return;
        tipTextEl.textContent = latest;
        modal.hidden = false;
        modal.querySelector(".tip-close")?.focus();
    });

    const closeModal = () => { modal.hidden = true; };
    modalCloseBtns?.forEach(btn => btn.addEventListener("click", closeModal));
    modalBackdrop?.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
        if (!modal.hidden && e.key === "Escape") closeModal();
    });

    function showHint(tip) {
        latest = tip;
        tipTextEl.textContent = tip;
        hintBtn.hidden = false;
        hintBtn.classList.add("is-visible");
    }

    function hideHint() {
        latest = "";
        hintBtn.classList.remove("is-visible");
        hintBtn.hidden = true;
        if (!modal.hidden) modal.hidden = true;
    }

    function render() {
        const p = pages[idx];
        ta.value = p.value;
        ta.readOnly = p.readOnly;
        ta.classList.toggle("readonly", p.readOnly);
        curEl.textContent = String(idx + 1);
        totEl.textContent = String(pages.length);
        left.classList.toggle("disabled", idx === 0);
        right.classList.toggle("disabled", idx === pages.length - 1);
    }

    function saveCurrent() {
        pages[idx].value = ta.value;
    }

    function go(delta) {
        saveCurrent();
        const next = idx + delta;
        if (next < 0 || next > pages.length - 1) return;
        hideHint();
        clearTimeout(timer);
        lastSent = "";
        idx = next;
        render();
        const cached = pageHints.get(idx);
        if (cached) {
            showHint(cached);
        } else if (!pages[idx].readOnly) {
            scheduleTip();
        }
    }

    window.JournalPager = {
        addPage(init = { value: '', readOnly: false }) {
            saveCurrent();
            pages.push({ value: init.value ?? '', readOnly: !!init.readOnly });
            idx = pages.length - 1;
            render();
        },
        setReadOnly(pageIndex, ro) {
            if (pageIndex < 0 || pageIndex >= pages.length) return;
            pages[pageIndex].readOnly = !!ro;
            if (pageIndex === idx) render();
        },
        getState() {
            saveCurrent();
            return { index: idx, pages: pages.map(p => ({ ...p })) };
        },
        goTo(n) {
            if (n < 1 || n > pages.length) return;
            saveCurrent();
            hideHint();
            clearTimeout(timer);
            lastSent = "";
            idx = n - 1;
            render();
            const cached = pageHints.get(idx);
            if (cached) {
                showHint(cached);
            } else if (!pages[idx].readOnly) {
                scheduleTip();
            }
        },
        index() {
            return idx;
        },
        text() {
            saveCurrent();
            return pages[idx].value;
        },
        init(texts) {
            saveCurrent();
            pages.length = 0;
            texts.forEach(txt => {
                pages.push({ value: txt, readOnly: true });
            });
            idx = 0;
            hideHint();
            clearTimeout(timer);
            lastSent = "";
            pageHints.clear();
            render();
        },
        resetPrompt() {
            hideHint();
            clearTimeout(timer);
            lastSent = "";
        }
    };

    left.addEventListener("click", () => go(-1));
    right.addEventListener("click", () => go(1));

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); go(1); }
    });

    ta.addEventListener("focus", () => {
        if (ta.readOnly) ta.blur();
    });

    render();
})();