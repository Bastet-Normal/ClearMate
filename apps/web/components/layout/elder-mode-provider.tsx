"use client";

import { useEffect, useState } from "react";

export function ElderModeProvider({ children }: { children: React.ReactNode }) {
  const [isElder, setIsElder] = useState(false);

  useEffect(() => {
    const elderPref = localStorage.getItem("cm_elder_mode");
    setIsElder(elderPref === "elder");

    const handleModeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsElder(!!customEvent.detail?.isElder);
    };

    window.addEventListener("cm:elder-mode-change", handleModeChange);
    return () => {
      window.removeEventListener("cm:elder-mode-change", handleModeChange);
    };
  }, []);

  return (
    <div className={isElder ? "elder-mode" : ""}>
      {children}
    </div>
  );
}
