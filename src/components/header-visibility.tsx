"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

export function HeaderVisibility({ children }: Props) {
  const pathname = usePathname();
  if (pathname.startsWith("/agents/")) {
    return null;
  }
  return <>{children}</>;
}
