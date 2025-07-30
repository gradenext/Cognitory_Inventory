import { Loader2 } from "lucide-react";
import Metric from "../shared/Metric";
import { useParams } from "react-router-dom";
import { useQueryObject } from "../../services/query";

const CountBadge = ({ label, count }) => (
  <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-lg text-white text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between shadow">
    <span className="text-white/80">{label}</span>
    <span className="font-bold text-lg">{count}</span>
  </div>
);

const UserProfileAdmin = () => {
  const { userId } = useParams();

  const { userQuery } = useQueryObject({ userId });

  const user = userQuery?.data?.user;
  const stats = userQuery?.data?.stats;
  const breakdown = userQuery?.data?.breakdown;

  return (
    <>
      {userQuery?.isLoading ? (
        <div className="text-white px-6 py-10">
          <p className="text-sm py-24 w-full flex justify-center items-center">
            <Loader2 size={40} className="animate-spin" />
          </p>
        </div>
      ) : (
        <div className=" mx-auto w-full px-8 py-10 space-y-10">
          {/* Profile Info */}
          <div className="bg-white/5 border border-white/20 rounded-xl shadow">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4 flex-wrap">
                <img
                  src={user?.image}
                  alt="User"
                  className="w-16 h-16 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {user?.name}
                  </h2>
                  <p className="text-white/70 text-sm break-all">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="h-px bg-white/20 my-2" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <CountBadge label="Questions" count={stats?.questionCount} />
                <CountBadge label="Reviewed" count={stats?.reviewedCount} />
                <CountBadge label="Approved" count={stats?.approvedCount} />
                <CountBadge label="Unapproved" count={stats?.unapprovedCount} />
                <CountBadge
                  label="Avg Rating"
                  count={stats?.averageRating ?? "-"}
                />
              </div>

              {/* Extra User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white w-full">
                {user?.role && (
                  <div className="flex justify-between px-4">
                    <span className="text-white/40">Role:</span>
                    <span className="capitalize">{user.role}</span>
                  </div>
                )}

                {user?.approvedAt && (
                  <div className="flex justify-between px-4">
                    <span className="text-white/40">Approved At:</span>
                    <span>{new Date(user.approvedAt).toLocaleString()}</span>
                  </div>
                )}

                {user?.approved !== undefined && (
                  <div className="flex justify-between px-4">
                    <span className="text-white/40">Approved:</span>
                    <span>{user.approved ? "Yes" : "No"}</span>
                  </div>
                )}

                {user?.createdAt && (
                  <div className="flex justify-between px-4">
                    <span className="text-white/40">Created At:</span>
                    <span>{new Date(user.createdAt).toLocaleString()}</span>
                  </div>
                )}

                {user?.approvedBy && (
                  <div className="flex justify-between px-4">
                    <span className="text-white/40">Approved By:</span>
                    <span>
                      {user.approvedBy.name} ({user.approvedBy.email})
                    </span>
                  </div>
                )}

                {user?.updatedAt && (
                  <div className="flex justify-between px-4">
                    <span className="text-white/40">Updated At:</span>
                    <span>{new Date(user.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interaction Breakdown */}
          <Metric data={breakdown} />
        </div>
      )}
    </>
  );
};

export default UserProfileAdmin;
