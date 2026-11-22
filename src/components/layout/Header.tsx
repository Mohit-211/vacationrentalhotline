"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Logo } from "@/components/ui/Logo";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { authClient, useSession } from "@/lib/auth-client";
import { useIsClient } from "@/lib/useIsClient";

const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const navLinkClasses =
  "rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary-strong";
const sheetLinkClasses =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold text-foreground transition-colors hover:bg-surface-muted [&_svg]:size-5 [&_svg]:text-muted-foreground";

/**
 * The home page's section links are real #anchors (they work without
 * JavaScript and open in a new tab); a click scrolls smoothly instead.
 */
const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
  event.preventDefault();
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();
  const { data: session, isPending } = useSession();
  // Until the session is known, the account area keeps its space empty.
  const sessionKnown = isClient && !isPending;
  const signedIn = sessionKnown && Boolean(session);
  const [menuOpen, setMenuOpen] = useState(false);
  // The sections live on the home page; elsewhere the footer links to them.
  const showSectionLinks = isClient && pathname === "/";

  const handleLogout = async () => {
    // Ends the session on the server too, not just in this browser.
    await authClient.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 rounded-md">
          <Logo priority className="h-9 sm:h-10" />
        </Link>

        {/* Desktop */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {showSectionLinks &&
            sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={navLinkClasses}
                onClick={(event) => scrollToSection(event, section.id)}
              >
                {section.label}
              </a>
            ))}
          {!sessionKnown ? (
            // Reserve the account area's space until the session is known.
            <div className="ml-3 h-9 w-44" aria-hidden="true" />
          ) : signedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-3">
                  <UserRound aria-hidden="true" />
                  My Account
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <UserRound aria-hidden="true" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard aria-hidden="true" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut aria-hidden="true" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-3 flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile: the same choices as on desktop */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="size-6" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Main" className="grid gap-1">
              {showSectionLinks &&
                sections.map((section) => (
                  <SheetClose asChild key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={sheetLinkClasses}
                      onClick={(event) => scrollToSection(event, section.id)}
                    >
                      {section.label}
                    </a>
                  </SheetClose>
                ))}
              {signedIn ? (
                <>
                  <SheetClose asChild>
                    <Link href="/account" className={sheetLinkClasses}>
                      <UserRound aria-hidden="true" />
                      Profile
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/dashboard" className={sheetLinkClasses}>
                      <LayoutDashboard aria-hidden="true" />
                      Dashboard
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <button type="button" className={sheetLinkClasses} onClick={handleLogout}>
                      <LogOut aria-hidden="true" />
                      Logout
                    </button>
                  </SheetClose>
                </>
              ) : (
                <div className="mt-4 grid gap-2">
                  <SheetClose asChild>
                    <Button asChild size="lg">
                      <Link href="/login">Login</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
};

export default Header;
