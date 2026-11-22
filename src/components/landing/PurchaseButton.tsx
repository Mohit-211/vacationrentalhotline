"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getToken } from "@/lib/session";

/** Purchase buttons: signed-in owners go to their dashboard, others to login. */
const PurchaseButton = ({ children, ...props }: Omit<ComponentProps<typeof Button>, "onClick">) => {
  const router = useRouter();
  return (
    <Button {...props} onClick={() => (getToken() ? router.push("/dashboard") : router.push("/login"))}>
      {children}
      <ArrowRight aria-hidden="true" />
    </Button>
  );
};

export default PurchaseButton;
