import Sidebar from "./components/Sidebar/Sidebar";
import PageContainer from "./components/PageContainer/PageContainer";

function App() {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar />
      <PageContainer />
    </div>
  );
}

export default App;
