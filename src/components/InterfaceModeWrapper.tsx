import { ReactNode } from "react";
import { useSystem } from "@/contexts/SystemContext";
import type { InterfaceMode } from "@/types/system";

interface SimplifiedWrapperProps {
  children: ReactNode;
  simplifiedContent?: ReactNode;
  minimalContent?: ReactNode;
}

/**
 * Wraps content with interface mode awareness.
 * In 'standard' mode, renders children as-is.
 * In 'simplified' mode, renders simplifiedContent if provided, otherwise children.
 * In 'minimal' mode, renders minimalContent if provided, otherwise simplifiedContent, otherwise children.
 */
export function InterfaceModeWrapper({ children, simplifiedContent, minimalContent }: SimplifiedWrapperProps) {
  const { activeInterfaceMode } = useSystem();

  if (activeInterfaceMode === 'minimal') {
    return <>{minimalContent ?? simplifiedContent ?? children}</>;
  }
  if (activeInterfaceMode === 'simplified') {
    return <>{simplifiedContent ?? children}</>;
  }
  return <>{children}</>;
}

/**
 * Only renders children in the specified modes (or higher).
 */
export function ShowInMode({ mode, children }: { mode: InterfaceMode | InterfaceMode[]; children: ReactNode }) {
  const { activeInterfaceMode } = useSystem();
  const modes = Array.isArray(mode) ? mode : [mode];
  if (!modes.includes(activeInterfaceMode)) return null;
  return <>{children}</>;
}

/**
 * Hides children when in the specified mode(s).
 */
export function HideInMode({ mode, children }: { mode: InterfaceMode | InterfaceMode[]; children: ReactNode }) {
  const { activeInterfaceMode } = useSystem();
  const modes = Array.isArray(mode) ? mode : [mode];
  if (modes.includes(activeInterfaceMode)) return null;
  return <>{children}</>;
}
