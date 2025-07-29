import React from "react";

const Pagination = ({ data, onPageChange }) => {
  const page = data?.page ?? "-";
  const limit = data?.limit ?? 0;
  const totalPages = data?.totalPages ?? "-";
  const totalItems = data?.totalItems ?? 0;
  const hasPrevPage = data?.hasPrevPage ?? false;
  const hasNextPage = data?.hasNextPage ?? false;
  const prevPage = data?.prevPage ?? null;
  const nextPage = data?.nextPage ?? null;

  const fromItem =
    typeof page === "number" && limit ? (page - 1) * limit + 1 : 0;
  const toItem =
    typeof page === "number" && limit ? Math.min(page * limit, totalItems) : 0;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-white shadow-lg border border-white/20 w-full mx-auto">
      {/* Previous Button */}
      <button
        onClick={() => hasPrevPage && onPageChange?.(prevPage)}
        disabled={!hasPrevPage}
        className={`px-4 py-2 rounded-xl transition cursor-pointer ${
          hasPrevPage
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
      >
        Previous
      </button>

      {/* Info */}
      <div className="text-sm text-white/80 text-center leading-snug">
        Page: <span className="font-semibold text-white">{page}</span> of{" "}
        <span className="font-semibold text-white">{totalPages}</span>
        <br />
        Items:{" "}
        <span className="font-semibold text-white">
          {fromItem || "-"}
        </span> to{" "}
        <span className="font-semibold text-white">{toItem || "-"}</span> of{" "}
        <span className="font-semibold text-white">{totalItems || "-"}</span>{" "}
      </div>

      {/* Next Button */}
      <button
        onClick={() => hasNextPage && onPageChange?.(nextPage)}
        disabled={!hasNextPage}
        className={`px-4 py-2 rounded-xl transition cursor-pointer ${
          hasNextPage
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
