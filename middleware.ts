// import { withAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// export default withAuth(
//   function middleware(req) {
//     // Add any additional middleware logic here
//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token, req }) => {
//         const { pathname } = req.nextUrl;
        
//         // Check if user is trying to access admin routes
//         if (pathname.startsWith('/admin')) {
//           return token?.role === 'admin' || token?.role === 'super_admin';
//         }
        
//         // For /api/form routes, check method and require admin for non-GET
//         if (pathname.startsWith('/api/form')) {
//           if (req.method === 'GET') {
//             return true; // Allow GET requests without auth
//           }
//           return token?.role === 'admin' || token?.role === 'super_admin';
//         }
        
//         // For other protected routes, just check if token exists
//         return !!token;
//       },
//     },
//   }
// );

// export const config = {
//   matcher: [
//     '/admin/:path*',
//     '/api/form/:path*',  
//     '/dashboard/:path*',
//     '/access'
//   ],
// };

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    // Debug logging (remove in production after fixing)
    console.log("Middleware:", { pathname, role, fullUrl: req.url })

    // Early return for submission-admin accessing bookorder routes
    // This MUST come first to prevent unwanted redirects
    if (pathname.startsWith("/admin/bookorder") && role === "submission-admin") {
      return NextResponse.next()
    }

    // Early return for super admin - they can access everything
    if (role === "super admin") {
      return NextResponse.next()
    }

    // Redirect submission-admin trying to access non-bookorder admin routes
    if (pathname.startsWith("/admin") && role === "submission-admin") {
      const url = new URL("/admin/bookorder", req.url)
      return NextResponse.redirect(url)
    }

    // Access control for forms and dashboard (formbuilder-admin only)
    if (pathname.startsWith("/admin/forms") || pathname.startsWith("/admin/dashboard")) {
      if (role !== "formbuilder-admin") {
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }

    // Access control for bookorder (submission-admin only)
    if (pathname.startsWith("/admin/bookorder")) {
      if (role !== "submission-admin") {
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: ["/admin/:path*"],
}