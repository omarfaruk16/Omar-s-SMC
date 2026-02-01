import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, resultSubmissionAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZE = 10;

const ManageResults = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      const [examRes, subRes] = await Promise.all([
        examAPI.getAll(),
        resultSubmissionAPI.getAll(),
      ]);
      setExams(examRes.data || []);
      setSubmissions(subRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const groupedExams = useMemo(() => {
    const map = new Map();
    exams.forEach((exam) => {
      const key = exam.batch_id || `exam-${exam.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          batch_id: exam.batch_id,
          title: exam.title || 'Exam Routine',
          class_id: exam.class_assigned,
          class_name: exam.class_name,
          created_at: exam.created_at,
          subjects: [],
          exam_ids: [],
        });
      }
      const group = map.get(key);
      group.exam_ids.push(exam.id);
      group.subjects.push({
        exam_id: exam.id,
        subject_id: exam.subject,
        subject_name: exam.subject_name,
        date: exam.date,
      });
    });
    return Array.from(map.values());
  }, [exams]);

  const examResultStatus = useMemo(() => {
    const statusMap = new Map();
    groupedExams.forEach((group) => {
      const totalSubjects = group.subjects.length;
      let submittedCount = 0;
      let publishedCount = 0;

      group.exam_ids.forEach((examId) => {
        const sub = submissions.find((s) => s.exam === examId);
        if (sub) {
          submittedCount++;
          if (sub.status === 'published') {
            publishedCount++;
          }
        }
      });

      let overallStatus = 'pending';
      if (publishedCount === totalSubjects) {
        overallStatus = 'published';
      } else if (submittedCount === totalSubjects) {
        overallStatus = 'submitted';
      } else if (submittedCount > 0) {
        overallStatus = 'partial';
      }

      statusMap.set(group.key, {
        total: totalSubjects,
        submitted: submittedCount,
        published: publishedCount,
        status: overallStatus,
      });
    });
    return statusMap;
  }, [groupedExams, submissions]);

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groupedExams;
    return groupedExams.filter((group) => {
      const hay = [group.title, group.class_name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [groupedExams, search]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredExams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const viewResults = (group) => {
    if (group.batch_id) {
      navigate(`/admin/results/view?batch_id=${group.batch_id}`);
    } else if (group.exam_ids.length > 0) {
      navigate(`/admin/results/view?exam_id=${group.exam_ids[0]}`);
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
            <h1 className="text-3xl font-bold text-gray-900">Exam Results Management</h1>
            <p className="text-sm text-gray-600 mt-1">Review and publish exam results</p>
          </div>
          <input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {pageItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filteredExams.length === 0 && search ? 'No exams found matching your search' : 'No exams scheduled yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageItems.map((group) => {
                    const status = examResultStatus.get(group.key);
                    return (
                      <tr key={group.key} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{group.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(group.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {group.class_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>{status?.total || 0} subjects</div>
                          <div className="text-xs text-gray-500">
                            {status?.submitted || 0} submitted · {status?.published || 0} published
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {status?.status === 'published' && (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Published
                            </span>
                          )}
                          {status?.status === 'submitted' && (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                              </svg>
                              Ready to Publish
                            </span>
                          )}
                          {status?.status === 'partial' && (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Partial ({status?.submitted}/{status?.total})
                            </span>
                          )}
                          {status?.status === 'pending' && (
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            type="button"
                            onClick={() => viewResults(group)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Results
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredExams.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageResults;
