
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

router.get("/all", async (ctx) => {
    const entries = await Journal.getAll();
    ctx.body = { entries };
})

export default router;