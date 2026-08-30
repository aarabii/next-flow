"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AuthorLogger() {
  const pathname = usePathname();
  const loggedPathnames = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loggedPathnames.current.has(pathname)) {
      loggedPathnames.current.add(pathname);
      console.log({
        linkedin: "https://linkedin.com/in/aarab-nishchal",
      });
    }
  }, [pathname]);

  return null;
}
