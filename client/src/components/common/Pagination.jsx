// components/common/Pagination.jsx
const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
  
    const handlePrev = () => onPageChange(Math.max(page - 1, 1));
    const handleNext = () => onPageChange(Math.min(page + 1, totalPages));
  
    return (
      <div className="flex justify-center items-center gap-4 my-20">
        <button onClick={handlePrev} className="btn btn-outline btn-primary" disabled={page === 1} >
          Previous
        </button>
        <span className="text-xl">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>
        <button onClick={handleNext} className="btn btn-outline btn-primary" disabled={page === totalPages}>
          Next
        </button>
      </div>
    );
  };
  
  export default Pagination;
  