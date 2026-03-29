import { redirect } from "next/navigation";

type ProjectTasksRedirectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectTasksRedirectPage({
  params
}: ProjectTasksRedirectPageProps) {
  const { projectId } = await params;
  redirect(`/teams/${projectId}/tasks`);
}
