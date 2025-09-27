
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
    const { content } = ctx.request.body as { content: string };
    if (!content || typeof content !== "string") {
        ctx.status = 400;
        ctx.body = { error: "Content is required and must be a string." };
        return;
    }
    let entry;
    console.log(ctx.session.userId);
    try {
        entry = await Journal.add(content, new Date());
        await Users.addJournal(ctx.session.userId, entry._id);
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: "Failed to add journal entry." };
        return;
    }
    ctx.status = 201;
    ctx.body = { entry };
});

export default router;
