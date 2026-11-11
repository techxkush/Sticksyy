# UPI checkout and order verification

Checkout shows the supplied UPI QR and UPI ID, creates an order with a server-calculated INR total, then collects the payer name and UTR. Orders remain **awaiting payment** or **submitted** until an admin checks the transfer in the receiving UPI/bank account. The site never treats a typed UTR as proof of payment.

## Connect the order database

1. In the Supabase dashboard for this project, open **SQL Editor** and run [`supabase/orders.sql`](supabase/orders.sql). The table has Row Level Security enabled and grants no order access to browser roles.
2. Open **Settings → API Keys** and create/copy the server-only Secret key (`sb_secret_...`). Put it in the ignored local `.env.local` file after `SUPABASE_SECRET_KEY=`. The Project URL is already there. Do not put this key in `supabase-config.js`, a browser page, or GitHub. Never send it in chat.
3. Restart the Node server with `node .\server.js`.
4. Place an order, pay the exact amount through the QR or UPI app, and submit the payer name and UTR. Sign in at `/admin`, open Orders, and compare the submitted UTR, payer, and amount with the actual bank/UPI transaction before selecting **Confirm transfer received**.

The QR image is a static UPI QR. It identifies the payee but does not prove a transfer or automatically encode the order amount; the checkout also provides a UPI app link with the amount filled in. Payment verification and order fulfillment remain manual. Do not mark an order paid based only on its submitted UTR.
