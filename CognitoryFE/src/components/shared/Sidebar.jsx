import { useState } from "react";
import { ArrowLeft, ArrowRight, Menu, MenuSquare, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Sidebar = ({ tabs }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Sidebar container */}
      <div
        className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-60 bg-white/10 shadow-md backdrop-blur-md p-4 rounded-r-2xl transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:static md:translate-x-0 md:w-full md:h-[calc(100vh-4rem)]`}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex justify-center items-center gap-x-2 cursor-pointer bg-white text-black hover:bg-black hover:text-white p-2 border hover:border-white border-black rounded-full w-fit mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Tabs */}
        <div className="mt-6 flex flex-col gap-y-2 overflow-y-auto h-full">
          {tabs?.map((tab, index) => (
            <Link key={index} to={tab.path} onClick={() => setIsOpen(false)}>
              <div className="group text-white bg-black/80 hover:bg-white hover:text-black px-3 py-2 flex justify-between items-center gap-x-4 text-sm sm:text-base md:text-lg rounded-lg font-semibold border hover:border-black transition-all duration-200">
                <div className="truncate">{tab.label}</div>
                <div className="p-1 rounded-full text-black bg-white group-hover:text-white group-hover:bg-black transition-colors duration-200">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Toggle semi-circle button (ALWAYS attached to sidebar edge) */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-20 z-50 p-2 w-fit h-fit rounded-r-md shadow-lg flex items-center justify-center transition-all duration-300
        md:hidden bg-white text-black border border-black
        ${isOpen ? "left-60 " : "left-0 "}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MenuSquare className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;
