"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { CONTACT_EMAIL, POSTAL_ADDRESS } from "@/lib/site";

const quickLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms and Conditions" },
  { href: "/cookie-policy", label: "Cookie Policy" },
];

const linkClasses = "text-muted-foreground transition-colors hover:text-primary-strong";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <Logo className="h-11" />
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold tracking-wider uppercase">Quick Links</h2>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClasses}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold tracking-wider uppercase">Legal</h2>
          <ul className="space-y-2.5 text-sm">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClasses}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-bold tracking-wider uppercase">Contact Us</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden="true" />
              <div>
                <p className="font-semibold">Email us at</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-strong hover:text-primary-stronger hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden="true" />
              <div>
                <p className="font-semibold">Address</p>
                <address className="text-muted-foreground not-italic">
                  {POSTAL_ADDRESS}
                </address>
              </div>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-border">
        <Container className="py-5 text-sm text-muted-foreground">
          <p>Copyright © {currentYear} Vacation Rental Hotline, All rights reserved.</p>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
