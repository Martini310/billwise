// import NextAuth from 'next-auth'
// import {Providers} from 'next-auth'

// console.log(Providers);

// export default NextAuth({
//     providers: [
//     Providers.Google({
//         clientId: '1096856738165-rcblrfimcffglaihiems0smhgh9kkheb.apps.googleusercontent.com',
//         clientSecret: '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',
//     }),
//     ],
//     callbacks: {
//     async jwt({ token, user }) {
//         if (user) {
//         token.id = user.id;
//         }
//         return token;
//     },
//     async session({ session, token }) {
//         session.user.id = token.id;
//         return session;
//     },
//     },
// })
import GoogleProvider from "next-auth/providers/google";
import NextAuth from 'next-auth'

export default NextAuth({
    providers: [
    GoogleProvider({
        clientId: '1096856738165-rcblrfimcffglaihiems0smhgh9kkheb.apps.googleusercontent.com',
        clientSecret: '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'
    })
    ],
    callbacks: {
        onError: async (error, _, res) => {
            console.error('Authentication error:', error);
            return res.redirect('/auth/error'); // Redirect to an error page
        },
        async jwt({token, account}) {
            if (account) {
                token = Object.assign({}, token, { access_token: account.access_token });
                token.id_token = account.id_token;
            }
            return token
        },
        async session({session, token}) {
        if(session) {
            session = Object.assign({}, session, {access_token: token.access_token})
            session.id_token = token.id_token;
            }
            return session
        }
    }
})
