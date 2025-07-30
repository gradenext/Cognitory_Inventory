import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserProfile } from "../../services/getAPIs";
import Metric from "../shared/Metric";

const CountBadge = ({ label, count }) => (
  <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-lg text-white text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between shadow">
    <span className="text-white/80">{label}</span>
    <span className="font-bold text-lg">{count}</span>
  </div>
);

const UserProfilePage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();
        setUser(res.user);
        setStats(res.stats);
        setBreakdown(res.breakdown);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  if (!user || !stats) {
    return (
      <div className="text-white px-6 py-10">
        <p className="text-sm py-24 w-full flex justify-center items-center">
          <Loader2 size={40} className="animate-spin" />
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Profile Info */}
      <div className="bg-white/5 border border-white/20 rounded-xl shadow">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <img
              src={user.image}
              alt="User"
              className="w-16 h-16 rounded-full border border-white/20 object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-white/70 text-sm break-all">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-white/20 my-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <CountBadge label="Questions" count={stats.questionCount} />
            <CountBadge label="Reviewed" count={stats.reviewedCount} />
            <CountBadge label="Approved" count={stats.approvedCount} />
            <CountBadge label="Unapproved" count={stats.unapprovedCount} />
            <CountBadge label="Avg Rating" count={stats.averageRating ?? "-"} />
          </div>
        </div>
      </div>

      {/* Interaction Breakdown */}
      <Metric data={breakdown} />
    </div>
  );
};

export default UserProfilePage;
