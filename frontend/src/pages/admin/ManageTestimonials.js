import React, { useEffect, useState } from 'react';
import { testimonialAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageTestimonials = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  
  // Approve form data
  const [approveData, setApproveData] = useState({
    bangla_name: '',
    name: '',
    session: '',
    roll_number: '',
    registration: '',
    father_bn: '',
    mother_bn: '',
    village: '',
    post_office: '',
    upazila: '',
    district: '',
    gpa: '5.00',
    date_of_birth: '',
    year: new Date().getFullYear().toString()
  });
  
  // Reject form data
  const [rejectionReason, setRejectionReason] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await testimonialAPI.getAll();
      setRequests(res.data);
      setFilteredRequests(res.data);
    } catch (error) {
      console.error('Failed to load testimonial requests:', error);
      toast.error('Failed to load testimonial requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...requests];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Search by name or email
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.student_name?.toLowerCase().includes(term) || 
        req.student_email?.toLowerCase().includes(term)
      );
    }
    
    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  const openApproveModal = (req) => {
    // Pre-fill with student data
    setApproveData({
      bangla_name: req.student?.bangla_name || '',
      name: req.student_name || '',
      session: req.student?.session || '',
      roll_number: req.student_roll || '',
      registration: req.student?.registration || '',
      father_bn: req.student?.father_bn || '',
      mother_bn: req.student?.mother_bn || '',
      village: req.student?.village || '',
      post_office: req.student?.post_office || '',
      upazila: req.student?.upazila || '',
      district: req.student?.district || '',
      gpa: '5.00',
      date_of_birth: req.student?.date_of_birth || '',
      year: new Date().getFullYear().toString()
    });
    setApproveModal(req);
  };

  const closeApproveModal = () => {
    setApproveModal(null);
    setApproveData({
      bangla_name: '',
      name: '',
      session: '',
      roll_number: '',
      registration: '',
      father_bn: '',
      mother_bn: '',
      village: '',
      post_office: '',
      upazila: '',
      district: '',
      gpa: '5.00',
      date_of_birth: '',
      year: new Date().getFullYear().toString()
    });
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    
    try {
      setApproveLoading(true);
      await testimonialAPI.approve(approveModal.id, approveData);
      toast.success('Testimonial approved successfully');
      closeApproveModal();
      load();
    } catch (error) {
      console.error('Failed to approve testimonial:', error);
      toast.error(error.response?.data?.error || 'Failed to approve testimonial');
    } finally {
      setApproveLoading(false);
    }
  };

  const openRejectModal = (req) => {
    setRejectModal(req);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    try {
      setRejectLoading(true);
      await testimonialAPI.reject(rejectModal.id, { rejection_reason: rejectionReason.trim() });
      toast.success('Testimonial rejected successfully');
      closeRejectModal();
      load();
    } catch (error) {
      console.error('Failed to reject testimonial:', error);
      toast.error(error.response?.data?.error || 'Failed to reject testimonial');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDelete = async (req) => {
    if (!window.confirm(`Are you sure you want to delete testimonial request #${req.id}?`)) {
      return;
    }
    
    try {
      await testimonialAPI.delete(req.id);
      toast.success('Testimonial request deleted successfully');
      load();
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
      toast.error(error.response?.data?.error || 'Failed to delete testimonial');
    }
  };

  const formatStatus = (value) => {
    if (!value) return '—';
    return value.toString().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const badgeClass = (value) => {
    if (value === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (value === 'rejected') return 'bg-rose-100 text-rose-700';
    if (value === 'pending' || value === 'paid') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Testimonial Management</h1>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No testimonial requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{req.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.student_name}
                        <div className="text-xs text-gray-500">{req.student_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.student_roll || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.student_class || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(req.status)}`}>
                          {formatStatus(req.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(req.payment_status)}`}>
                          {formatStatus(req.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {req.requested_at ? new Date(req.requested_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {req.status === 'pending' || req.status === 'paid' ? (
                          <>
                            <button
                              onClick={() => openApproveModal(req)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(req)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        <button
                          onClick={() => handleDelete(req)}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Approve Testimonial Request</h2>
              <p className="text-sm text-gray-600 mt-1">Review and edit student information before approval</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম (বাংলা)</label>
                  <input
                    type="text"
                    value={approveData.bangla_name}
                    onChange={(e) => setApproveData({...approveData, bangla_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম (ইংরেজী)</label>
                  <input
                    type="text"
                    value={approveData.name}
                    onChange={(e) => setApproveData({...approveData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষাবর্ষ</label>
                  <input
                    type="text"
                    value={approveData.session}
                    onChange={(e) => setApproveData({...approveData, session: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রোল</label>
                  <input
                    type="text"
                    value={approveData.roll_number}
                    onChange={(e) => setApproveData({...approveData, roll_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রেজিস্ট্রেশন</label>
                  <input
                    type="text"
                    value={approveData.registration}
                    onChange={(e) => setApproveData({...approveData, registration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পিতাঃ</label>
                  <input
                    type="text"
                    value={approveData.father_bn}
                    onChange={(e) => setApproveData({...approveData, father_bn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মাতাঃ</label>
                  <input
                    type="text"
                    value={approveData.mother_bn}
                    onChange={(e) => setApproveData({...approveData, mother_bn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">গ্রামঃ</label>
                  <input
                    type="text"
                    value={approveData.village}
                    onChange={(e) => setApproveData({...approveData, village: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ডাকঘরঃ</label>
                  <input
                    type="text"
                    value={approveData.post_office}
                    onChange={(e) => setApproveData({...approveData, post_office: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">উপজেলাঃ</label>
                  <input
                    type="text"
                    value={approveData.upazila}
                    onChange={(e) => setApproveData({...approveData, upazila: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জেলাঃ</label>
                  <input
                    type="text"
                    value={approveData.district}
                    onChange={(e) => setApproveData({...approveData, district: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জিপিএ</label>
                  <input
                    type="text"
                    value={approveData.gpa}
                    onChange={(e) => setApproveData({...approveData, gpa: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জন্ম তারিখ</label>
                  <input
                    type="date"
                    value={approveData.date_of_birth}
                    onChange={(e) => setApproveData({...approveData, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সাল</label>
                  <input
                    type="text"
                    value={approveData.year}
                    onChange={(e) => setApproveData({...approveData, year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeApproveModal}
                disabled={approveLoading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approveLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {approveLoading ? 'Approving...' : 'Approve Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Reject Testimonial Request</h2>
              <p className="text-sm text-gray-600 mt-1">Provide a reason for rejection</p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (required)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejecting this testimonial request..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeRejectModal}
                disabled={rejectLoading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {rejectLoading ? 'Rejecting...' : 'Reject Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTestimonials;
