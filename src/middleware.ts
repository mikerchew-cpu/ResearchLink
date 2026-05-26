import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

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
