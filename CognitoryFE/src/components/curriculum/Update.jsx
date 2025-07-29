import React, { useEffect, useState } from "react";
import Input from "../shared/Input";
import Select from "../shared/Select";
import Modal from "../shared/Modal";
import { toast } from "react-hot-toast";
import {
  updateEnterprise,
  updateClass,
  updateSubject,
  updateTopic,
  updateSubtopic,
  updateLevel,
} from "../../services/updateAPIs";
import {
  getEnterpriseById,
  getClassById,
  getSubjectById,
  getTopicById,
  getSubtopicById,
  getLevelById,
} from "../../services/getByIdAPIs";
import { useParams } from "react-router-dom";
import { useQueryObject } from "../../services/query";
import { Loader2, Pencil } from "lucide-react";
import { errorToast, successToast } from "../toast/Toast";

const rankOptions = Array.from({ length: 5 }, (_, i) => ({
  label: `Rank ${i + 1}`,
  value: i + 1,
}));

const updateFunction = (type) => {
  switch (type) {
    case "enterprise":
      return updateEnterprise;
    case "class":
      return updateClass;
    case "subject":
      return updateSubject;
    case "topic":
      return updateTopic;
    case "subtopic":
      return updateSubtopic;
    case "level":
      return updateLevel;
    default:
      return null;
  }
};

const getFunction = (type) => {
  switch (type) {
    case "enterprise":
      return getEnterpriseById;
    case "class":
      return getClassById;
    case "subject":
      return getSubjectById;
    case "topic":
      return getTopicById;
    case "subtopic":
      return getSubtopicById;
    case "level":
      return getLevelById;
    default:
      return null;
  }
};

const Update = ({ id, type }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rank, setRank] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const { enterpriseId, classId, subjectId, topicId, subtopicId } = useParams();
  const {
    enterpriseQuery,
    classesQuery,
    subjectsQuery,
    topicsQuery,
    subtopicsQuery,
    levelsQuery,
  } = useQueryObject({ enterpriseId, classId, subjectId, topicId, subtopicId });

  const refetchQuery = (type) => {
    switch (type) {
      case "enterprise":
        return enterpriseQuery.refetch();
      case "class":
        return classesQuery.refetch();
      case "subject":
        return subjectsQuery.refetch();
      case "topic":
        return topicsQuery.refetch();
      case "subtopic":
        return subtopicsQuery.refetch();
      case "level":
        return levelsQuery.refetch();
      default:
        return null;
    }
  };

  const fetchData = async () => {
    try {
      setFetching(true);
      const getter = getFunction(type);
      const entity = await getter(id);

      setName(entity?.data?.name || "");
      setEmail(entity?.data?.email || "");
      setRank(entity?.data?.rank || null);
    } catch (err) {
      errorToast("Failed to load entity");
      setIsOpen(false);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    if (!name.trim()) validationErrors.name = "Name is required";
    if (type === "level" && !rank) validationErrors.rank = "Rank is required";
    if (type === "enterprise" && !email)
      validationErrors.email = "Email is required";

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      const update = updateFunction(type);
      const payload = { name };
      if (type === "enterprise") payload.email = email;
      if (type === "level") payload.rank = rank;

      const res = await update(id, payload);
      successToast(res?.message || "Updated");

      refetchQuery(type);
      setIsOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Update failed";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (e) => {
    e.stopPropagation();
    setIsOpen(true);
    fetchData();
  };

  return (
    <>
      <button
        onClick={openModal}
        className="bg-white text-black p-1 rounded-full transition-all cursor-pointer "
      >
        <Pencil size={18} />
      </button>

      {isOpen && (
        <Modal
          onClose={() => !loading && setIsOpen(false)}
          title={`Edit ${type}`}
        >
          {fetching ? (
            <div className="text-sm text-white/60 p-4 flex justify-center items-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {type === "enterprise" && (
                <Input
                  label="Email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  error={errors?.email}
                  disabled={loading}
                />
              )}
              <Input
                label="Name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                error={errors?.name}
                disabled={loading}
              />
              {type === "level" && (
                <Select
                  label="Rank"
                  options={rankOptions}
                  selectedOption={rank}
                  onSelect={(value) => setRank(value)}
                  placeholder="Select rank"
                  error={errors?.rank}
                  disabled={loading}
                />
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="px-4 py-2 cursor-pointer rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all disabled:opacity-50"
                  onClick={() => !loading && setIsOpen(false)}
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
};

export default Update;
