import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/.well-known/gitskills/index.md") {
    const url = req.nextUrl.clone();
    url.pathname = "/well-known/gitskills/index";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/md/search.md") {
    const url = req.nextUrl.clone();
    url.pathname = "/md/search";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/md/trusted.md") {
    const url = req.nextUrl.clone();
    url.pathname = "/md/trusted";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/md/trending.md") {
    const url = req.nextUrl.clone();
    url.pathname = "/md/trending";
    return NextResponse.rewrite(url);
  }

  const m = pathname.match(/^\/md\/skills\/([^/]+)\.md$/);
  if (m) {
    const url = req.nextUrl.clone();
    url.pathname = `/md/skills/${m[1]}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/.well-known/gitskills/:path*", "/md/:path*", "/well-known/gitskills/:path*"]
};

