import { RxCross2 } from "react-icons/rx";
import { getCurrentWindow } from "@tauri-apps/api/window";

function WindowControls() {
  const appWindow = getCurrentWindow();

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleClose = async () => {
    appWindow.close();
  };

  return (
    <div
      className="fixed flex items-start gap-[25px]"
      style={{
        pointerEvents: "none",
        top: "16px",
        right: "16px",
        zIndex: 9999,
      }}
    >
      <button
        onClick={handleMinimize}
        className="flex items-end justify-center transition-opacity hover:opacity-70"
        style={{
          pointerEvents: "auto",
          width: "26px",
          height: "26px",
        }}
        aria-label="Minimize"
      >
        <div
          className="rounded-full"
          style={{
            backgroundColor: "#21C271",
            width: "26px",
            height: "3px",
          }}
        />
      </button>
      <button
        onClick={handleClose}
        className="flex items-center justify-center transition-opacity hover:opacity-70"
        style={{
          pointerEvents: "auto",
          width: "36px",
          height: "36px",
        }}
        aria-label="Close"
      >
        <RxCross2 size={36} color="#21C271" />
      </button>
    </div>
  );
}

export default WindowControls;
