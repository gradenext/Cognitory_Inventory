import UserCard from "../shared/UserCard";
import { demoteAdmin, promoteUser, toggleApprove } from "../../services/auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { errorToast, successToast } from "../toast/Toast";
import { useQueryObject } from "../../services/query";

const Users = () => {
  const [actionInProgress, setActionInProgress] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  const { usersForAdminQuery: users } = useQueryObject({});

  const isLoading = users.isLoading || users.isFetching;
  const userUsers = users?.data?.filter((u) => u.role === "user");
  const adminUsers = users?.data?.filter((u) => u.role === "admin");

  const onToggleApproval = async (userId) => {
    try {
      setActionInProgress(true);
      setActiveUserId(userId);
      setActiveAction("approve");
      const response = await toggleApprove(userId);
      successToast(response?.message);
      await users.refetch();
    } catch (error) {
      errorToast(error?.response?.data?.message || "Approval failed");
    } finally {
      setActionInProgress(false);
      setActiveUserId(null);
      setActiveAction(null);
    }
  };

  const onToggleRole = async (userId, isAdmin) => {
    try {
      setActionInProgress(true);
      setActiveUserId(userId);
      setActiveAction("role");
      const caller = isAdmin ? demoteAdmin : promoteUser;
      const response = await caller(userId);
      successToast(response?.message);
      await users.refetch();
    } catch (error) {
      errorToast(error?.response?.data?.message || "Role update failed");
    } finally {
      setActionInProgress(false);
      setActiveUserId(null);
      setActiveAction(null);
    }
  };

  return (
    <div className="space-y-16 p-6">
      {/* Loading Spinner */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-white w-8 h-8" />
        </div>
      ) : (
        <>
          {/* Users */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Users</h2>
            {userUsers?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userUsers.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onToggleApproval={onToggleApproval}
                    onToggleRole={onToggleRole}
                    isActiveUser={activeUserId === user._id}
                    activeAction={activeAction}
                    disabled={actionInProgress}
                  />
                ))}
              </div>
            ) : (
              <p className="text-white/70 text-sm">No users found.</p>
            )}
          </div>

          {/* Admins */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">Admins</h2>
            {adminUsers?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminUsers.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onToggleApproval={onToggleApproval}
                    onToggleRole={onToggleRole}
                    isActiveUser={activeUserId === user._id}
                    activeAction={activeAction}
                    disabled={actionInProgress}
                  />
                ))}
              </div>
            ) : (
              <p className="text-white/70 text-sm">No admins found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Users;
