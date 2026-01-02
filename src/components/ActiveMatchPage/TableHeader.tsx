import React from "react";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";

export const TableHeader: React.FC = () => {
  return (
    <div className="flex w-full h-[40px] bg-[#0a1a1f]/80 -mx-1 px-1">
      {MATCH_TABLE_COLUMNS.map((column) => (
        <div
          key={column.id}
          className={`flex items-center px-3 text-[#e6ca9c] text-sm font-semibold uppercase tracking-wide border-r border-[#21c271]/10 last:border-r-0 ${
            column.align === "left"
              ? "justify-start"
              : column.align === "right"
              ? "justify-end"
              : "justify-center"
          }`}
          style={{ flex: column.flex }}
        >
          {column.label}
        </div>
      ))}
    </div>
  );
};
