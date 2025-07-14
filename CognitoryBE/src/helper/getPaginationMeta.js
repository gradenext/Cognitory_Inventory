export const getPaginationMeta = ({ page, limit, totalItems }) => {
  const currentPage = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    page: currentPage,
    limit: pageSize,
    totalPages,
    totalItems,
    hasPrevPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
  };
};
