import { useEffect, useState } from "react";

const TypewriterText = () => {
  const [text, setText] = useState("");
  const [dir, setDir] = useState(1); // 1 = typing, -1 = deleting
  const baseText = "cognitory...";
  const speed = 150;

  useEffect(() => {
    const interval = setInterval(() => {
      setText((prev) => {
        if (dir === 1) {
          if (prev.length < baseText.length) {
            return baseText.slice(0, prev.length + 1);
          } else {
            setDir(-1);
            return prev;
          }
        } else {
          if (prev.length > 0) {
            return baseText.slice(0, prev.length - 1);
          } else {
            setDir(1); 
            return "";
          }
        }
      });
    }, speed);

    return () => clearInterval(interval);
  }, [dir]);

  return <span className="blur-xs sm:blur-sm">{text}</span>;
};

export default TypewriterText