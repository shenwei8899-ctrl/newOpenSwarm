import { redirect } from "next/navigation";

type ProjectDiscussionRedirectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDiscussionRedirectPage({
  params
}: ProjectDiscussionRedirectPageProps) {
  const { projectId } = await params;
  redirect(`/teams/${projectId}/discussion`);
}
