"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";

/** Purchase buttons: signed-in owners go to their dashboard, others to login. */
const PurchaseButton = ({ children, ...props }: Omit<ComponentProps<typeof Button>, "onClick">) => {
  const router = useRouter();
  const { data: session } = useSession();
  return (
    <Button {...props} onClick={() => router.push(session ? "/dashboard" : "/login")}>
      {children}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
};

export default PurchaseButton;
