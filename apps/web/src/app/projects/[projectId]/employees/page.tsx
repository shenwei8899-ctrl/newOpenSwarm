import { redirect } from "next/navigation";

type ProjectEmployeesRedirectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectEmployeesRedirectPage({
  params
}: ProjectEmployeesRedirectPageProps) {
  const { projectId } = await params;
  redirect(`/teams/${projectId}/members`);
}
