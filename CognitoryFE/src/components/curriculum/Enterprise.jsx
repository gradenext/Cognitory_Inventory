import { useParams } from "react-router-dom";
import ClassCard from "./ClassCard";
import { useQueryObject } from "../../services/query";
import Add from "./Add";
import { Loader2 } from "lucide-react";

const Enterprise = () => {
  const { enterpriseId } = useParams();

  const { classes, classesQuery } = useQueryObject({ enterpriseId });

  const isLoading = classesQuery?.isLoading;
  const isEmpty =
    !isLoading && (!classes?.classes || classes.classes.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">
      <Add type={"class"} />

      <div className="p-6 w-full flex flex-wrap  gap-x-6 gap-y-4">
        {isLoading ? (
          <p className="text-white text-sm py-24 w-full flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        ) : isEmpty ? (
          <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
            No classes available yet.
          </p>
        ) : (
          classes.classes.map((cls) => <ClassCard key={cls.value} data={cls} />)
        )}
      </div>
    </div>
  );
};

export default Enterprise;
