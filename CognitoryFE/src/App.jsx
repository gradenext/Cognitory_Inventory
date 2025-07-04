import { Routes, Route, Navigate } from "react-router-dom";
import AddQuestion from "./pages/AddQuestion";

function App() {
  return (
    <div>
      <Routes>
        <Route
          index
          path="/question/add/:enterpriseId"
          element={<AddQuestion />}
        />
        <Route path="*" element={<Navigate to={"/question/add/6867b105b3742460a7db2326"} />} />
      </Routes>
    </div>
  );
}

export default App;
