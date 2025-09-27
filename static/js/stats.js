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

    /** @type {Chart|null} */
    let chart = null;
    /** @type {Array<{type:string, data:any, options?:any, plugins?:any[]}>} */
    let configs = [];
    let idx = 0;

    function destroyChart() {
        if (chart && typeof chart.destroy === "function") chart.destroy();
        chart = null;
    }
    function makeChart(canvas, cfg) {
        if (!cfg) return null;
        return new Chart(canvas.getContext("2d"), cfg);
    }
    function renderPips() {
        pipsWrap.innerHTML = "";
        configs.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = "gc-pip" + (i === idx ? " is-active" : "");
            pipsWrap.appendChild(dot);
        });
    }
    function render() {
        destroyChart();
        chart = makeChart(canvCurr, configs[idx] || null);
        btnPrev.disabled = idx === 0;
        btnNext.disabled = idx >= configs.length - 1 || configs.length === 0;
        renderPips();
    }
    function go(delta) {
        const next = idx + delta;
        if (next < 0 || next > configs.length - 1) return;
        idx = next; render();
    }

    window.GraphCarousel = {
        set(items) {
            configs = Array.isArray(items) ? items.slice() : [];
            idx = Math.min(idx, Math.max(0, configs.length - 1));
            render();
        },
        add(cfg) {
            configs.push(cfg);
            if (configs.length === 1) idx = 0;
            render();
        },
        insertAt(i, cfg) {
            const clamped = Math.max(0, Math.min(i, configs.length));
            configs.splice(clamped, 0, cfg);
            if (configs.length === 1) idx = 0;
            render();
        },
        removeAt(i) {
            if (i < 0 || i >= configs.length) return;
            configs.splice(i, 1);
            idx = Math.min(idx, Math.max(0, configs.length - 1));
            render();
        },
        next() { go(1); },
        prev() { go(-1); },
        getIndex() { return idx; },
        getConfigs() { return configs.slice(); }
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
    await initializeGraphs(chartBuckets);
    window.GraphCarousel.add(chartBuckets.week[0].chartConfig);
};

addGraphs();