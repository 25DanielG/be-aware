
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

const router = new Router<Koa.DefaultState, Koa.Context>();
const backgroundColor = [
    "#FF6384", // Happiness
    "#36A2EB", // Sadness
    "#FFCE56", // Fear
    "#4BC0C0", // Disgust
    "#9966FF", // Anger
    "#FF9F40", // Surprise
]

// Helper: group journals by timeframe
function groupByPercentage(
    journals: any[],
    timeframe: "day" | "week" | "month"
) {
    const totals = [0, 0, 0, 0, 0, 0];
    let sumScore = 0.0;

    journals.forEach((journal) => {
        journal.sentiment.forEach((val: number, idx: number) => {
            totals[idx] += val;
            sumScore += val;
        });
    });

    // Calculate percentages normalized by sumScore
    const sentiments = totals.map(total => sumScore ? total / sumScore : 0);

    return [sentiments];
}

// Helper: get primary emotion from journal entries
function groupPrimaryEmotion(
    journals: any[],
    timeframe: "day" | "week" | "month"
) {
    const totals = [0, 0, 0, 0, 0, 0];
    let sumScore = 0.0;

    journals.forEach((journal) => {
        journal.sentiment.forEach((val: number, idx: number) => {
            totals[idx] += val;
            sumScore += val;
        });
    });

    // Calculate percentages normalized by sumScore
    const maxIndex: number = totals.reduce((iMax, x, i, arr) => {
        return x > arr[iMax] ? i : iMax;
      }, 0); // Initializes iMax with 0 (index of the first element)
      
    const maxSum: number = totals[maxIndex];

    const avgMax = (journals.length ? maxSum / journals.length : 0);


    return [avgMax, maxIndex];
}

// GET /stats/:userId?timeframe=day|week|month
router.get("/stats/:userId", async (ctx) => {
    try {
        const { userId } = ctx.params;
        const timeframe = (ctx.query.timeframe as "day" | "week" | "month") || "day";

        const user = await Users.getUser(userId);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: "User not found" };
            return;
        }

        // Fetch journals for this user
        const journals = await Users.getUserJournals(userId);

        const grouped = groupByPercentage(journals, timeframe);

        ctx.body = {
            timeframe,
            chartData: {
                data: grouped[0],
                backgroundColor: backgroundColor
            }
        };
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { error: "Server error" };
    }
});

interface JournalsVisualizeBody {
    journals: {
        journal: string;
        date: string;
        sentiment: number[];
    }[];
    timeframe: "day" | "week" | "month";
}

router.post("/journals/visualize", async (ctx) => {
    try {
        const body = ctx.request.body as JournalsVisualizeBody & { chartType?: string };
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

        // Return correct data format given chart type
        let grouped: any
        switch (chartType) {
            case "pie":
                // Use existing helper function to group sentiments by timeframe
                grouped = groupByPercentage(journals, timeframe);

                ctx.body = {
                    timeframe,
                    chartData: {
                        data: grouped[0],
                        backgroundColor: backgroundColor
                    }
                };
                break;
            case "primary":
                grouped = groupPrimaryEmotion(journals, timeframe);
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