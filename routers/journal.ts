
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

function parseLocalISODate(iso: string, hour = 12) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, hour, 0, 0, 0); // local time
}

router.get("/", async (ctx) => {
    await ctx.render("pages/journal", { journal: true });
});

router.get("/all", async (ctx) => {
    const entries = await Journal.getAll();
    ctx.body = { entries };
})

router.delete("/all", async (ctx) => {
    await Journal.removeAll();
    // delete journals refs from users
    const users = await Users.getAll();
    for (const u of users) {
        console.log(u);
        await Users.clearJournals((u as any)._id);
    }
    ctx.status = 200;
    ctx.body = { message: "All journal entries deleted." };
});

router.post("/", compose([bodyParser(), requireAuth]), async (ctx) => {
    const { content, date } = (ctx.request.body ?? {}) as { content?: string; date?: string };
    if (!content || typeof content !== "string" || !content.trim()) {
        ctx.status = 400; ctx.body = { error: "Content is required and must be a string." }; return;
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        ctx.status = 400; ctx.body = { error: "'date' must be YYYY-MM-DD." }; return;
    }
    const userId = ctx.session?.userId;
    if (!userId) { ctx.status = 401; ctx.body = { error: "Not authenticated." }; return; }
    const when = date ? parseLocalISODate(date, 12) : new Date();

    try {
        const entry = await Journal.add(content.trim(), when);
        await Users.addJournal(userId, entry._id);
        ctx.status = 201; ctx.body = { entry };
    } catch (e) {
        console.error(e); ctx.status = 500; ctx.body = { error: "Failed to add journal entry." };
    }
});

router.get("/date", requireAuth, async (ctx) => {
    const { date } = ctx.query as { date?: string };
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        ctx.status = 400; ctx.body = { error: "Query param 'date' must be YYYY-MM-DD." }; return;
    }
    const userId = ctx.session?.userId;
    if (!userId) { ctx.status = 401; ctx.body = { error: "Not authenticated." }; return; }

    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
    const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0); // next local midnight
    const ids = await Users.getUserJournals(userId);
    console.log(ids, start, end);
    const entries = await Journal.findIdsRange(ids, start, end);
    ctx.body = { entries };
});

export default router;
