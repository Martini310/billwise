import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";


// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 59 * 60;            // 59 minutes
// const BACKEND_ACCESS_TOKEN_LIFETIME = 10;            // 10 seconds
const BACKEND_REFRESH_TOKEN_LIFETIME = 23 * 60 * 60 + 3540;  // 23 hours 59 minutes

const getCurrentEpochTime = () => {
  return Math.floor(new Date().getTime() / 1000);
};

const SIGN_IN_HANDLERS = {
  "credentials": async (user, account, profile, email, credentials) => {
    return true;
  },
  "google": async (user, account, profile, email, credentials) => {
    try {
      const response = await axios({
        method: "post",
        url: process.env.NEXTAUTH_BACKEND_URL + "auth/google/",
        data: { access_token: account["access_token"] },
        timeout: 5000
    });
    account["meta"] = response.data;
    console.log('Google sign-in success:', response.data);
    return true;
    } catch (error) {
      console.error('Google sign-in error:', error.response?.data || error.message);
      return false;
    }
}
};
const SIGN_IN_PROVIDERS = Object.keys(SIGN_IN_HANDLERS);

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: BACKEND_REFRESH_TOKEN_LIFETIME,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"}
      },
      // The data returned from this function is passed forward as the
      // `user` variable to the signIn() and jwt() callback
      async authorize(credentials, req) {
        try {
          const response = await axios({
            url: process.env.NEXTAUTH_BACKEND_URL + "auth/login/",
            method: "post",
            data: credentials,
          });
          const data = response.data;
          if (data) return data;
        } catch (error) {
            console.error('authorize - catch', error.response?.data || error.message);
          return null
        }
        return null;
      },
    }),
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      }),
  ],
  callbacks: {
    async signIn({user, account, profile, email, credentials}) {
      if (!SIGN_IN_PROVIDERS.includes(account.provider)) return false;

      return SIGN_IN_HANDLERS[account.provider](
        user, account, profile, email, credentials
      );
    },
    async jwt({user, token, account}) {
      // If `user` and `account` are set that means it is a login event
      if (user && account) {
        let backendResponse = account.provider === "credentials" ? user : account.meta;
        token["user"] = backendResponse.user;
        token["access_token"] = backendResponse.access;
        token["refresh_token"] = backendResponse.refresh;
        token["ref"] = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
        return token;
      }
      // Refresh the backend token if necessary
      if (getCurrentEpochTime() > token["ref"]) {
        try {
          const response = await axios({
            method: "post",
            url: process.env.NEXTAUTH_BACKEND_URL + "auth/token/refresh/",
            data: {
              refresh: token["refresh_token"],
            },
          })
          token["access_token"] = response.data.access;
          token["refresh_token"] = response.data.refresh;
          token["ref"] = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
          // console.log('new token', token)
        }
        catch (error) {
          if (error.response?.status === 401) {
            console.log('Refresh token expired!');
            return null; // Invalidates the session
          }
          console.error('jwt - catch', error.response?.data || error.message);
          return null
        }
      }
      return token;
    },
    // Since we're using Django as the backend we have to pass the JWT
    // token to the client instead of the `session`.
    async session({token}) {
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    }
  }
};

export default NextAuth(authOptions);
