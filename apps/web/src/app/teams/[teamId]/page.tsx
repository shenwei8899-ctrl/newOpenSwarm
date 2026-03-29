import { redirect } from "next/navigation";

type TeamIndexPageProps = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamIndexPage({ params }: TeamIndexPageProps) {
  const { teamId } = await params;
  redirect(`/teams/${teamId}/workspace`);
}
