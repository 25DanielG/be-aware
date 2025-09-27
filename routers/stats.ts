
import * as Koa from "koa";
import Router from "koa-router";
import * as json from "koa-json";
import * as logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import compose from "koa-compose";
import requireAuth from "../middleware/requireAuth";
import * as user from "../helpers/users";
import Users from "../helpers/users";
import Journal from "../helpers/journal";
import Stats from "../helpers/stats"
import mongoose from "../db";
import { format, subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { Journal as JournalSchema } from "../models/journal";
import { group } from "console";

const router = new Router<Koa.DefaultState, Koa.Context>();
const backgroundColor = [
    "#FF6384", // Happiness
    "#36A2EB", // Sadness
    "#FFCE56", // Fear
    "#4BC0C0", // Disgust
    "#9966FF", // Anger
    "#FF9F40", // Surprise
]
const chartTitles = {
    "pie": "Your Mood, Piece by Piece",
    "area": "Journal Sentiments Over Time",
    "primary": "Your Core Emotion",
    "bar-line": "Correlation Between Journal Length and Mood"
}

interface JournalVisualize {
    type: string
}

function getJournalsInTimeframe(journals: JournalSchema[], timeframe: string) {
    let days: number;
    let threshold: Date;
    const now = new Date();

    switch (timeframe) {
        case "day":
            threshold = subDays(now, 1);
            break;
        case "week":
            threshold = subDays(now, 7);
            break;
        case "month":
            threshold = subDays(now, 30);
            break;
        default:
            throw new Error("Invalid timeframe. Must be 'day', 'week', or 'month'.");
    }

    return journals.filter(journal => isAfter(new Date(journal.date), threshold));

}

// Helper: get total percentage of each emotion
function getPercentage(
    journals: JournalSchema[]
) {
    const totals = [0, 0, 0, 0, 0, 0];
    let sumScore = 0.0;

    journals.forEach((journal) => {
        journal.sentiment.forEach((val: number, idx: number) => {
            totals[idx] += val;
            sumScore += val;
        });
    });

    const sentiments = totals.map(total => sumScore ? total / sumScore : 0);

    return [sentiments];
}

// Get primary emotion from journal entries
function getPrimaryEmotion(journals: JournalSchema[]): [number, number] {
    const totals = [0, 0, 0, 0, 0, 0];
    let sumScore = 0.0;

    journals.forEach((journal) => {
        journal.sentiment.forEach((val: number, idx: number) => {
            totals[idx] += val;
            sumScore += val;
        });
    });

    const maxIndex: number = totals.reduce((iMax, x, i, arr) => {
        return x > arr[iMax] ? i : iMax;
    }, 0);

    const maxSum: number = totals[maxIndex];
    const avgMax = journals.length ? maxSum / journals.length : 0;

    return [avgMax, maxIndex];
}


// Get emotion scores for multi-line chart
function getLines(
    journals: JournalSchema[],
) {
    let scores: number[][] = [];
    let labels: Date[] = [];
    for (const journal of journals) {
        let cur: number[] = [];
        for (let i = 0; i < 6; i++) {
            cur[i] = journal.sentiment[i].valueOf()
        }
        scores.push(cur);
        labels.push(journal.date)
    }

    return [scores, labels];
}

// Get % emotion scores for area chart
function getArea(
    journals: JournalSchema[],
) {
    let scores: number[][] = [];
    let labels: Date[] = [];
    for (const journal of journals) {
        let cur: number[] = [];
        let sum = 0;
        for (let i = 0; i < 6; i++) {
            cur[i] = journal.sentiment[i].valueOf();
            sum += cur[i];
        }
        scores.push(cur.map(element => element / sum));
        labels.push(journal.date);
    }

    /*
    const dailyMap: Record<string, Number[][]> = {};

    for (const journal of journals) {
        const day = format(new Date(journal.date), "yyyy-MM-dd");
        if (!dailyMap[day]) dailyMap[day] = [];
        dailyMap[day].push(journal.sentiment);
    }

    const dailyAverages: number[][] = Object.keys(dailyMap)
        .sort() // ascending by date
        .map((day) => {
            const sentiments = dailyMap[day];
            const avg: number[] = [0, 0, 0, 0, 0, 0];

            for (const s of sentiments) {
                for (let i = 0; i < 6; i++) {
                    avg[i] += s[i].valueOf();
                }
            }

            return avg.map((val) => val / sentiments.length);
        });
    */
    return [scores, labels];
}

router.post("/journals/visualize/:time", compose([bodyParser()]), async (ctx) => {
    try {
        const user = await Users.getUser(ctx.session.userId);
        if (!user) {
            ctx.status = 401;
            ctx.body = { error: "Unauthorized" };
            return;
        }

        const body = ctx.request.body as JournalVisualize;
        const { type = "pie" } = body;
        const timeframe = ctx.params.time;

        const journalIds = await Users.getUserJournals((user as any)._id); // get last 30 days of journals
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        const journals = await Journal.findIdsRange(journalIds, start, end);  // [{ _id, journal, date, sentiment: [..] }]

        if (!Array.isArray(journals) || !["day", "week", "month"].includes(timeframe)) {
            ctx.status = 400;
            ctx.body = { error: "Invalid request. Provide 'journals' array and 'timeframe' of day, week, or month." };
            return;
        }

        for (const journal of journals) { // validate
            if (
                typeof journal.journal !== "string" ||
                !journal.date ||
                !Array.isArray(journal.sentiment) ||
                journal.sentiment.length !== 6
            ) {
                ctx.status = 400;
                ctx.body = { error: "invalid journal in array" };
                return;
            }
        }

        let journalsCut = getJournalsInTimeframe(journals, timeframe); // only journals in timeframe
        let config;
        let res;
        let grouped: any;
        const EMOTION_LABELS = ["Joy", "Sadness", "Anger", "Fear", "Disgust", "Surprise"];

        if (type == "pie") { // pie chart
            const [percentagesRaw] = getPercentage(journalsCut) || [[]];
            const percentages = Array.isArray(percentagesRaw) && percentagesRaw.length === 6 ? percentagesRaw : [0, 0, 0, 0, 0, 0];
            const isFraction = percentages.some(v => v > 0 && v <= 1) && percentages.every(v => v <= 1);
            const dataChart = isFraction ? percentages.map(v => +(v * 100).toFixed(2)) : percentages;
            config = {
                type: "pie",
                data: {
                    labels: EMOTION_LABELS,
                    datasets: [
                        {
                            label: "Emotion share",
                            data: dataChart,
                            backgroundColor: backgroundColor,
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: "bottom" },
                        title: {
                            display: true,
                            text: chartTitles["pie"],
                            font: { size: 22, weight: "bold" },
                            padding: { top: 10, bottom: 20 }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx: any) => {
                                    const label = ctx.label || "";
                                    const val = ctx.parsed ?? 0;
                                    const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0) || 1;
                                    const pct = ((val / total) * 100).toFixed(1);
                                    return `${label}: ${val}${isFraction ? "%" : ""} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            };

            res = {
                timeframe,
                chartConfig: config,
                chartData: {
                    data: percentagesRaw,
                }
            };
        } else if (type == "area") {
            const area_data = getArea(journalsCut);
            const series = area_data[0];
            const labels = area_data[1];

            const hexToRgba = (hex: string, alpha = 0.25) => {
                const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (!m) return hex;
                const r = parseInt(m[1], 16);
                const g = parseInt(m[2], 16);
                const b = parseInt(m[3], 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const datasets = EMOTION_LABELS.map((label, i) => ({
                label,
                data: series.map((row) => row[i]),
                fill: true,
                tension: 0.25,
                pointRadius: 0,
                borderWidth: 2,
                borderColor: backgroundColor[i],
                backgroundColor: hexToRgba(backgroundColor[i], 0.28),
            }));

            const config = {
                type: "line",
                data: {
                    labels, // YYYY-MM-DD
                    datasets,
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        x: {
                            ticks: { maxRotation: 0, autoSkip: true },
                            grid: { display: false },
                            title: { display: true, text: "Date" }
                        },
                        y: {
                            stacked: true,
                            min: 0,
                            max: 1,
                            grid: { color: "rgba(0,0,0,0.06)" },
                            title: { display: true, text: "Proportion of Emotion" }
                        },
                    },
                    plugins: {
                        legend: { position: "bottom" },
                        title: {
                            display: true,
                            text: chartTitles["area"],
                            font: { size: 22, weight: "bold" },
                            padding: { top: 10, bottom: 16 },
                        },
                        tooltip: {
                            mode: "index",
                            intersect: false,
                            callbacks: {
                                afterBody: (items: any[]) => {
                                    const total = items.reduce((a, it) => a + (it.parsed?.y ?? 0), 0);
                                    return `Total: ${total.toFixed(2)}`;
                                },
                            },
                        },
                    },
                    interaction: { mode: "index", intersect: false },
                },
            };

            res = {
                timeframe,
                chartConfig: config,
                chartData: {
                    labels,
                    datasets: datasets.map((d) => ({ label: d.label, data: d.data })),
                },
            };
        } else if (type === "primary") { // core emotion
            const [vector, winnerIndex] = getPrimaryEmotion(journalsCut) || [[0, 0, 0, 0, 0, 0], 0];
            const label = EMOTION_LABELS[winnerIndex] ?? "Primary";
            const color = backgroundColor[winnerIndex] ?? "#888888";

            const centerTextPlugin = {
                id: "centerText",
                afterDraw(chart: any) {
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return;
                    const cx = (chartArea.left + chartArea.right) / 2;
                    const cy = (chartArea.top + chartArea.bottom) / 2;
                    ctx.save();
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#111";
                    ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
                    ctx.fillText(label, cx, cy);
                    ctx.restore();
                }
            };

            const config = {
                type: "doughnut",
                data: {
                    labels: [label],
                    datasets: [{
                        data: [100],
                        backgroundColor: [color],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: "68%",
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        title: {
                            display: true,
                            text: chartTitles["primary"],
                            font: { size: 22, weight: "bold" },
                            padding: { top: 10, bottom: 16 }
                        }
                    }
                },
                plugins: [centerTextPlugin]
            };

            res = {
                timeframe,
                chartConfig: config,
                chartData: { winnerIndex, label, vector } // for tip generation
            };
        } else if (type === "bar-line") {
            const area_data = getLines(journalsCut);
            const emotionSeries = area_data[0];
            const labels = area_data[1];
            const journalLengths = journalsCut.map(j => j.journal.length);

            const hexToRgba = (hex: string, alpha = 0.25) => {
                const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                if (!m) return hex;
                const r = parseInt(m[1], 16);
                const g = parseInt(m[2], 16);
                const b = parseInt(m[3], 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const datasets: any[] = [
                {
                    type: "bar",
                    label: "Journal Length",
                    data: journalLengths,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    yAxisID: "yBar",
                },
                ...EMOTION_LABELS.map((label, i) => ({
                    type: "line",
                    label,
                    data: emotionSeries.map((row) => row[i]),
                    fill: false,
                    borderColor: backgroundColor[i],
                    backgroundColor: hexToRgba(backgroundColor[i], 0.28),
                    tension: 0.25,
                    pointRadius: 2,
                    yAxisID: "yLine",
                })),
            ];

            const config = {
                type: "bar",
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        x: {
                            stacked: false,
                            grid: { display: false },
                            title: {
                                display: true,
                                text: "Date"
                            }
                        },
                        yBar: {
                            type: "linear",
                            position: "left",
                            title: {
                                display: true,
                                text: "Journal Length (chars)"
                            },
                            grid: { drawOnChartArea: false },
                        },
                        yLine: {
                            type: "linear",
                            position: "right",
                            min: 0,
                            max: 1,
                            title: {
                                display: true,
                                text: "Emotion Scores"
                            },
                            grid: { drawOnChartArea: false },
                        },
                    },
                    plugins: {
                        legend: { position: "bottom" },
                        title: {
                            display: true,
                            text: "Journal Length vs Emotions Over Time",
                            font: { size: 22, weight: "bold" },
                            padding: { top: 10, bottom: 16 },
                        },
                        tooltip: {
                            mode: "index",
                            intersect: false,
                        },
                    },
                    interaction: { mode: "index", intersect: false },
                },
            };

            res = {
                timeframe,
                chartConfig: config,
                chartData: { labels, datasets: datasets.map((d) => ({ label: d.label, data: d.data })) },
            };
        } else {
            ctx.status = 400; ctx.body = { error: "Unsupported chart type." }; return;
        }

        ctx.body = {
            timeframe: res.timeframe,
            chartConfig: res.chartConfig,
            tip: await Stats.generateTip(type, res.chartData)
        }

    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { error: "Server error" };
    }
});


export default router;