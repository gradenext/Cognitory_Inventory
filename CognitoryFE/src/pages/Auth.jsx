import React from "react";
import { Outlet } from "react-router-dom";
import TypewriterText from "../components/auth/TypewriterText";
import RotatingPyramid from "../components/shared/RotaingPyramid";

const Auth = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center bg-black text-white overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center items-center py-12">
        <div className="scale-150">
          <RotatingPyramid />
        </div>
        <div className="text-[4rem] sm:text-[8rem] text-white/50 font-bold leading-none mt-8 h-48 ">
          <TypewriterText />
        </div>
      </div>

      {/* Glass Form Container */}
      <div className="relative z-10 flex h-full items-center justify-center mt-24 mb-8 ">
        <div className="w-[90%] max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Auth;
