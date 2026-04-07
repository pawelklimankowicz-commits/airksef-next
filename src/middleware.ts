import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import { isClerkConfigured } from "@/lib/clerk-config";

/** Panel i płatności — wymagają konta. Generator i landing są publiczne (konwersja). */
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/profile(.*)",
  "/ksef(.*)",
  "/billing(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

const protectedWithoutClerk = ["/dashboard", "/profile", "/ksef", "/billing"];

function isProtectedPath(pathname: string): boolean {
  return protectedWithoutClerk.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) {
    if (isProtectedPath(req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/setup", req.url));
    }
    return NextResponse.next();
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
