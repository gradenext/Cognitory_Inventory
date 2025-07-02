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
        <Route path="*" element={<Navigate to={"/question/add/686114dec54f9369ebd13664"} />} />
      </Routes>
    </div>
  );
}

export default App;
