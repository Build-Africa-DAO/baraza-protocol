import { redirect } from "next/navigation";
import { getUser } from "@/app/lib/auth/dal";
import LoginCard from "./LoginCard";

export const metadata = {
  title: "Sign in · Baraza",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getUser();
  if (user) redirect("/");

  const { error } = await searchParams;

  return <LoginCard oauthError={error === "oauth"} />;
}
