import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { currentUser } from "@/lib/auth";
import { Shell } from "@/components/Shell";

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <Shell
      user={{
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      }}
    >
      {children}
    </Shell>
  );
}
