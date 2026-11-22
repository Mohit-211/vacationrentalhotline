import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Better Auth's endpoints: sign-up, sign-in, sign-out, session, email
// verification, password reset and change, email change, and the admin
// plugin's user management.
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler((request: Request) => auth().handler(request));
