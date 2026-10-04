import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Software routes that require strict URL-level protection
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/quotations",
  "/customers",
  "/invoices",
  "/integrations",
  "/custom-objects",
  "/customobjects",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check the encrypted HTTP-only session cookie or client user cookie
  const sessionCookie = request.cookies.get("grownext_session")?.value;
  const userCookie = request.cookies.get("grownext_user")?.value;
  const approvedCookie = request.cookies.get("grownext_approved")?.value;

  if (!sessionCookie && !userCookie) {
    // Block from URL level: not logged in
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("blocked", "unauthenticated");
    return NextResponse.redirect(loginUrl);
  }

  // STRICT URL GATEWAY: Block if either condition is not satisfied (status inactive or license unassigned/expired)
  if (approvedCookie !== "true") {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("blocked", "unapproved");
    return NextResponse.redirect(loginUrl);
  }

  // Approved and authenticated: allow software page rendering
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/quotations/:path*",
    "/customers/:path*",
    "/invoices/:path*",
    "/integrations/:path*",
    "/custom-objects/:path*",
    "/customobjects/:path*",
    "/settings/:path*",
  ],
};
