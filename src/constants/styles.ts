export const STYLES = {
  TITLE: {
    fontSize: "78px",
    fontWeight: 900,
    gradient: "linear-gradient(135deg, #C0A777 0%, #24B584 65%, #1DA475 100%)",
    dropShadow:
      "drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.3)) drop-shadow(-1px -1px 2px rgba(255, 255, 255, 0.1))",
  },
  BUTTON: {
    width: "350px",
    height: "85px",
    borderRadius: "42.5px",
    paddingLeft: "78.5px",
    background: {
      normal: "#10262F",
      disabled: "#1a1f25",
    },
    gradient: {
      normal:
        "linear-gradient(135deg, rgba(50, 194, 132, 0.26) 15%, rgba(40, 27, 101, 0) 85%)",
      disabled:
        "linear-gradient(135deg, rgba(60, 65, 70, 0.3) 15%, rgba(30, 30, 35, 0) 85%)",
    },
    boxShadow: {
      normal:
        "inset 4px 4px 7px rgba(255, 255, 255, 0.06), inset -4px -4px 7px rgba(0, 0, 0, 0.25)",
      pressed:
        "inset 4px 4px 9px rgba(0, 0, 0, 0.3), inset -4px -4px 10px rgba(0, 0, 0, 0.4)",
    },
    dropShadow:
      "drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2)) drop-shadow(-0.5px -0.5px 1px rgba(255, 255, 255, 0.05))",
  },
  TEXT: {
    fontSize: "20px",
    fontWeight: 900,
    letterSpacing: "0.5px",
    color: {
      normal: "#E6CA9C",
      disabled: "#b0b5ba",
    },
  },
  LOGO: {
    width: "70px",
    height: "70px",
    position: { left: "8.5px", top: "7.5px" },
    shadow: {
      width: "62px",
      height: "62px",
      position: { left: "3px", top: "2.7px" },
    },
  },
} as const;
