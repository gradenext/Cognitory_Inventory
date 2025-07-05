import React from "react";

const Homepage = () => {
  return (
    <div className="text-center text-white space-y-6 m-2 bg-black/50 py-1 px-4 rounded-lg ">
      <h1 className=" text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text  drop-shadow-lg ">
        Welcome to Cognitory
      </h1>

      <p className=" text-base sm:text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
        Unlock the vaults of collective curiosity. Where answers shimmer and
        questions echo in the void.
      </p>

      <p className="text-sm sm:text-base max-w-md mx-auto italic">
        Drift through knowledge nebulae. Signal. Sync. Solve. Repeat.
      </p>
    </div>
  );
};

export default Homepage;
