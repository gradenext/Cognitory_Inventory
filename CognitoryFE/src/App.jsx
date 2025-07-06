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
import Super from "./pages/Super";
import MyProfile from "./components/shared/MyProfile";
import Users from "./components/admin/Users";
import Enterprise from "./components/curriculum/Enterprise";
import Class from "./components/curriculum/Class";
import Subject from "./components/curriculum/Subject";
import Topic from "./components/curriculum/Topic";
import Subtopic from "./components/curriculum/Subtopic";

function App() {
  const token = useSelector((state) => state?.user?.token);
  const role = useSelector((state) => state?.user?.user?.role);
  return (
    <div className="bg-black h-screen overflow-hidden ">
      <Navbar />
      <Routes>
        {!token ? (
          <Route path="/" element={<Auth />}>
            <Route index element={<Homepage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forget-password" element={<ForgetPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        ) : role === "admin" ? (
          <Route path="/admin" element={<Admin />}>
            <Route index path="my-profile" element={<MyProfile />} />
            <Route path="user" element={<Users />} />
            <Route path="curriculum/:enterpriseId" element={<Enterprise />} />
            <Route
              path="curriculum/:enterpriseId/:classId"
              element={<Class />}
            />
            <Route
              path="curriculum/:enterpriseId/:classId/:subjectId"
              element={<Subject />}
            />
            <Route
              path="curriculum/:enterpriseId/:classId/:subjectId/:topicId"
              element={<Topic />}
            />
            <Route
              path="curriculum/:enterpriseId/:classId/:subjectId/:topicId/:subtopicId"
              element={<Subtopic />}
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        ) : role === "super" ? (
          <Route path="/super" element={<Super />}>
            <Route index element={<div className="text-white">Super</div>} />
            <Route path="my-profile" element={<MyProfile />} />
            <Route path="curriculum/:enterpriseId" element={<Enterprise />} />
            <Route
              path="curriculum/:enterpriseId/:classId"
              element={<Class />}
            />
            <Route
              path="curriculum/:enterpriseId/:classId/:subjectId"
              element={<Subject />}
            />
            <Route
              path="curriculum/:enterpriseId/:classId/:subjectId/:topicId"
              element={<Topic />}
            />
            <Route
              path="curriculum/:enterpriseId/:classId/:subjectId/:topicId/:subtopicId"
              element={<Subtopic />}
            />
            <Route path="*" element={<Navigate to="/super" replace />} />
          </Route>
        ) : (
          <Route path="/user" element={<User />}>
            <Route index element={<div className="text-white">User</div>} />
            <Route path="my-profile" element={<MyProfile />} />
            <Route
              path="question/add/:enterpriseId"
              element={<AddQuestion />}
            />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </Route>
        )}
        <Route
          path="*"
          element={
            <Navigate
              to={
                !token
                  ? "/login"
                  : role === "super"
                  ? "/super"
                  : role === "admin"
                  ? "/admin"
                  : "/user"
              }
              replace
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
