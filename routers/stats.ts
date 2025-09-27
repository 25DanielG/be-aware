
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
    "pie" : "Your Mood, Piece by Piece",
    "area" : "Journal Sentiments Over Time",
    "primary" : "Your Core Emotion"
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
function getPrimaryEmotion(
    journals: JournalSchema[],
) {
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

    const avgMax = (journals.length ? maxSum / journals.length : 0);


    return [avgMax, maxIndex];
}


// Get daily average emotion scores for area chart
function getArea(
    journals: JournalSchema[],
) {
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

    return dailyAverages;
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

        // pie chart
        const [percentagesRaw] = getPercentage(journalsCut) || [[]];
        const percentages = Array.isArray(percentagesRaw) && percentagesRaw.length === 6 ? percentagesRaw : [0, 0, 0, 0, 0, 0];
        const EMOTION_LABELS = ["Joy", "Sadness", "Anger", "Fear", "Disgust", "Surprise"];
        const isFraction = percentages.some(v => v > 0 && v <= 1) && percentages.every(v => v <= 1);
        const dataChart = isFraction ? percentages.map(v => +(v * 100).toFixed(2)) : percentages;
        const pieConfig = {
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

        let grouped: any;
        switch (type) {
            case "pie":
                grouped = getPercentage(journalsCut);

                ctx.body = {
                    timeframe,
                    chartConfig: pieConfig
                };
                break;
            case "primary":
                grouped = getPrimaryEmotion(journalsCut);
                ctx.body = {
                    timeframe,
                    chartData: {
                        data: grouped[0],
                        backgroundColor: backgroundColor[grouped[1]]
                    }
                };
                break;
            case "area":
                grouped = getArea(journalsCut);
                ctx.body = {
                    timeframe,
                    chartData: {
                        data: grouped[0],
                        backgroundColor: backgroundColor[grouped[1]]
                    }
                };
                break;
        }

        ctx.body = {
            timeframe: ctx.body.timeframe,
            chartTitle: chartTitles[type],
            chartData: ctx.body.chartData,
            tip: Stats.generateTip(type, ctx.body.chartData)
        }

    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { error: "Server error" };
    }
});


export default router;