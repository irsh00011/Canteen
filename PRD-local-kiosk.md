# KBA Canteen — Local-Only Kiosk PRD

## Product direction

KBA Canteen is a fast, touch-friendly canteen billing kiosk designed for a single device or browser profile. The revised version intentionally removes camera scanning, backend database calls, remote authentication, and Supabase dependencies from the active cashier workflow. All operational data is stored in browser `localStorage`, making the app usable even when the network is unavailable.

> Primary interaction: **Tap item → adjust quantity → review bill → show payment QR → complete sale → start next bill.**

## Target users

The primary user is a cashier who needs to create bills quickly with one hand. The secondary user is an administrator who configures products, uploads product images, changes prices, controls availability, maintains the payment QR, and reviews daily reports.

## Navigation and homepage

The homepage becomes an app-style launcher rather than a database dashboard. It presents a compact branded header and a responsive grid of feature tiles: **Start billing**, **Add item**, **Admin settings**, **Daily reports**, and **CSV export**. Tiles use restrained entrance and press animations, clear icons, and the fixed KBA purple palette. The layout must remain useful on narrow Android screens and desktop browsers.

## Billing requirements

The billing screen presents products as image-forward cards. Each active product card contains its image, name, category, price, and a prominent plus control. Tapping the card or plus control adds one unit to the current bill. Repeated taps increase the existing line quantity instead of creating duplicate rows. A minus control reduces quantity; reaching zero removes the line.

The current bill remains visible alongside the product grid on desktop and below the product grid on mobile. It shows product name, quantity controls, unit price, line total, subtotal, and grand total. **Clear bill** resets only the current transaction. **Complete bill** stores a local bill snapshot, displays a confirmation state, and provides **New bill**.

## Admin settings

Admin settings provide a local product editor with fields for product name, category, price, availability, and product image upload. Images are converted to compressed data URLs and stored with the product record in localStorage. Admins can add, edit, enable, disable, and delete products. Disabled products remain in local history but do not appear in billing.

Admin settings also provide a payment section where the supplied Paytm QR image can be uploaded, replaced, previewed, and cleared. The selected QR image is shown in the payment panel during billing so the cashier can present it to the customer.

## Reports and CSV

Daily reports are calculated from locally stored bills using the browser date in `Asia/Kolkata` presentation format. The report shows total bills, total items sold, total revenue, and a transaction list. CSV export is generated entirely in the browser and includes bill number, local date, local time, product, quantity, unit price, and line total. Clearing today's active report archives the bills locally by setting `archivedAt`; it does not erase historical records.

## Local data model

| Key | Stored shape | Purpose |
|---|---|---|
| `kba-local-products-v1` | `{ id, name, category, price, imageDataUrl, active, createdAt, updatedAt }[]` | Product catalogue and uploaded images |
| `kba-local-bills-v1` | `{ id, billNumber, createdAt, archivedAt, items, total }[]` | Completed local bills and historical snapshots |
| `kba-local-settings-v1` | `{ paymentQrDataUrl, canteenName, currency }` | Payment QR and kiosk settings |
| `kba-local-sequence-v1` | `{ dateKey, nextNumber }` | Sequential daily bill numbering |

Each bill item stores its own `productName`, `quantity`, `unitPrice`, and `lineTotal` so later product edits cannot change historical bills.

## Acceptance criteria

The revised application is successful when the cashier can open the launcher, enter billing, tap plus or minus controls, complete a bill without a camera or network, view the configured payment QR, begin the next bill, open daily reports, and download a CSV. The administrator can add a product with an image and price, edit it, disable it, delete it, and update the payment QR. Refreshing the browser preserves products, settings, and bills through localStorage.

## Out of scope for this revision

Camera scanning, backend persistence, Supabase calls, remote user authentication, payment gateway confirmation, inventory tracking, thermal printing, and multi-device synchronization are intentionally excluded from this local-only version.
