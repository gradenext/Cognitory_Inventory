export const verifyModelReferences = async (session, refs = []) => {
  const existenceChecks = await Promise.all(
    refs.map(({ model, id }) => model.findById(id).session(session))
  );

  const notFound = refs
    .filter((_, index) => !existenceChecks[index])
    .map(({ key }) => key);

  return notFound;
};
