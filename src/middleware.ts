export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/feed",
    "/post",
    "/my-surveys",
    "/complete",
    "/rewards",
    "/referral",
    "/profile",
    "/survey/:path*",
    "/admin/:path*",
    "/corporate",
    "/supervisor",
  ],
};
