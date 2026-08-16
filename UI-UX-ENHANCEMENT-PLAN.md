# KBA Canteen UI/UX Enhancement Plan

## Objective

Enhance the local-first KBA Canteen kiosk so it feels more polished, legible, touch-friendly, and operationally clear while preserving the existing billing, localStorage, payment QR, daily reports, CSV, Clear Today, and three-sound behavior.

## Design Direction

The interface will retain the recognizable luxury-purple identity, but use a more disciplined semantic token system rather than isolated colors. The visual language will be a **soft premium operations kiosk**: pale lavender canvas, deep plum text, elevated white surfaces, restrained violet accents, and clear success/destructive states. Frosted-glass treatment will be used selectively for navigation and status surfaces, not for every card.

| Area | Decision | Implementation intent |
|---|---|---|
| Brand colors | Preserve `#FBF1FF`, `#E3D0EA`, `#9B71B2`, `#3A1C36` | Keep the existing KBA identity while improving semantic contrast |
| Supporting colors | Add accessible success, warning, and destructive tokens | Make saved, archived, invalid, and destructive states distinguishable without relying on color alone |
| Typography | Keep the playful Baloo direction for headings and use a calmer rounded sans for body copy | Improve hierarchy, scanning, price readability, and form legibility |
| Layout | Billing-first content hierarchy with clear product grid, current bill panel, and fixed bottom navigation | Make the next action obvious on mobile and desktop |
| Touch | Minimum 44px controls with at least 8px spacing | Support cashier use on phones and touchscreens |
| Focus | Visible 2px focus ring with offset | Support keyboard navigation and accessibility |
| Motion | 150–300ms transitions and restrained staggered product entry | Add polish without slowing checkout; respect reduced motion |
| Navigation | Keep five bottom items: Bill, Add, Edit, Reports, QR | Preserve the existing mental model and avoid overloaded navigation |

## Screen Priorities

### Billing

Prioritize product discovery, clear add/plus/minus affordances, category filtering, current-bill visibility, and the Next action. Product cards will have a stronger price hierarchy and more obvious quantity controls while keeping item-card additions and plus/minus actions functionally unchanged.

### Payment

Make the amount and payment QR the primary visual focus. Keep Complete & Save prominent, with enough separation from the back action to reduce accidental completion.

### Add and Edit

Use clearer field grouping, explicit labels, larger upload controls, and a more visible saved-state confirmation. Preserve localStorage behavior and user-managed catalogue content.

### Reports

Present today’s bills, items, and revenue as a concise metric row, followed by clear Download CSV and Clear Today actions. Destructive actions will retain confirmation and archival behavior.

### QR Settings

Keep QR preview, replacement, and removal visually separate. Preserve local persistence and the existing sound behavior unless explicitly changed later.

## Accessibility and Responsive Checks

The implementation will verify 375px, 390px, 768px, 1024px, and 1440px layouts. Interactive controls will be keyboard reachable, have visible focus states, use accessible labels where icons appear, and avoid content being hidden behind the fixed bottom navigation. Non-essential animations will be disabled under `prefers-reduced-motion: reduce`.

## Preservation Constraints

The enhancement must not change product data, bill calculations, bill numbering, local archival, CSV fields, QR persistence, or the sound mapping. The existing sound assignments remain: mouse-click for item add, tap-notification for successful plus/minus quantity changes, and cash-register for Complete Payment.

## Delivery Sequence

First, update the global typography, tokens, focus states, responsive spacing, and navigation surfaces. Second, refine billing, payment, forms, reports, and QR settings using those tokens. Third, run type checks, tests, production build, and responsive screenshots before saving a new checkpoint.
