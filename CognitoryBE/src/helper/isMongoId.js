import mongoose from "mongoose";

const isMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidMongoId = (refs = []) => {
  return refs
    .filter(({ id }) => !isMongoId(id))
    .map(({ key }) => key); // returns keys of invalid IDs
};

export default isValidMongoId