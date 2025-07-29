import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  createEnterprise,
  createClass,
  createLevel,
  createSubject,
  createSubtopic,
  createTopic,
} from "../../services/createAPIs";
import { toast } from "react-hot-toast";
import Modal from "../shared/Modal";
import Input from "../shared/Input";
import Select from "../shared/Select";
import { useQueryObject } from "../../services/query";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import { errorToast, successToast } from "../toast/Toast";

const rankOptions = Array.from({ length: 5 }, (_, i) => ({
  label: `Rank ${i + 1}`,
  value: i + 1,
}));

const createFunction = (type) => {
  switch (type) {
    case "enterprise":
      return createEnterprise;
    case "class":
      return createClass;

    case "subject":
      return createSubject;

    case "topic":
      return createTopic;

    case "subtopic":
      return createSubtopic;

    case "level":
      return createLevel;

    default:
      break;
  }
};

const Add = ({ type }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rank, setRank] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const role = useSelector((state) => state?.user?.user?.role);

  const { enterpriseId, classId, subjectId, topicId, subtopicId } = useParams();
  const {
    enterpriseQuery,
    classesQuery,
    subjectsQuery,
    topicsQuery,
    subtopicsQuery,
    levelsQuery,
  } = useQueryObject({ enterpriseId, classId, subjectId, topicId, subtopicId });

  const refetchQuery = (type, { classId, subjectId, topicId, subtopicId }) => {
    switch (type) {
      case "enterprise":
        return enterpriseQuery.refetch();
      case "class":
        return classesQuery.refetch();
      case "subject":
        if (!classId) return;
        return subjectsQuery.refetch();
      case "topic":
        if (!subjectId) return;
        return topicsQuery.refetch();
      case "subtopic":
        if (!topicId) return;
        return subtopicsQuery.refetch();
      case "level":
        if (!subtopicId) return;
        return levelsQuery.refetch();
      default:
        return null;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (role !== "super" && type === "enterprise") {
      errorToast("Reserver for super admin");
      setOpen(false);
      return;
    }

    const validationErrors = {};
    if (!name.trim()) validationErrors.name = "Name is required";
    if (type === "level" && !rank) validationErrors.rank = "Rank is required";
    if (type === "enterprise" && !email)
      validationErrors.email = "Email is required";

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);

      const payload = {
        name,
        enterpriseId,
        classId,
        subjectId,
        topicId,
        subtopicId,
      };
      if (type === "level") payload.rank = rank;
      if (type === "enterprise") payload.email = email;

      const createEntity = createFunction(type);

      const res = await createEntity(payload);
      refetchQuery(type, {
        enterpriseId,
        classId,
        subjectId,
        topicId,
        subtopicId,
      });
      successToast(res?.message || `${type} created`);
      setOpen(false);
      setName("");
      setRank(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => !loading && setOpen(true)}
        className="flex flex-col items-center justify-center border-dashed border-2 border-white/20 text-white/40 hover:text-white/80 hover:border-white/50 transition-all rounded-xl min-h-44 min-w-44 cursor-pointer"
      >
        <div className="text-4xl font-light">+</div>
        <p className="text-sm mt-1">Add {type}</p>
      </div>

      {open && (
        <Modal onClose={() => !loading && setOpen(false)} title={`Add ${type}`}>
          <form onSubmit={onSubmit} className="space-y-4 mt-4">
            {type === "enterprise" && (
              <Input
                label="Email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                error={errors.email}
                disabled={loading}
              />
            )}
            <Input
              label="Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              error={errors.name}
              disabled={loading}
            />

            {type === "level" && (
              <Select
                label="Rank"
                options={rankOptions}
                selectedOption={rank}
                onSelect={(value) => setRank(value)}
                placeholder="Select rank"
                error={errors.rank}
                disabled={loading}
              />
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 cursor-pointer rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all disabled:opacity-50"
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
                type="button"
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default Add;
