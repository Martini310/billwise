// import NextAuth from 'next-auth'
// import Providers from 'next-auth/providers'

// export default NextAuth({
//   providers: [
//   Providers.Google({
//     clientId: '1096856738165-rcblrfimcffglaihiems0smhgh9kkheb.apps.googleusercontent.com',
//     clientSecret: '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',
//   }),
//   ],
//   callbacks: {
//   async jwt({ token, user }) {
//     if (user) {
//     token.id = user.id;
//     }
//     return token;
//   },
//   async session({ session, token }) {
//     session.user.id = token.id;
//     return session;
//   },
//   },
// })
