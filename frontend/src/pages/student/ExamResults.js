import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { examAPI, markAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StudentExamResults = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examTitle, setExamTitle] = useState('Exam Results');
  const [downloading, setDownloading] = useState(false);

  const examQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      examName: params.get('exam') || '',
      examId: params.get('exam_id') || '',
      batchId: params.get('batch_id') || '',
    };
  }, [location.search]);

  useEffect(() => {
    if (!examQuery.examName && !examQuery.examId && !examQuery.batchId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        let filteredMarks = [];

        if (examQuery.examId) {
          const res = await markAPI.getAll({ exam_id: examQuery.examId });
          filteredMarks = res.data || [];
          if (filteredMarks.length > 0) {
            setExamTitle(filteredMarks[0].exam_title || filteredMarks[0].exam_name || 'Exam Results');
          }
        } else if (examQuery.batchId) {
          const examRes = await examAPI.getAll();
          const batchExams = (examRes.data || []).filter((exam) => String(exam.batch_id) === String(examQuery.batchId));
          const examIds = new Set(batchExams.map((exam) => exam.id));
          const markRes = await markAPI.getAll();
          filteredMarks = (markRes.data || []).filter((mark) => mark.exam && examIds.has(mark.exam));
          if (batchExams.length > 0) {
            setExamTitle(batchExams[0].title || 'Exam Results');
          }
        } else if (examQuery.examName) {
          const res = await markAPI.getAll();
          filteredMarks = (res.data || []).filter((m) => (m.exam_name || '') === examQuery.examName);
          setExamTitle(examQuery.examName || 'Exam Results');
        }

        setMarks(filteredMarks);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examQuery, toast]);

  const totals = useMemo(() => {
    return marks.reduce(
      (acc, mark) => ({
        score: acc.score + (Number(mark.score) || 0),
        max: acc.max + (Number(mark.max_score) || 0),
      }),
      { score: 0, max: 0 }
    );
  }, [marks]);

  const percentage = totals.max ? Math.round((totals.score / totals.max) * 100) : 0;

  const downloadMarksheet = async () => {
    const params = examQuery.batchId
      ? { batch_id: examQuery.batchId }
      : examQuery.examId
        ? { exam_id: examQuery.examId }
        : marks[0]?.exam
          ? { exam_id: marks[0].exam }
          : null;

    if (!params) {
      toast.error('Marksheet is unavailable for this view.');
      return;
    }

    try {
      setDownloading(true);
      const response = await markAPI.downloadMarksheet(params);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'marksheet.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error('Unable to download marksheet');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!examQuery.examName && !examQuery.examId && !examQuery.batchId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No exam selected</h1>
            <p className="text-gray-600 mb-4">Please choose an exam from the Exams page.</p>
            <button
              type="button"
              onClick={() => navigate('/student/exams')}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Link to="/student/exams" className="text-sm text-blue-600 hover:text-blue-700">← Back to Exams</Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{examTitle}</h1>
          </div>
          <button
            type="button"
            onClick={downloadMarksheet}
            disabled={downloading}
            className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-60"
          >
            {downloading ? 'Preparing...' : 'Download Marksheet'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Score</div>
            <div className="text-2xl font-bold text-gray-900">{totals.score}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Max Score</div>
            <div className="text-2xl font-bold text-gray-900">{totals.max}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Percentage</div>
            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {marks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No results found for this exam.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obtained Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marks.map((mark) => {
                    const markPercentage = mark.max_score ? Math.round((mark.score / mark.max_score) * 100) : 0;
                    return (
                      <tr key={mark.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100">
                              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{mark.subject_name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{mark.score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{mark.max_score}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{mark.date || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              markPercentage >= 80 ? 'bg-green-100 text-green-800' :
                              markPercentage >= 60 ? 'bg-blue-100 text-blue-800' :
                              markPercentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {markPercentage >= 80 && (
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {markPercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExamResults;
