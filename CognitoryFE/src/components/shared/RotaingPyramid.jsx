import React from "react";

const RotatingPyramid = () => {
  return (
    <div className="pyramid-container">
      <div className="side left"></div>
      <div className="side front"></div>
      <div className="side right"></div>
      <div className="side back"></div>
      <div className="shadow"></div>

      <style>{`
        .pyramid-container {
          width: 400px;
          height: 400px;
          margin: 0 auto;
          position: relative;
          perspective: 300px;
          perspective-origin: 50% 40%;
        }

        .side {
          position: absolute;
          left: 140px;
          top: 150px;
          width: 0;
          height: 0;
          border-left: 60px solid transparent;
          border-right: 60px solid transparent;
          border-bottom: 120px solid white;
          transform-origin: 50% 0%;
          animation: spinning 5s infinite linear;
          opacity: 1;
        }

        .back {
          animation-delay: -2.5s;
        }

        .right {
          animation-delay: -1.25s;
        }

        .left {
          animation-delay: -3.75s;
        }

        @keyframes spinning {
          0% {
            transform: rotateY(0deg) rotateX(30deg);
            border-bottom-color: rgba(255, 255, 255, 0.9);
          }
          25% {
            transform: rotateY(90deg) rotateX(30deg);
            border-bottom-color: rgba(255, 255, 255, 0.85);
            opacity: 1;
          }
          25.1% {
            opacity: 0;
          }
          50% {
            transform: rotateY(180deg) rotateX(30deg);
            border-bottom-color: rgba(255, 255, 255, 0.75);
          }
          74.9% {
            opacity: 0;
          }
          75% {
            transform: rotateY(270deg) rotateX(30deg);
            border-bottom-color: rgba(255, 255, 255, 0.7);
            opacity: 1;
          }
          100% {
            transform: rotateY(360deg) rotateX(30deg);
            border-bottom-color: rgba(255, 255, 255, 0.9);
          }
        }

        .shadow {
          position: absolute;
          top: 300px;
          left: 175px;
          width: 50px;
          height: 50px;
          background-color: white;
          box-shadow: 0 0 40px 40px white;
          animation: shadowSpin 5s infinite linear;
        }

        @keyframes shadowSpin {
          0% {
            transform: rotateX(90deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(90deg) rotateZ(-360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RotatingPyramid;
