import { routeAccessMap } from "./lib/settings";
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = Object.entries(routeAccessMap).map(([route, roles]) => ({
  regex: new RegExp(`^${route}`),
  roles,
}));

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    if (token?.role) {
      return NextResponse.redirect(new URL(`/${token.role}`, req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const matchedRoute = protectedRoutes.find(({ regex }) => regex.test(pathname));

  if (matchedRoute && !matchedRoute.roles.includes(token.role as string)) {
    return NextResponse.redirect(new URL(token.role ? `/${token.role}` : "/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

