import { getGroupBySlug } from "@/server/actions/admin";
import { notFound } from "next/navigation";
import { KhatmPage } from "./khatm-page";
import { GoalPage } from "./goal-page";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return {};

  return {
    title: `${group.name} — ختم القرآن`,
    description: group.goalDescription ?? "ختمة القرآن الكريم",
    openGraph: {
      title: group.name,
      description: group.goalDescription ?? "ختمة القرآن الكريم",
      images: group.bannerUrl
        ? [{ url: group.bannerUrl, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: group.name,
      images: group.bannerUrl ? [group.bannerUrl] : undefined,
    },
  };
}

export default async function GroupSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) notFound();

  if (group.type === "goal") {
    return <GoalPage groupId={group.id} />;
  }

  return <KhatmPage groupId={group.id} groupName={group.name} bannerUrl={group.bannerUrl} />;
}
