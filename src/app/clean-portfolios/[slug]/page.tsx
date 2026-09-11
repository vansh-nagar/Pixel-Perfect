import { notFound, redirect } from "next/navigation";
import { portfolioTemplates } from "@/components/clean-portfolios/templates";

export function generateStaticParams() {
  return portfolioTemplates.map(({ slug }) => ({ slug }));
}

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!portfolioTemplates.some((template) => template.slug === slug)) notFound();
  redirect(`/blocks/clean-portfolios?template=${slug}`);
}
