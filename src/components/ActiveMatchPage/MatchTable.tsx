import React from "react";

interface TableColumnProps {
  children: React.ReactNode;
  className?: string;
  flex?: string;
  align?: "left" | "center" | "right";
  isLast?: boolean;
}

export const TableColumn: React.FC<TableColumnProps> = ({
  children,
  className = "",
  flex = "1",
  align = "center",
  isLast = false,
}) => {
  const alignmentClass =
    align === "left"
      ? "justify-start"
      : align === "right"
      ? "justify-end"
      : "justify-center";

  return (
    <div
      className={`flex items-center px-3 py-2 text-[#e6ca9c] text-sm border-r border-[#21c271]/10 last:border-r-0 ${alignmentClass} ${
        isLast ? "ml-auto" : ""
      } ${className}`}
      style={{ flex }}
    >
      {children}
    </div>
  );
};

interface TableRowProps {
  children: React.ReactNode;
}

export const TableRow: React.FC<TableRowProps> = ({ children }) => {
  return (
    <div className="flex w-full h-[50px] bg-[#174842]/30 rounded hover:bg-[#21c271]/10">
      {children}
    </div>
  );
};

interface MatchTableProps {
  children: React.ReactNode;
}

export const MatchTable: React.FC<MatchTableProps> = ({ children }) => {
  return <div className="flex flex-col w-full gap-0.5">{children}</div>;
};
