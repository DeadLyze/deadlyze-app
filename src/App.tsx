import Sidebar from "./components/Sidebar/Sidebar";
import PageContainer from "./components/PageContainer/PageContainer";
import WindowControls from "./components/WindowControls/WindowControls";

function App() {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar />
      <PageContainer />
      <WindowControls />
    </div>
  );
}

export default App;
