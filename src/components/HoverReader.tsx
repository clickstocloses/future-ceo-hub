import { ReactNode } from "react";
import { useScreenReader } from "@/hooks/useScreenReader";

type Props = {
  children: ReactNode;
  text?: string;       // overrides children text if provided
  as?: "span" | "div";
  className?: string;
};

export const HoverReader = ({ children, text, as = "span", className }: Props) => {
  const { speak, enabled } = useScreenReader();
  const Tag = as as any;

  // CRITICAL: no listeners when disabled
  if (!enabled) return <Tag className={className}>{children}</Tag>;

  const handle = () => {
    const t = text ?? (typeof children === "string" ? children : "");
    if (t) speak(t);
  };

  return (
    <Tag
      className={className}
      onMouseEnter={handle}
      onFocus={handle}
    >
      {children}
    </Tag>
  );
};
