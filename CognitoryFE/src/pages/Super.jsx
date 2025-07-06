import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";

const Super = () => {
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
      label: "Curriculums",
      path: "curriculum",
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

export default Super;
