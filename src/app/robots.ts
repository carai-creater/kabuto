import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kabuto-two.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/agents", "/agents/", "/about", "/terms", "/privacy"],
        disallow: ["/dashboard/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
