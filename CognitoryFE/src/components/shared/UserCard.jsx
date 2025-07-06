import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldOff,
  Loader2,
} from "lucide-react";

const UserCard = ({
  user,
  onToggleApproval,
  onToggleRole,
  isActiveUser,
  activeAction,
  disabled,
}) => {
  const {
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

  return (
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

      {/* Status */}
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-center md:justify-between gap-2 pt-4 border-t border-white/10 mt-2">
        <button
          disabled={disabled}
          onClick={() => onToggleApproval(user._id)}
          className={`px-4 py-2 text-sm rounded-lg flex justify-center items-center gap-2 transition w-full md:w-auto cursor-pointer ${
            approved
              ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
              : "bg-green-500/10 text-green-300 hover:bg-green-500/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isActiveUser && activeAction === "approve" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : approved ? (
            <XCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          {approved ? "Unapprove" : "Approve"}
        </button>

        <button
          disabled={disabled}
          onClick={() => onToggleRole(user._id, role === "admin")}
          className={`px-4 py-2 text-sm rounded-lg flex justify-center items-center gap-2 transition w-full md:w-auto cursor-pointer ${
            role === "admin"
              ? "bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
              : "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isActiveUser && activeAction === "role" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : role === "admin" ? (
            <ShieldOff size={16} />
          ) : (
            <ShieldCheck size={16} />
          )}
          {role === "admin" ? "Demote to User" : "Promote to Admin"}
        </button>
      </div>
    </div>
  );
};

export default UserCard;
