import { Routes, Route, Navigate } from "react-router-dom";
import AddQuestion from "./pages/AddQuestion";

function App() {
  return (
    <div>
      <Routes>
        <Route index path="/question/add" element={<AddQuestion />} />
        <Route path="*" element={<Navigate to={"/question/add"} />} />
      </Routes>
    </div>
  );
}

export default App;
