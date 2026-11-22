import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 py-8 sm:py-10">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
