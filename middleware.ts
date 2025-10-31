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

    // 🚀 redirect submission-admins to /bookorder if they try to access /admin
    if (pathname.startsWith("/admin") && role === "submission-admin") {
      const url = new URL("/bookorder", req.url)
      return NextResponse.redirect(url)
    }

    // Access control
    if (pathname.startsWith("/admin/forms") || pathname.startsWith("/admin/dashboard")) {
      if (role !== "formbuilder-admin" && role !== "super admin") {
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }

    if (pathname.startsWith("/bookorder")) {
      if (role !== "submission-admin" && role !== "super admin") {
        return NextResponse.redirect(new URL("/access-denied", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/bookorder/:path*"],
}
