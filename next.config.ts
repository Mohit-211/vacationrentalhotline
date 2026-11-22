import type { NextConfig } from "next";

// Routes renamed on 2026-11-22. The old URLs redirect permanently, query
// strings included, so links in emails the backend has already sent (for
// example /email-verify?token=...) keep working.
const renamedRoutes = [
  { source: "/addnewproperty", destination: "/properties/new" },
  { source: "/addnewproperty/:id", destination: "/properties/:id/edit" },
  { source: "/property-detail/:id", destination: "/properties/:id" },
  { source: "/profile", destination: "/account" },
  { source: "/change-password", destination: "/account/password" },
  { source: "/email-verify", destination: "/verify-email" },
  { source: "/change-email-verify", destination: "/verify-email-change" },
  { source: "/terms-and-conditions", destination: "/terms" },
  { source: "/cookies-policy", destination: "/cookie-policy" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      ...renamedRoutes.map((route) => ({ ...route, permanent: true })),
      // There's no properties index yet; the dashboard lists them.
      { source: "/properties", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
