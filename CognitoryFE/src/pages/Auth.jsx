import React from "react";
import { Outlet } from "react-router-dom";
import TypewriterText from "../components/auth/TypewriterText";
import RotatingPyramid from "../components/shared/RotaingPyramid";

const Auth = () => {
  return (
    <div className="relative h-screen w-full bg-black text-white flex items-center justify-center overflow-hidden">
      {/* Background Typing Animation */}
      <div className="absolute top-1/2 -translate-y-1/2 text-white/30 z-0 flex flex-col justify-between">
        <RotatingPyramid />
        <div className="h-96 text-[200px]">
          <TypewriterText />
        </div>
      </div>

      {/* Glass Form Container */}
      <div className="relative z-10 w-[90%] max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
        <Outlet />
      </div>
    </div>
  );
};

export default Auth;
