import { redirect } from "next/navigation";

export default async function LegacyReadingArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  redirect(`/reading/article/${(await params).slug}`);
}
