import LaunchHeader from "../../components/HomePage/LaunchHeader/LaunchHeader";

function HomePage() {
  return (
    <div
      className="w-full h-full flex items-center pl-16"
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <LaunchHeader />
    </div>
  );
}

export default HomePage;
