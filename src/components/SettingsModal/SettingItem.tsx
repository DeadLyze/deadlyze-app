import { ReactNode } from "react";

interface SettingItemProps {
  title: string;
  description: string;
  control: ReactNode;
}

// Reusable setting item component with title, description and control
function SettingItem({ title, description, control }: SettingItemProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <h3
          style={{
            color: "#E0E0E0",
            fontSize: "15px",
            fontWeight: 500,
            marginBottom: "4px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "#9FA6AD",
            fontSize: "12px",
            fontWeight: 400,
            lineHeight: "1.5",
          }}
        >
          {description}
        </p>
      </div>
      {control}
    </div>
  );
}

export default SettingItem;
