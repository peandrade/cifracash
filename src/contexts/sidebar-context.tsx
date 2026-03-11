"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mounted: boolean;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
  isOpen: boolean; // computed: expanded via toggle OR hover
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  mounted: false,
  isHovered: false,
  setIsHovered: () => {},
  isOpen: true,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Começa colapsada para evitar flash de conteúdo
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cifracash-sidebar-collapsed");
    // Só expande se localStorage explicitamente disser "false"
    if (saved === "false") {
      setIsCollapsed(false);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("cifracash-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed, mounted]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Sidebar is "open" when not collapsed OR when hovered
  const isOpen = !isCollapsed || isHovered;

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, mounted, isHovered, setIsHovered, isOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
