import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "thoughtpad_session";

/**
 * Auth wall (edge-fast pre-check): the stream is unreachable without a
 * session cookie. Full token verification always happens server-side in
 * `requireUser()` for the page and every server action.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSession && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"],
};
