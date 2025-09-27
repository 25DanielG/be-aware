const chartBuckets = {
    day: [],
    week: [],
    month: []
};

(() => {
    const el = document.getElementById("graph-carousel");
    if (!el) return;

    const canvCurr = el.querySelector(".gc-current");
    const btnPrev = el.querySelector(".gc-prev-btn");
    const btnNext = el.querySelector(".gc-next-btn");
    const pipsWrap = el.querySelector(".gc-pips");
    const tipEl = el.querySelector(".gc-tip");

    const btnDay = document.querySelector("aside .nav-link.day");
    const btnWeek = document.querySelector("aside .nav-link.week");
    const btnMonth = document.querySelector("aside .nav-link.month");
    console.log(btnDay, btnWeek, btnMonth);
    if (!btnDay || !btnWeek || !btnMonth) return;

    const buttons = { day: btnDay, week: btnWeek, month: btnMonth };

    /** @type {Chart|null} */
    let chart = null;

    /**
     * Internally we keep an array of { config: ChartJsConfig, tip: string }
     * regardless of how the caller provided it.
     * @type {Array<{config:any, tip:string}>}
     */
    let items = [];
    let idx = 0;

    function setActive(tf) {
        Object.entries(buttons).forEach(([k, el]) => {
            if (!el) return;
            el.classList.toggle("active", k === tf);
            el.setAttribute("aria-current", k === tf ? "page" : "false");
        });
    }

    function setView(tf) {
        const bucket = chartBuckets[tf] || [];
        setActive(tf);

        if (!Array.isArray(bucket) || bucket.length === 0) {
            try { StatusUI?.show?.(`No ${tf} charts yet`); setTimeout(() => StatusUI?.hide?.(), 900); } catch { }
            GraphCarousel.set([]);
            return;
        }

        GraphCarousel.set(bucket);
    }

    btnDay.addEventListener("click", (e) => { e.preventDefault(); setView("day"); });
    btnWeek.addEventListener("click", (e) => { e.preventDefault(); setView("week"); });
    btnMonth.addEventListener("click", (e) => { e.preventDefault(); setView("month"); });

    function destroyChart() {
        if (chart && typeof chart.destroy === "function") chart.destroy();
        chart = null;
    }
    function makeChart(canvas, cfg) {
        if (!cfg) return null;
        return new Chart(canvas.getContext("2d"), cfg);
    }

    function normalize(one) {
        if (!one) return null;
        if (one.chartConfig) {
            return { config: one.chartConfig, tip: one.tip ?? "" };
        }
        if (one.config) {
            return { config: one.config, tip: one.tip ?? "" };
        }
        return { config: one, tip: "" };
    }

    function renderPips() {
        pipsWrap.innerHTML = "";
        items.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = "gc-pip" + (i === idx ? " is-active" : "");
            pipsWrap.appendChild(dot);
        });
    }

    function render() {
        destroyChart();
        const current = items[idx] || null;
        chart = makeChart(canvCurr, current?.config || null);

        if (tipEl) tipEl.textContent = current?.tip || ""; // tip text

        btnPrev.disabled = idx === 0; // controls
        btnNext.disabled = idx >= items.length - 1 || items.length === 0;

        renderPips();
    }

    function go(delta) {
        const next = idx + delta;
        if (next < 0 || next > items.length - 1) return;
        idx = next;
        render();
    }

    setActive("week");

    window.GraphCarousel = {
        set(arr) {
            const list = Array.isArray(arr) ? arr : [];
            items = list.map(normalize).filter(Boolean);
            idx = Math.min(idx, Math.max(0, items.length - 1));
            render();
        },
        add(one) {
            const n = normalize(one);
            if (!n) return;
            items.push(n);
            if (items.length === 1) idx = 0;
            render();
        },
        insertAt(i, one) {
            const n = normalize(one);
            if (!n) return;
            const clamped = Math.max(0, Math.min(i, items.length));
            items.splice(clamped, 0, n);
            if (items.length === 1) idx = 0;
            render();
        },
        removeAt(i) {
            if (i < 0 || i >= items.length) return;
            items.splice(i, 1);
            idx = Math.min(idx, Math.max(0, items.length - 1));
            render();
        },
        next() { go(1); },
        prev() { go(-1); },
        getIndex() { return idx; },
        getItems() { return items.slice(); }
    };

    btnPrev.addEventListener("click", () => go(-1));
    btnNext.addEventListener("click", () => go(1));
    document.addEventListener("keydown", e => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });

    let rAf;
    const onResize = () => { cancelAnimationFrame(rAf); rAf = requestAnimationFrame(render); };
    window.addEventListener("resize", onResize);
})();

const initializeGraphs = async (buckets) => {
    const timeframes = ["day", "week", "month"];
    for (const timeframe of timeframes) {
        const types = ["pie", "area", "primary", "bar-line"];
        if (!Array.isArray(buckets[timeframe])) continue;
        for (const type of types) {
            const res = await fetch(`api/journals/visualize/${timeframe}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: type })
            });
            if (!res.ok) {
                console.error(`Failed to fetch ${timeframe} data:`, await res.json());
                continue;
            }
            const data = await res.json();
            buckets[timeframe].push(data);
        }
    }
};

const addGraphs = async () => {
    StatusUI.show("Graphing...");
    await initializeGraphs(chartBuckets);
    console.log(chartBuckets);
    GraphCarousel.set(chartBuckets.week);
    StatusUI.success("Loaded");
    StatusUI.hide();
};

addGraphs();