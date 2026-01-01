function LaunchHeader() {
  return (
    <div
      className="flex flex-col items-center gap-6"
      style={{ width: "350px" }}
    >
      <h1
        className="text-[78px] font-[900] text-center"
        style={{
          background:
            "linear-gradient(135deg, #C0A777 0%, #24B584 65%, #1DA475 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: "1.1",
        }}
      >
        DeadLyze
      </h1>
      <button
        className="flex items-center gap-4 pl-2 group"
        style={{
          width: "350px",
          height: "85px",
          borderRadius: "42.5px",
          background: "#10262F",
          backgroundImage:
            "linear-gradient(135deg, rgba(50, 194, 132, 0.26) 15%, rgba(40, 27, 101, 0) 85%)",
          pointerEvents: "auto",
        }}
      >
        <img
          src="/assets/deadlock_logo.png"
          alt="Deadlock"
          className="transition-transform duration-300 group-hover:rotate-[-15deg]"
          style={{
            width: "70px",
            height: "70px",
            pointerEvents: "none",
          }}
        />
        <span
          style={{
            color: "#E6CA9C",
            fontSize: "20px",
            fontWeight: 900,
            letterSpacing: "0.5px",
          }}
        >
          ЗАПУСТИТЬ DEADLOCK
        </span>
      </button>
    </div>
  );
}

export default LaunchHeader;
