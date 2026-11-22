import { deleteCookie, getCookie, setCookie } from "cookies-next/client";

// The API access token lives in a cookie so the server can read it too.
// It isn't httpOnly: that needs the API to set the cookie itself.
const TOKEN_COOKIE = "usertoken";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days; the API rejects expired tokens

export const setToken = (token: string): void => {
  setCookie(TOKEN_COOKIE, token, {
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
    maxAge: TOKEN_MAX_AGE,
  });
};

export const clearToken = (): void => {
  if (typeof window !== "undefined") {
    deleteCookie(TOKEN_COOKIE, { path: "/" });
  }
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return getCookie(TOKEN_COOKIE) ?? null;
  }
  return null;
};
