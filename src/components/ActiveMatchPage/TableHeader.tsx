import React from "react";
import { useTranslation } from "react-i18next";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";

export const TableHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full h-[40px] bg-[#0a1a1f]/80 -mx-1 px-1">
      {MATCH_TABLE_COLUMNS.map((column) => (
        <div
          key={column.id}
          className={`flex items-center text-[#9FA6AD] text-xs font-medium uppercase tracking-wide border-r border-[#21c271]/10 last:border-r-0 ${
            column.id === "player"
              ? "justify-center"
              : column.align === "left"
              ? "justify-start"
              : column.align === "right"
              ? "justify-end"
              : "justify-center"
          }`}
          style={{
            flex: column.flex,
            overflow: "hidden",
          }}
        >
          {t(`activeMatch.table.columns.${column.id}`)}
        </div>
      ))}
    </div>
  );
};
