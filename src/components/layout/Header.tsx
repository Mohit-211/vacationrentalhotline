"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, KeyRound, LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";
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
import { clearToken, getToken } from "@/lib/session";
import { useIsClient } from "@/lib/useIsClient";

const sections = [
  { id: "banner-section", label: "Home" },
  { id: "about-section", label: "About" },
  { id: "contact-us", label: "Contact" },
];

const navLinkClasses =
  "rounded-md px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary-strong";
const sheetLinkClasses =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold text-foreground transition-colors hover:bg-surface-muted [&_svg]:size-5 [&_svg]:text-muted-foreground";

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useIsClient();
  const token = isClient ? getToken() : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const showSectionLinks = isClient && pathname === "/";

  const handleScrollLinkClick = (sectionId: string) => {
    const path = "/";
    if (pathname !== path) {
      router.push(`${path}#${sectionId}`);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = () => {
    router.push("/");
    clearToken();
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
              <button
                key={section.id}
                type="button"
                className={navLinkClasses}
                onClick={() => handleScrollLinkClick(section.id)}
              >
                {section.label}
              </button>
            ))}
          {!isClient ? (
            // Reserve the account area's space until the session is known.
            <div className="ml-3 h-9 w-44" aria-hidden="true" />
          ) : token ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-3">
                  <UserRound aria-hidden="true" />
                  My Account
                  <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => router.push("/profile")}>
                  <UserRound aria-hidden="true" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
                  <LayoutDashboard aria-hidden="true" />
                  Dashboard
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
              <Button variant="ghost" size="sm" onClick={() => router.push("/signup")}>
                Sign Up
              </Button>
              <Button size="sm" onClick={() => router.push("/login")}>
                Login
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile */}
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
                    <button type="button" className={sheetLinkClasses} onClick={() => handleScrollLinkClick(section.id)}>
                      {section.label}
                    </button>
                  </SheetClose>
                ))}
              {isClient && token ? (
                <>
                  <SheetClose asChild>
                    <button type="button" className={sheetLinkClasses} onClick={() => router.push("/change-password")}>
                      <KeyRound aria-hidden="true" />
                      Change Password
                    </button>
                  </SheetClose>
                  <SheetClose asChild>
                    <button type="button" className={sheetLinkClasses} onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard aria-hidden="true" />
                      Dashboard
                    </button>
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
                    <Button size="lg" onClick={() => router.push("/login")}>
                      Login
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button size="lg" variant="outline" onClick={() => router.push("/signup")}>
                      Sign Up
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
