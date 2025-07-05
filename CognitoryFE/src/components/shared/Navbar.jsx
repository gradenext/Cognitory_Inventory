import { AtSign, DoorOpen, LogIn, Pyramid } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logOut } from "../../redux/slice/userSlice";

export const Navbar = () => {
  const token = useSelector((state) => state?.user?.token);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  return (
    <nav className="h-16 px-6 fixed top-0 z-50 w-full flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/10 text-white shadow-sm">
      {/* Left: Logo and Brand */}
      <div className="flex items-center gap-2">
        <Pyramid className="" />
        <span className="text-xl font-semibold tracking-wide">Cognitory</span>
      </div>

      {token ? (
        <button
          onClick={() => {
            dispatch(logOut());
            navigate("/login");
          }}
          className="px-4 py-2 flex justify-center items-center gap-x-2 rounded-lg text-sm bg-white text-black hover:bg-white/90 transition cursor-pointer hover:underline"
        >
          <DoorOpen size={16} />
          Logout
        </button>
      ) : (
        <div>
          {location.pathname === "/signup" ? (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 flex justify-center items-center gap-x-2 rounded-lg text-sm bg-white text-black hover:bg-white/90 transition cursor-pointer hover:underline"
            >
              <LogIn size={16} />
              Login
            </button>
          ) : (
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 flex justify-center items-center gap-x-2 rounded-lg text-sm bg-white text-black hover:bg-white/90 transition cursor-pointer hover:underline"
            >
              <AtSign size={16} />
              Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
