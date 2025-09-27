
import * as Koa from "koa";
import Router from "koa-router";
import * as json from "koa-json";
import * as logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import compose from "koa-compose";
import requireAuth from "../middleware/requireAuth";
import * as user from "../helpers/users";
import Users from "../helpers/users";
import Media from "../helpers/journal";
import mongoose from "../db";

const router = new Router<Koa.DefaultState, Koa.Context>();

router.get("/logout", requireAuth, async (ctx) => {
    ctx.session = null;
    ctx.redirect("/");
});

router.get("/login", async (ctx) => {
    if (ctx.session!.userId && ctx.session!.authed) {
        ctx.redirect("/journal");
        return;
    }
    await ctx.render("pages/login");
});

router.get("/signup", async (ctx) => {
    if (ctx.session!.userId && ctx.session!.authed) {
        ctx.redirect("/journal");
        return;
    }
    await ctx.render("pages/signup");
});

router.post("/login", bodyParser(), async (ctx) => {
    const { email, password } = ctx.request.body as {
        email: string;
        password: string;
    };

    if (!email || !password) {
        ctx.status = 400;
        ctx.body = { error: "Email and password are required" };
        return;
    }

    try {
        const user = await Users.authenticate(email, password);
        if (!user) {
            ctx.status = 401;
            ctx.body = { error: "Invalid email or password" };
            return;
        }

        ctx.session!.userId = user._id;
        ctx.session!.authed = true;
        ctx.redirect("/journal");
    } catch (error) {
        console.error("Login error:", error);
        ctx.status = 500;
        ctx.body = { error: "Internal server error" };
    }
});

router.post("/signup", bodyParser(), async (ctx) => {
    const { email, firstName, lastName, password } = ctx.request.body as {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
    };

    if (!email || !firstName || !lastName || !password) {
        ctx.status = 400;
        ctx.body = { error: "All fields are required" };
        return;
    }

    try {
        const existing = await Users.getUserByEmail(email);
        if (existing) {
            ctx.status = 409;
            ctx.body = { error: "Email already in use" };
            return;
        }

        const userId = await Users.add(email, firstName, lastName, password);
        ctx.session!.userId = userId;
        ctx.session!.authed = true;
        ctx.redirect("/journal");
    } catch (error) {
        console.error("Signup error:", error);
        ctx.status = 500;
        ctx.body = { error: "Internal server error" };
    }
});

export default router;