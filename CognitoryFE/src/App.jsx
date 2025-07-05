import { Routes, Route, Navigate } from "react-router-dom";
import AddQuestion from "./pages/AddQuestion";
import Auth from "./pages/Auth";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import { Navbar } from "./components/shared/Navbar";
import { useSelector } from "react-redux";
import ForgetPassword from "./components/auth/ForgetPassword";
import User from "./pages/User";
import Admin from "./pages/Admin";
import ResetPassword from "./components/auth/ResetPassword";
import Homepage from "./components/auth/Homepage";

function App() {
  const token = useSelector((state) => state?.user?.token);
  const role = useSelector((state) => state?.user?.user?.role);
  return (
    <div className="bg-black h-screen">
      <Navbar />
      <Routes>
        {!token ? (
          <Route path="/" element={<Auth />}>
            <Route index element={<Homepage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forget-password" element={<ForgetPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route replace path="*" element={<Navigate to={"/login"} />} />
          </Route>
        ) : role === "admin" ? (
          <Route path="/admin" element={<Admin />}>
            <Route index element={<div className="text-white">Admin</div>} />
          </Route>
        ) : (
          <Route path="/user" element={<User />}>
            <Route index element={<div className="text-white">User</div>} />
            <Route
              path="question/add/:enterpriseId"
              element={<AddQuestion />}
            />
          </Route>
        )}
      </Routes>
    </div>
  );
}

export default App;
