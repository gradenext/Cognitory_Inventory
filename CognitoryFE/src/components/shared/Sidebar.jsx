import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
const Sidebar = ({ tabs }) => {
  const navigate = useNavigate();
  return (
    <div className="h-[100dvh] z-0 min-w-60 bg-white/10 shadow-white shadow-sm px-2 py-2  my-1 rounded-r-2xl flex flex-col justify-start gap-y-6 ">
      <button
        onClick={() => navigate(-1)}
        className="flex justify-center items-center gap-x-2 bg-white text-black hover:bg-black hover:text-white p-2 cursor-pointer border hover:border-white border-black rounded-full w-fit mx-auto"
      >
        <ArrowLeft />
      </button>
      <div className="flex flex-col gap-y-2">
        {tabs?.map((tab, index) => (
          <Link key={index} to={tab.path}>
            <div className="group text-white bg-black/80  hover:bg-white hover:text-black px-3 py-2 flex justify-between items-center gap-x-6 text-lg rounded-lg cursor-pointer  font-semibold border hover:border-black transition-colors duration-200">
              <div>{tab.label}</div>
              <div className="p-1 rounded-full text-black bg-white group-hover:text-white group-hover:bg-black transition-colors duration-200">
                <ArrowRight />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
