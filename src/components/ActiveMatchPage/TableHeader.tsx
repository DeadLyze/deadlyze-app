import React from "react";
import { useTranslation } from "react-i18next";
import { MATCH_TABLE_COLUMNS } from "./tableConfig";
import { TABLE_HEADER_HEIGHT } from "../../constants/uiConstants";

export const TableHeader: React.FC = () => {
  const { t } = useTranslation();

  const renderColumnHeader = (columnId: string) => {
    if (columnId === "matches" || columnId === "relation") {
      const subtitleKey =
        columnId === "matches" ? "matchesSubtitle" : "relationSubtitle";
      return (
        <div className="flex flex-col items-center justify-center leading-none gap-[2px]">
          <div className="text-xs font-medium uppercase tracking-wide">
            {t(`activeMatch.table.columns.${columnId}`)}
          </div>
          <div className="text-[9px] font-normal opacity-80">
            {t(`activeMatch.table.columns.${subtitleKey}`)}
          </div>
        </div>
      );
    }
    return t(`activeMatch.table.columns.${columnId}`);
  };

  return (
    <div
      className="flex w-full -mx-1 px-1"
      style={{ height: `${TABLE_HEADER_HEIGHT}px` }}
    >
      {MATCH_TABLE_COLUMNS.map((column) => (
        <div
          key={column.id}
          className={`flex items-center text-[#9FA6AD] text-xs font-medium uppercase tracking-wide ${
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
          {renderColumnHeader(column.id)}
        </div>
      ))}
    </div>
  );
};
