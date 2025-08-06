import React from 'react';
import './pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalRecords, 
  onPageChange,
  itemsPerPage = 20,
  showInfo = true 
}) => {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis logic
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= halfVisible) {
        endPage = maxVisiblePages;
      } else if (currentPage > totalPages - halfVisible) {
        startPage = totalPages - maxVisiblePages + 1;
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Calculate showing info
  const getShowingInfo = () => {
    if (totalRecords === 0) return 'Tidak ada data';
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalRecords);
    
    return `Menampilkan ${startItem}-${endItem} dari ${totalRecords} data`;
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Don't render if no pages
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
      {showInfo && (
        <div className="pagination-info">
          <span>{getShowingInfo()}</span>
        </div>
      )}
      
      <div className="pagination-controls">
        {/* First Page Button */}
        <button
          className={`pagination-btn pagination-first ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          title="Halaman Pertama"
        >
          ⏮️
        </button>
        
        {/* Previous Page Button */}
        <button
          className={`pagination-btn pagination-prev ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Halaman Sebelumnya"
        >
          ◀️
        </button>
        
        {/* Page Numbers */}
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              className={`pagination-btn pagination-number ${
                page === currentPage ? 'active' : ''
              } ${page === '...' ? 'ellipsis' : ''}`}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
            >
              {page}
            </button>
          ))}
        </div>
        
        {/* Next Page Button */}
        <button
          className={`pagination-btn pagination-next ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Halaman Selanjutnya"
        >
          ▶️
        </button>
        
        {/* Last Page Button */}
        <button
          className={`pagination-btn pagination-last ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Halaman Terakhir"
        >
          ⏭️
        </button>
      </div>
      
      {/* Page Jump Input */}
      <div className="pagination-jump">
        <span>Ke halaman:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page && page >= 1 && page <= totalPages) {
              handlePageChange(page);
            }
          }}
          className="pagination-input"
        />
        <span>dari {totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination;