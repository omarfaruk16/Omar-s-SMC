import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examAPI, feeAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaSearch, FaCalendarAlt, FaTimes } from 'react-icons/fa';

const StudentExams = () => {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [myFees, setMyFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [examRes, feeRes] = await Promise.all([
             examAPI.getAll(),
             feeAPI.getMyFees()
        ]);
        setExams(examRes.data || []);
        setMyFees(feeRes.data || []); 
      } catch (error) {
        console.error(error);
        toast.error('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const getPaymentStatus = (exam) => {
      if (!exam.exam_fee || exam.exam_fee <= 0) return 'paid';
      const fee = myFees.find(
        (f) => String(f.exam_id) === String(exam.id) || (f.exam_title && f.exam_title === exam.title)
      );
      if (!fee) return 'unpaid';
      if ((fee.payment_status || '').toLowerCase() === 'approved') return 'paid';
      if (['paid', 'complete'].includes((fee.fee_status || '').toLowerCase())) return 'paid';
      return 'unpaid';
  };

  const getNextScheduleDate = (exam) => {
    if (!exam?.schedules || exam.schedules.length === 0) return null;
    const sorted = [...exam.schedules].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted[0]?.date || null;
  };

  // Filter and search logic
  const filteredExams = useMemo(() => {
    let result = [...exams];

    // Search by exam title
    if (searchTerm.trim()) {
      result = result.filter(exam => 
        exam.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      result = result.filter(exam => {
        const examDate = getNextScheduleDate(exam) || exam.created_at;
        if (!examDate) return false;
        const date = new Date(examDate);
        return date >= startDate && date <= endDate;
      });
    }

    return result;
  }, [exams, searchTerm, startDate, endDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExams.slice(start, start + itemsPerPage);
  }, [filteredExams, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange([null, null]);
  };

  const downloadRoutine = async (exam) => {
    try {
      const response = await examAPI.downloadRoutine(exam.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `routine-${exam.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download routine', error);
      toast.error('Unable to download routine (Check Fee Payment)');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exams & Results</h1>
            <p className="text-sm text-gray-600 mt-1">Download exam routines and check published results.</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search exams by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Filter by date range..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dateFormat="MMM d, yyyy"
                isClearable={false}
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <FaTimes /> Clear Filters
              </button>
              <div className="text-sm text-gray-600">
                {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginatedExams.map((exam) => {
             const status = getPaymentStatus(exam);
             const canDownload = status === 'paid';
             const nextDate = getNextScheduleDate(exam);
             
             return (
              <div key={exam.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {nextDate ? new Date(nextDate).toLocaleDateString() : new Date(exam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {exam.results_published ? (
                         <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Results Published</span>
                    ) : (
                         <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Upcoming</span>
                    )}
                  </div>
                  
                    {exam.exam_fee > 0 && (
                      <div className="mb-4">
                          <span className="text-sm text-gray-600">Fee: {exam.exam_fee} BDT</span>
                          {status === 'unpaid' && <span className="ml-2 text-red-600 text-xs font-bold">(Unpaid)</span>}
                          {status === 'paid' && <span className="ml-2 text-green-600 text-xs font-bold">(Paid)</span>}
                      </div>
                  )}

                  <div className="space-y-3">
                    {canDownload ? (
                        <>
                            <button
                              onClick={() => downloadRoutine(exam)}
                              className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            >
                              Download Routine
                            </button>
                            <Link
                              to={`/student/exams/results?exam_id=${exam.id}`}
                              className="w-full flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                              View Details
                            </Link>
                            {exam.results_published && (
                                <Link
                                  to={`/student/exams/results?exam_id=${exam.id}`}
                                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  View Result
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link to="/student/fees" className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                            Pay Exam Fee
                        </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">
              {searchTerm || startDate || endDate 
                ? 'No exams found matching your filters.' 
                : 'No exams scheduled at the moment.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, idx) => {
                const page = idx + 1;
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 py-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExams;
