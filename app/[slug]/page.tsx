import { getGroupBySlug } from "@/server/actions/admin";
import { notFound } from "next/navigation";
import { KhatmPage } from "./khatm-page";
import { GoalPage } from "./goal-page";

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
