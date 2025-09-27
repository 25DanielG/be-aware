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

    /** @type {Chart|null} */
    let chart = null;

    /**
     * Internally we keep an array of { config: ChartJsConfig, tip: string }
     * regardless of how the caller provided it.
     * @type {Array<{config:any, tip:string}>}
     */
    let items = [];
    let idx = 0;

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
        if (!Array.isArray(buckets[timeframe])) continue;
        const res = await fetch(`api/journals/visualize/${timeframe}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "pie" })
        });
        if (!res.ok) {
            console.error(`Failed to fetch ${timeframe} data:`, await res.json());
            continue;
        }
        const data = await res.json();
        buckets[timeframe].push(data);
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