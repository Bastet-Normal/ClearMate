"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/local-store";

export function ElderModeProvider({ children }: { children: React.ReactNode }) {
  const [isElder, setIsElder] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setIsElder(user?.member_mode === "elder");
  }, []);

  return (
    <div className={isElder ? "elder-mode" : ""}>
      {children}
    </div>
  );
}
