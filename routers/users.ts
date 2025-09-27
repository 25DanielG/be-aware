
import * as Koa from "koa";
import Router from "koa-router";
import * as json from "koa-json";
import * as logger from "koa-logger";
import * as views from "koa-views";
import bodyParser from "koa-bodyparser";
import compose from "koa-compose";
import requireAuth from "../middleware/requireAuth";
import Users from "../helpers/users";

const router = new Router<Koa.DefaultState, Koa.Context>();

router.get("/all", bodyParser(), async (ctx) => {
    const users = await Users.getAll();
    ctx.body = users;
});

export default router;