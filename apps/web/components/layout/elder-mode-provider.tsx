"use client";

import { useEffect, useState } from "react";

export function ElderModeProvider({ children }: { children: React.ReactNode }) {
  const [isElder, setIsElder] = useState(false);

  useEffect(() => {
    const elderPref = localStorage.getItem("cm_elder_mode");
    setIsElder(elderPref === "elder");
  }, []);

  return (
    <div className={isElder ? "elder-mode" : ""}>
      {children}
    </div>
  );
}
