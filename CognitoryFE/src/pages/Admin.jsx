import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";

const Admin = () => {
  let tabs = [
    {
      label: "My Profile",
      path: "my-profile",
    },
    {
      label: "Users",
      path: "user/all",
    },
    {
      label: "Questions",
      path: "question/all",
    },
    {
      label: "Reviews",
      path: "review/all",
    },
    {
      label: "Curriculum",
      path: `curriculum/${import.meta.env.VITE_ENTERPRISE_ID}`,
    },
  ];

  return (
    <div className="flex pt-16">
      {/* Sidebar */}
      <div className="w-20 sm:w-40 md:w-60 fixed top-16 left-0 z-40 h-[calc(100vh-4rem)]">
        <Sidebar tabs={tabs} />
      </div>

      {/* Main Content */}
      <div className="md:ml-60 flex-1 w-full md:min-h-[calc(100vh-4rem)] p-2">
        <div className="bg-white/10 h-full backdrop-blur-3xl rounded-2xl shadow-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Admin;
