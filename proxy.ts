import { getToken } from "next-auth/jwt";
import { withBasePath } from "@/lib/paths";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !token ||
    token.profile?.role !== "ADMIN" ||
    token.error ||
    Date.now() > token.loginExpires
  ) {
    const url = new URL(withBasePath("/login"), request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/",
    "/users/:path*",
    "/subscriptions/:path*",
    "/coupons/:path*",
    "/settings/:path*",
  ],
};
