/** Spójna jasna powłoka aplikacji (kremowe tło, pomarańczowy akcent — bez trybu `dark`). */
export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
