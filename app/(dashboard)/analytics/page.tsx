import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MysqlAccountRepository } from "@/lib/db/repositories/accounts";
import { AnalyticsClient } from "./AnalyticsClient";

const accountRepo = new MysqlAccountRepository();

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const accounts = await accountRepo.findAll(session.user.id);
  return <AnalyticsClient accounts={accounts} />;
}
