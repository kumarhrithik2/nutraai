# NutraAI Labs Frontend

NutraAI Labs is a responsive React 19 frontend built with Vite, Tailwind CSS v4, React Router, Axios, and Lucide icons.

## Development

```sh
npm install
npm run dev
```

Set `VITE_API_BASE_URL` to configure the Axios client base URL. It defaults to `/api`. The frontend does not define or call application endpoints; backend integration should be added only after the backend contract is available.

### Development preview mode

To browse dashboard screens locally without an account service, explicitly enable the visual-only preview mode before starting Vite:

```powershell
$env:VITE_ENABLE_PREVIEW_MODE = "true"
npm run dev
```

In bash, use `VITE_ENABLE_PREVIEW_MODE=true npm run dev`. The dashboard displays a persistent **Development Preview – Sample Data** label; no customer identity or personal data is loaded, and backend-dependent actions remain unavailable. Set the variable to `false` (or remove it) and restart Vite to restore the `/login` redirect. Preview mode is also disabled in production builds.

## Validation

```sh
npm run lint
npm run build
npm run test:qa
npm run test:qa:auth-protection
```

Playwright tests run against the Vite development server and cover public navigation, authentication validation, account and wellness module states, assessment validation, product and checkout availability, membership presentation, responsive layouts, browser errors, and automated WCAG 2.1 A/AA checks.

## Integration status

Account, password recovery, assessment submission, AI assistance, reports, recommendations, profile updates and picture uploads, progress tracking, product catalogue, cart, checkout, orders, membership changes, supplement subscriptions, billing, notifications, settings, and contact delivery are backend-dependent and are not connected in this frontend.

The UI validates forms and presents explicit unavailable states. It does not claim that authentication, a message, assessment, recommendation, order, payment, subscription, renewal, notification, or preference update succeeded. Assessment answers and editable profile/preferences remain in page memory only and are cleared when the screen is left or reloaded. Profile picture selection supports a local preview only; images are not uploaded or persisted.

Exactly three membership options are presented:

- Free — ₹0
- Monthly — ₹999/month
- Yearly — ₹10,190/year

Plan entitlements are displayed for comparison. No trial, payment, subscription, or billing operation is simulated.

## Structure

- `src/components/home/` contains homepage sections and membership presentation.
- `src/components/layout/` contains shared public and workspace navigation.
- `src/pages/` contains public, account, commerce, assessment, and workspace screens.
- `src/routes/AppRoutes.jsx` defines public and workspace routes.
- `src/services/apiClient.js` configures the Axios client for a future backend integration.
- `src/services/membershipPlans.js` defines the approved plan prices and entitlements.
- `src/styles/` contains responsive site styling; Tailwind CSS v4 is loaded through its Vite plugin.

## Screens

- Public: `/`, `/about`, `/products`, `/products/:slug`, `/how-it-works`, `/membership`, `/contact`
- Account: `/login`, `/register`, `/forgot-password`
- Workspace: `/dashboard`, `/dashboard/profile`, `/dashboard/assessment`, `/dashboard/report`, `/dashboard/recommendations`, `/dashboard/wellness-plan`, `/dashboard/assistant`, `/dashboard/marketplace`, `/dashboard/cart`, `/dashboard/checkout`, `/dashboard/orders`, `/dashboard/subscriptions`, `/dashboard/progress`, `/dashboard/notifications`, `/dashboard/settings`
- `/assessment` redirects to the workspace assessment screen.
