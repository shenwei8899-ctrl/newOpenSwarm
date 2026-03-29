import { redirect } from "next/navigation";

type ProjectSkillsRedirectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectSkillsRedirectPage({
  params
}: ProjectSkillsRedirectPageProps) {
  const { projectId } = await params;
  redirect(`/teams/${projectId}/skills`);
}
