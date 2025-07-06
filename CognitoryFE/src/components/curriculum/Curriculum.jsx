import { useQueryObject } from "../../services/query";
import Add from "./Add";
import { Loader2 } from "lucide-react";
import EnterpriseCard from "./EnterpriseCard";

const Curriculum = () => {
  const { enterprises, enterprisesQuery } = useQueryObject({});

  const isLoading = enterprisesQuery?.isLoading;
  const isEmpty =
    !isLoading && (!enterprises?.enterprises || enterprises.enterprises.length === 0);

  return (
    <div className="p-6 flex flex-col items-center">
      <Add type={"enterprise"} />

      <div className="p-6 w-full flex flex-wrap  gap-x-6 gap-y-4">
        {isLoading ? (
          <p className="text-white text-sm py-24 w-full flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        ) : isEmpty ? (
          <p className="text-white text-lg italic py-24 w-full flex justify-center items-center">
            No enterprises available yet.
          </p>
        ) : (
          enterprises.enterprises.map((cls) => (
            <EnterpriseCard key={cls.value} data={cls} />
          ))
        )}
      </div>
    </div>
  );
};

export default Curriculum;
