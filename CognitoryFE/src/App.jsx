import { Routes, Route, Navigate } from "react-router-dom";
import AddQuestion from "./components/user/AddQuestion";
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
import Curriculum from "./components/curriculum/Curriculum";
import CreatedQuestion from "./components/user/CreatedQuestion";
import ReviewedQuestion from "./components/user/ReviewedQuestion";
import Question from "./components/admin/Question";
import Review from "./components/admin/Review";

function App() {
  const token = useSelector((state) => state?.user?.token);
  const role = useSelector((state) => state?.user?.user?.role);
  return (
    <div className="bg-black h-screen overflow-y-auto">
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
            <Route
              index
              element={<Navigate to="/admin/my-profile" replace />}
            />
            <Route path="my-profile" element={<MyProfile />} />
            <Route path="user" element={<Users />} />
            <Route path="question/all" element={<Question />} />
            <Route path="review/:enterpriseId" element={<Review />} />
            <Route path="question/:questionId" element={<Enterprise />} />
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
            <Route
              path="*"
              element={<Navigate to="/admin/my-profile" replace />}
            />
          </Route>
        ) : role === "super" ? (
          <Route path="/super" element={<Super />}>
            <Route
              index
              element={<Navigate to="/super/my-profile" replace />}
            />
            <Route path="my-profile" element={<MyProfile />} />
            <Route path="user" element={<Users />} />
            <Route path="curriculum" element={<Curriculum />} />
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
            <Route
              path="*"
              element={<Navigate to="/super/my-profile" replace />}
            />
          </Route>
        ) : (
          <Route path="/user" element={<User />}>
            <Route index element={<Navigate to="/user/my-profile" replace />} />
            <Route path="my-profile" element={<MyProfile />} />
            <Route
              path="question/add/:enterpriseId"
              element={<AddQuestion />}
            />
            <Route path="question/created" element={<CreatedQuestion />} />
            <Route path="question/reviewed" element={<ReviewedQuestion />} />
            <Route
              path="*"
              element={<Navigate to="/user/my-profile" replace />}
            />
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
                  ? "/super/my-profile"
                  : role === "admin"
                  ? "/admin/my-profile"
                  : "/user/my-profile"
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
