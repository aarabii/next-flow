import { memo } from "react";

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  color?: string;
  className?: string;
  [key: string]: unknown;
}

const DotField = memo(
  ({
    dotRadius = 1.5,
    dotSpacing = 16,
    color = "rgba(0, 0, 0, 0.15)",
    className = "",
    ...rest
  }: DotFieldProps) => {
    const size = dotSpacing;

    return (
      <div
        className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
        {...rest}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="dot-grid-pattern"
              width={size}
              height={size}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={size / 2} cy={size / 2} r={dotRadius} fill={color} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-pattern)" />
        </svg>
      </div>
    );
  },
);

DotField.displayName = "DotField";

export default DotField;
