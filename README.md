# Bi-quicker

Bi-quicker is a React + TypeScript + Vite digital marketplace application for customers, store owners, delivery riders, and platform administrators.

## Current implementation

The first application slice recreates the supplied Figma role-selection and authentication experience as a real React application.

- Role selection: Customer, Store Owner, Delivery Rider, Super Admin
- Responsive desktop, tablet, and mobile layouts
- Role-specific visual themes and icons
- Customer, Store Admin, and Rider registration flows
- Sign-in flows for all four roles
- Form validation and error feedback
- Demo-account sign-in flow
- Password visibility control
- Password-reset/support interaction
- Terms of Service and Privacy Policy dialog
- Client-side account/session persistence for development testing

## Routes

- `#/`
- `#/customer/signin`
- `#/customer/signup`
- `#/store-admin/signin`
- `#/store-admin/signup`
- `#/rider/signin`
- `#/rider/signup`
- `#/super-admin/signin`

## Development

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Then open the Vite development URL shown in the terminal.

## Validation

```bash
npm run typecheck
npm run build
npm run preview
```

## Architecture

```text
src/
  components/   Reusable UI components
  lib/          Roles, types, and development storage
  pages/        Route-level React pages
  assets/       Application assets
  App.tsx       Lightweight route shell
  main.tsx      React entry point
```

The current browser storage is intentionally a development-only authentication layer. Production authentication, API integration, payments, orders, delivery operations, and dashboards will be implemented as subsequent application slices rather than simulated in the UI.
