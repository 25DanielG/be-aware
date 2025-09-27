import * as Koa from "koa";
import * as json from "koa-json";
import * as logger from "koa-logger";
import * as views from "koa-views";
import bodyParser from "koa-bodyparser";
import compose from "koa-compose";
import Router from "koa-router";

import config from "../config";
import Media from "../helpers/journal";
import requireAuth from "../middleware/requireAuth";
import Users from "../helpers/users";

const router = new Router<Koa.DefaultState, Koa.Context>();

router.get("/", requireAuth, async (ctx) => {
    ctx.render("landing");
});

export default router;