import { type ViewProps } from "react-native";
import { ClaySurface } from "../clay/ClaySurface";
import { cn } from "../cn";

export function Card({ className, children, style, ...props }: ViewProps & { className?: string }) {
  return (
    <ClaySurface
      variant="raised"
      radius="card"
      className={cn("p-4", className)}
      style={style}
      {...props}
    >
      {children}
    </ClaySurface>
  );
}
