import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.enum([
      "Technical SEO",
      "Local SEO",
      "Process",
      "Content Strategy",
      "Reporting",
      "Strategy",
      "AI Search",
    ]),
    date: z.string(),
    readTime: z.string(),
    draft: z.boolean().default(false),
    author: z.string().default("GetUsRanked Team"),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
