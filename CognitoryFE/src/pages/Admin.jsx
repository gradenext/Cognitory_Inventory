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
      path: "user",
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
      path: "curriculum/686961aee7955f838157b93e",
    },
  ];

  return (
    <div className="flex mt-16 h-full">
      <div className="w-60">
        <Sidebar tabs={tabs} />
      </div>
      <div className="w-full m-1 bg-white/10 backdrop-blur-3xl flex justify-center rounded-2xl overflow-y-auto  ">
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;
