import * as Koa from "koa";
import * as json from "koa-json";
import * as logger from "koa-logger";
import * as views from "koa-views";
import bodyParser from "koa-bodyparser";
import compose from "koa-compose";
import Router from "koa-router";

import config from "../config";
import Journal from "../helpers/journal";
import requireAuth from "../middleware/requireAuth";
import Users from "../helpers/users";

const router = new Router<Koa.DefaultState, Koa.Context>();

router.get("/", async (ctx) => {
    await ctx.render("pages/landing");
});

router.get("/insights", compose([bodyParser(), requireAuth]), async (ctx) => {
    const userId = ctx.session.userId;
    const userName = await Users.getName(userId);
    const entries = await Users.getUserJournals(userId);
    
    await ctx.render("pages/stats", { journal: false });
});

export default router;