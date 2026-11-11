# Sticksy authentication setup

The pages now include Google OAuth and phone OTP flows using Supabase Auth. Authentication remains disconnected until a Supabase project and providers are configured.

## Connect the project

1. Create or open a Supabase project. Copy its Project URL and the browser-safe **publishable key** (or legacy `anon` key) into `supabase-config.js`. Never put a `service_role` key in this file.
2. In Supabase Authentication → URL Configuration, set the deployed site as the Site URL and add the deployed `index.html` URL to the Redirect URLs allow list. For local development, also allow the local site origin and `index.html` redirect.
3. In Authentication → Sign In / Providers, enable Google and Phone. For Google, create a Web OAuth client in Google Cloud, add the callback URL shown in Supabase to Google's Authorized redirect URIs, then enter the client ID and secret in Supabase. For phone login, configure an SMS provider and its sender/template in Supabase.
4. Serve the folder over HTTP (for example, use a local static server); OAuth redirects and browser module imports do not work reliably from `file://` URLs.

The auth forms call Supabase `signInWithOAuth` for Google and `signInWithOtp` / `verifyOtp` for SMS. Allowed redirect URLs must match the app URLs exactly. User profile/session state is stored by Supabase JS in the browser; authorization for any future admin or private data must still be enforced on a server or through Supabase Row Level Security.

## Run the site and admin route locally

Run `node server.js` from this folder and open `http://127.0.0.1:3000`. The site must be served over HTTP for OAuth redirects. The server provides the protected `/admin` route and reads admin credentials from the ignored `.env.local` file. The login uses an HttpOnly, SameSite=Strict session cookie, an eight hour session, and an in-memory rate limit. Direct requests for the dashboard HTML are blocked.

The included `.env.local` contains the admin credentials you supplied; it is excluded from Git. The built-in server binds only to `127.0.0.1` for local use. It is not a production hosting server. On deployment, configure equivalent credentials as server environment variables and implement the `/admin` session routes using your hosting platform's server functions before exposing admin access publicly.
