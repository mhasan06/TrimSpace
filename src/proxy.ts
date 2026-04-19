import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    
    // Protect /admin routes (must be ADMIN role)
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Protect /dashboard routes (must be BARBER or ADMIN)
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (token?.role !== 'BARBER' && token?.role !== 'ADMIN') {
        // Customers unauthorized to see B2B portal
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // Must be logged in to even evaluate the above rules
    }
  }
);

// Apply middleware exclusively to secure portal routes
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
