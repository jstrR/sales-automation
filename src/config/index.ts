import { Context, Next } from "koa";

export const getServerConfig = async (ctx: Context, next: Next) => {
  try {
    ctx.body = { version: process.env.npm_package_version };
    await next();
  } catch (e) {
    console.log(e);
    ctx.body = null;
    ctx.status = 400;
  }
};
