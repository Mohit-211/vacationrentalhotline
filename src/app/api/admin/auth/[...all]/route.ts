import { toNextJsHandler } from "better-auth/next-js";
import { staffAuth } from "@/server/auth";

// Staff sign-in for the admin panel: sign-in, sign-out, session, password
// change and reset. Separate from customers' /api/auth, with its own cookie,
// so a staff login and a customer login never share or replace each other.
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler((request: Request) => staffAuth().handler(request));
