
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

interface JournalVisualize {
    journals: JournalSchema[];
    timeframe: "day" | "week" | "month";
    chartType: string
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

router.post("/journals/visualize", async (ctx) => {
    try {
        const body = ctx.request.body as JournalVisualize;
        const { journals, timeframe, chartType = "bar" } = body;

        if (!Array.isArray(journals) || !["day", "week", "month"].includes(timeframe)) {
            ctx.status = 400;
            ctx.body = { error: "Invalid request. Provide 'journals' array and 'timeframe' of day, week, or month." };
            return;
        }

        // Validate journal properties
        for (const journal of journals) {
            if (
                typeof journal.journal !== "string" ||
                !journal.date ||
                !Array.isArray(journal.sentiment) ||
                journal.sentiment.length !== 6
            ) {
                ctx.status = 400;
                ctx.body = { error: "Each journal must have 'journal' (string), 'date', and 'sentiment' (array of 6 numbers)." };
                return;
            }
        }

        // Shrink journal to timeframe
        let journals_cut = getJournalsInTimeframe(journals, timeframe)

        // Return correct data format given chart type
        let grouped: any
        switch (chartType) {
            case "pie":
                grouped = getPercentage(journals_cut);

                ctx.body = {
                    timeframe,
                    chartData: {
                        data: grouped[0],
                        backgroundColor: backgroundColor
                    }
                };
                break;
            case "primary":
                grouped = getPrimaryEmotion(journals_cut);
                ctx.body = {
                    timeframe,
                    chartData: {
                        data: grouped[0],
                        backgroundColor: backgroundColor[grouped[1]]
                    }
                };
                break;
            case "primary":
                grouped = getArea(journals_cut);
                ctx.body = {
                    timeframe,
                    chartData: {
                        data: grouped[0],
                        backgroundColor: backgroundColor[grouped[1]]
                    }
                };
                break;
        }

    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { error: "Server error" };
    }
});


export default router;