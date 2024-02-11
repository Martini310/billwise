import { withAuth } from "next-auth/middleware"


export default withAuth({
    // Matches the pages config in `[...nextauth]`
    pages: {
      signIn: '/auth/login',
      error: '/404',
    },
  })
  export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - api (API routes)
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       */
      {
        source: '/((?!api|_next/static|_next/image|favicon.*|auth|assets).*)',
        missing: [
          { type: 'header', key: 'next-router-prefetch' },
          { type: 'header', key: 'purpose', value: 'prefetch' },
        ],
      },
    ],
  }
