import type { MetadataRoute } from "next";

// §14 of the platform blueprint — baseline crawlability, dashboard/admin
// routes excluded since they're behind auth anyway.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manzil.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/dealer", "/company", "/tenant", "/plaza", "/login", "/register", "/verify-otp"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
