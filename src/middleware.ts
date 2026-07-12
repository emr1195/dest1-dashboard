import { routeAccessMap } from "./lib/settings";
import { isAppRole, roleOptions } from "./lib/roles";
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = Object.entries(routeAccessMap).map(([route, roles]) => ({
  regex: new RegExp(`^${route}`),
  roles,
}));

const dashboardPaths = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.dashboardPath])
);

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const redirectTo = (path: string) => {
    const url = new URL(path, req.url);

    if (url.pathname === pathname) {
      return NextResponse.next();
    }

    return NextResponse.redirect(url);
  };

  const getDashboardPath = (role: unknown) =>
    isAppRole(role) ? dashboardPaths[role] || "/" : "/";

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (!token) {
    return redirectTo("/");
  }

  const matchedRoute = protectedRoutes.find(({ regex }) => regex.test(pathname));

  if (matchedRoute && !matchedRoute.roles.includes(String(token.role))) {
    return redirectTo(getDashboardPath(token.role));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/public-files|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

