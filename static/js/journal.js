(() => {
    const ta = document.querySelector("main .journal textarea");
    const left = document.querySelector(".page-control .page-left");
    const right = document.querySelector(".page-control .page-right");
    const curEl = document.querySelector(".page-control .current");
    const totEl = document.querySelector(".page-control .total");

    if (!ta || !left || !right || !curEl || !totEl) {
        console.warn("Pagination init: missing required elements");
        return;
    }

    const pages = [
        { value: "", readOnly: false }
    ];
    let idx = 0;

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
        idx = next;
        render();
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
            idx = n - 1;
            render();
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
            render();
        }
    };

    ta.addEventListener("input", () => saveCurrent());

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