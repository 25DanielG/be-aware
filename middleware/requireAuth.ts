import * as Koa from 'koa';
import Users from "../helpers/users";

export default async (ctx: Koa.Context, next: Koa.Next) => {
    if (!ctx.session || !ctx.session.authed || !ctx.session.userId) {
		await ctx.redirect('/login');
	} else {
        await next();
    }
};