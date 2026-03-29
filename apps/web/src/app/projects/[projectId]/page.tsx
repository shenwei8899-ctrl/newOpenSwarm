import { redirect } from "next/navigation";

type ProjectShellRedirectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectShellRedirectPage({
  params
}: ProjectShellRedirectPageProps) {
  const { projectId } = await params;
  redirect(`/teams/${projectId}/workspace`);
}
