import React, { useEffect, useState } from 'react';
import { admissionAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ManageAdmissionSubmissions = () => {
  const toast = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await admissionAPI.getSubmissions();
      setSubmissions(response.data || []);
    } catch (error) {
      console.error('Failed to load admission submissions:', error);
      toast.error('Failed to load admission submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const download = async (submission) => {
    try {
      const response = await admissionAPI.downloadSubmissionById(submission.id);
      const disposition = response.headers?.['content-disposition'] || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : 'admission-form.pdf';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download admission form:', error);
      toast.error('Failed to download admission form');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admission Form Submissions</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No submissions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.applicant_name || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.applicant_email || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.applicant_phone || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">BDT {submission.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{submission.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {submission.created_at ? new Date(submission.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {submission.status === 'paid' ? (
                          <button
                            type="button"
                            onClick={() => download(submission)}
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Download PDF
                          </button>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAdmissionSubmissions;
