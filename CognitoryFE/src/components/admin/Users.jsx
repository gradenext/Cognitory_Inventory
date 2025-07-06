import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getAllUsers } from "../../services/getAPIs";
import UserCard from "../shared/UserCard";
import { demoteAdmin, promoteUser, toggleApprove } from "../../services/auth";
import { useState } from "react";

const Users = () => {
  const users = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const [actionInProgress, setActionInProgress] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeAction, setActiveAction] = useState(null); // "approve" | "role"

  const onToggleApproval = async (userId) => {
    try {
      setActionInProgress(true);
      setActiveUserId(userId);
      setActiveAction("approve");
      const response = await toggleApprove(userId);
      toast.success(response?.message);
      await users.refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Approval failed");
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
      toast.success(response?.message);
      await users.refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Role update failed");
    } finally {
      setActionInProgress(false);
      setActiveUserId(null);
      setActiveAction(null);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users?.data?.map((user) => (
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
  );
};

export default Users;
