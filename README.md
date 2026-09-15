# Bi-quicker

A responsive static recreation of the Bi-quicker role-selection and multi-role authentication UI, based on the supplied Figma Make design and reference screenshots.

## Included

- Role selection for Customer, Store Owner, Delivery Rider, and Super Admin
- Responsive desktop/tablet/mobile layouts
- Separate sign-in routes for each role
- Sign-up flows for customer, store owner, and rider
- Role-specific colors and icons
- Password visibility toggle and demo-account fill interaction
- Bi-quicker logo asset

## Routes

- `#/`
- `#/customer/signin`
- `#/customer/signup`
- `#/store-admin/signin`
- `#/store-admin/signup`
- `#/rider/signin`
- `#/rider/signup`
- `#/super-admin/signin`

## Run locally

Serve the folder with any static web server. For example:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173/`.

## Notes

This recreation is intentionally dependency-free so it can be previewed without installing a React toolchain. The original design source uses React, React Router, Lucide icons, and shadcn/ui-style components; the static implementation reproduces the visible authentication/landing experience without those runtime dependencies.
