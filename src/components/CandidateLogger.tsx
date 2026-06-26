"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function CandidateLogger() {
  const pathname = usePathname();
  const loggedPathnames = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loggedPathnames.current.has(pathname)) {
      loggedPathnames.current.add(pathname);
      console.log("[PY] Candidate Linkedin: https://linkedin.com/in/aarab-nishchal");
    }
  }, [pathname]);

  return null;
}
