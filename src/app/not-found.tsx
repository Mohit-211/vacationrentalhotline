import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo variant="mark" className="h-16" />
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-wider text-primary-strong uppercase">404</p>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">The page you’re looking for doesn’t exist or has moved.</p>
      </div>
      <Button asChild>
        <Link href="/">Go to Home</Link>
      </Button>
    </main>
  );
}
