import { AppShell } from "@/components/app-shell";

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
