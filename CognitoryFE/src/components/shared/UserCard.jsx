import { Loader2 } from "lucide-react";
import { useState } from "react";
import Modal from "./Modal";

const UserCard = ({
  user,
  onToggleApproval,
  onToggleRole,
  isActiveUser,
  activeAction,
  disabled,
}) => {
  const {
    _id,
    name,
    email,
    image,
    role,
    approved,
    approvedAt,
    approvedBy,
    createdAt,
    questionCount = 0,
  } = user;

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const isLoading =
    isActiveUser &&
    ((activeAction === "approve" && showApproveModal) ||
      (activeAction === "role" && showRoleModal));

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md border border-white text-white rounded-2xl shadow-md p-5 w-full h-fit max-w-md flex flex-col gap-y-2 transition hover:shadow-lg">
        {/* Top Info */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          <img
            src={image}
            alt={name}
            className="w-16 h-16 rounded-full border object-cover"
          />
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-semibold text-lg">{name}</h2>
            <p className="text-sm text-gray-300">{email}</p>
            <p className="text-xs text-gray-400">
              Joined: {new Date(createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400">Questions: {questionCount}</p>
          </div>
        </div>

        {/* Status + Analytics */}
        <div className="grid grid-cols-1 gap-y-1 text-sm text-gray-300 mt-2">
          <p>
            <span className="font-medium text-white">Role:</span>{" "}
            <span className="capitalize text-blue-400">{role}</span>
          </p>
          <p>
            <span className="font-medium text-white">Status:</span>{" "}
            <span className={approved ? "text-green-400" : "text-red-400"}>
              {approved ? "Approved" : "Not Approved"}
            </span>
          </p>
          <p>
            <span className="font-medium text-white">Approved At:</span>{" "}
            {approvedAt ? new Date(approvedAt).toLocaleDateString() : "—"}
          </p>
          <p>
            <span className="font-medium text-white">Approved By:</span>{" "}
            {approvedBy?.name || "—"}
          </p>

          {/* Only for regular users */}
          {role === "user" && (
            <>
              <hr className="my-2 border-white/10" />
              <p>
                <span className="font-medium text-white">
                  Questions Created:
                </span>{" "}
                {user.questionCount ?? 0}
              </p>
              <p>
                <span className="font-medium text-white">Reviewed:</span>{" "}
                {user.reviewedCount ?? 0}
              </p>
              <p>
                <span className="font-medium text-white">Approved:</span>{" "}
                {user.approvedCount ?? 0}
              </p>
              <p>
                <span className="font-medium text-white">Unapproved:</span>{" "}
                {user.unapprovedCount ?? 0}
              </p>
              <p>
                <span className="font-medium text-white">Avg. Rating:</span>{" "}
                {user.averageRating != null
                  ? user.averageRating.toFixed(2)
                  : "—"}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-center md:justify-between gap-2 pt-4 border-t border-white/10 mt-2">
          <button
            disabled={disabled}
            onClick={() => setShowApproveModal(true)}
            className={`px-4 py-2 text-sm rounded-lg flex justify-center items-center gap-2 transition w-full md:w-auto cursor-pointer ${
              approved
                ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-300 hover:bg-green-500/20"
            }`}
          >
            {approved ? "Unapprove" : "Approve"}
          </button>

          <button
            disabled={disabled}
            onClick={() => setShowRoleModal(true)}
            className={`px-4 py-2 text-sm rounded-lg flex justify-center items-center gap-2 transition w-full md:w-auto cursor-pointer ${
              role === "admin"
                ? "bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
                : "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
            } `}
          >
            {role === "admin" ? "Demote to User" : "Promote to Admin"}
          </button>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <Modal
          onClose={() => {
            if (isLoading) return;
            setShowApproveModal(false);
          }}
        >
          <h3 className="text-lg font-semibold mb-3">
            {approved ? "Unapprove" : "Approve"} {name}?
          </h3>
          <p className="text-sm mb-4 text-white">
            Are you sure you want to{" "}
            {approved ? "revoke approval from" : "approve"} this user?
          </p>
          <button
            onClick={async () => {
              await onToggleApproval(_id);
              setShowApproveModal(false);
            }}
            disabled={isLoading}
            className={`w-full bg-white text-black hover:bg-white hover:text-black cursor-pointer py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirm
          </button>
        </Modal>
      )}

      {/* Role Change Confirmation Modal */}
      {showRoleModal && (
        <Modal
          onClose={() => {
            if (isLoading) return;
            setShowRoleModal(false);
          }}
        >
          <h3 className="text-lg font-semibold mb-3">
            {role === "admin" ? "Demote" : "Promote"} {name}?
          </h3>
          <p className="text-sm mb-4 text-white">
            Are you sure you want to{" "}
            {role === "admin"
              ? "demote this admin to a regular user"
              : "promote this user to admin"}
            ?
          </p>
          <button
            onClick={async () => {
              await onToggleRole(_id, role === "admin");
              setShowRoleModal(false);
            }}
            disabled={isLoading}
            className={`w-full bg-white text-black hover:bg-white hover:text-black cursor-pointer py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirm
          </button>
        </Modal>
      )}
    </>
  );
};

export default UserCard;
