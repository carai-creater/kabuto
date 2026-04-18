import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/is-database-configured";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kabuto-two.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/agents`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  if (!isDatabaseConfigured()) {
    return staticPages;
  }

  try {
    const agents = await prisma.agent.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { usageCount: "desc" },
    });

    const agentPages: MetadataRoute.Sitemap = agents.map((a) => ({
      url: `${BASE}/agents/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...agentPages];
  } catch {
    return staticPages;
  }
}
