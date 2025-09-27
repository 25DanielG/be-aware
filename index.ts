import Koa from "koa";
import Router from "koa-router";
import json from "koa-json";
import logger from "koa-logger";
import views from "koa-views";
import bodyParser from "koa-bodyparser";
import serve from "koa-static";
import session from "koa-session";
import { createServer } from "http";
import fs, { stat } from "fs";
import * as crypto from "crypto";
import path from "path";
import { registerComponentsWithinDirectory } from "./helpers/componentRegistration";
import registerHelpers from "./helpers/hbsHelpers";
import config from "./config";

import loginRouter from "./routers/login";
import indexRouter from "./routers/index";
import usersRouter from "./routers/users";
import journalRouter from "./routers/journal";
import statsRouter from "./routers/stats";

const app = new Koa();

const sessionConfig: Partial<session.opts> = {
    key: config.auth.cookieKeys[0],
    maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
    httpOnly: true,
};

app.use(async (ctx, next) => {
    ctx.state.environment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development' ? 'development' : 'production';
    await next();
});

app.keys = config.auth.cookieKeys.slice(1);
app.use(session(sessionConfig, app));
app.use(json());
app.use(logger());
app.use(bodyParser());

registerComponentsWithinDirectory("./views/partials");

registerHelpers();

app.use(
    views(__dirname + (__dirname.endsWith("build") ? "/../views" : "/views"), {
        map: {
            hbs: "handlebars",
        },
        extension: "hbs",
    })
);

const router = new Router<Koa.DefaultState, Koa.Context>();

router.use("", loginRouter.routes());
router.use("", indexRouter.routes());
router.use("/journal", journalRouter.routes());
router.use("/users", usersRouter.routes());
router.use("/api", statsRouter.routes());

app.use(router.routes());
app.use(serve("./static", {}));

const httpServer = createServer(app.callback());

httpServer.listen(config.server.port, () => {
    console.log("Server running on port " + config.server.port);
});