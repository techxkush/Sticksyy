# Sticksy

Sticksy is a playful sticker storefront for premium A4 sticker sheets. It is built as a responsive HTML, CSS, and JavaScript site, with a small Node.js server for the protected local admin route.

## What is in the project

- **Home page** (`index.html`): brand story, collections, product highlights, and pink/blue sticker-style entry points.
- **Shop page** (`shop.html`): all six listed designs, search, category filters, product detail dialogs, tilt effects, and a light/dark toggle.
- **Theme page** (`themes.html`): pink Girly Sticker Themes and blue Boys’ Sticker Themes, with links into the matching shop category.
- **Cart and checkout**: browser-saved cart, quantities, coupon, shipping progress, invoice-style summary, UPI QR, and payer-name/UTR submission. Persistent orders require the Supabase SQL and server secret setup below.
- **Sign-in page** (`auth.html`): Supabase Google OAuth and phone OTP flows. The project URL and public publishable key are set in `supabase-config.js`; Google and SMS providers still need to be enabled in Supabase.
- **Admin route** (`/admin`): a server-protected local dashboard. The current dashboard shows the listed catalog, while live order, inventory, customer, and revenue management still need a database connection.
- **Sticker artwork**: the two supplied images are in `assets/`; remaining product cards use illustrated mockups.

## Run locally

Install Node.js 18 or later, open a terminal in this folder, and run:

```powershell
node .\server.js
```

Then open <http://127.0.0.1:3000>. The admin sign-in is at <http://127.0.0.1:3000/admin>.

Admin credentials are read by the server from `.env.local`. That file is ignored by Git; keep it private and never commit it. The included server binds to `127.0.0.1` for local use and is not a production hosting server.

## Supabase sign-in setup

The browser uses the Project URL and public publishable key in `supabase-config.js`. A publishable key is intended for browser code; do not put a Supabase secret/service-role key in this project.

In the Supabase dashboard:

1. Enable Google under **Authentication → Sign In / Providers** and configure a Google Web OAuth client.
2. Enable Phone and connect an SMS provider for one-time codes.
3. Set the local Site URL to `http://127.0.0.1:3000` and allow the redirect URL `http://127.0.0.1:3000/index.html`.

Provider secrets belong in Supabase or a server secret store, not in browser code or Git.

## Important project status

The current payment path is manual UPI: submitted UTRs remain pending until you compare them with your bank/UPI account and confirm them in Admin. Razorpay, automated payment verification, shipping fulfillment, inventory sync, and production deployment are not implemented.

## UPI orders

Checkout shows the supplied UPI QR, asks for payer name and UTR, and records orders on the server after Supabase database setup. Run `supabase/orders.sql` in the Supabase SQL Editor, add a server-only `sb_secret_...` key to `.env.local`, and restart Node. Orders then appear in the protected `/admin` Orders section as awaiting payment or submitted. Verify the transfer in the receiving UPI/bank account before marking it paid. Full steps are in [PAYMENT_SETUP.md](PAYMENT_SETUP.md).
