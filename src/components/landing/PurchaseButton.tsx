"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";

/** Purchase buttons: links that take signed-in owners to their dashboard, others to login. */
const PurchaseButton = ({ children, ...props }: Omit<ComponentProps<typeof Button>, "onClick" | "asChild">) => {
  const { data: session } = useSession();
  return (
    <Button asChild {...props}>
      <Link href={session ? "/dashboard" : "/login"}>
        {children}
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
};

export default PurchaseButton;
