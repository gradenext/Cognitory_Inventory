export const verifyModelReferences = async (refs = [], session = null) => {
  const existenceChecks = await Promise.all(
    refs.map(({ model, id }) => {
      const query = model.findById(id).lean();
      if (session) query.session(session);
      return query.exec();
    })
  );

  return refs
    .filter((_, index) => !existenceChecks[index])
    .map(({ key }) => key);
};
