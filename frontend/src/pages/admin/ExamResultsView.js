import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { examAPI, resultSubmissionAPI, markAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ExamResultsView = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('exam_id');
  const batchId = searchParams.get('batch_id');

  const [exam, setExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const examRes = await examAPI.getAll();
        const allExams = examRes.data || [];
        setExams(allExams);

        let targetExams = [];
        if (batchId) {
          targetExams = allExams.filter((e) => e.batch_id === batchId);
        } else if (examId) {
          targetExams = allExams.filter((e) => e.id === Number(examId));
        }

        if (targetExams.length > 0) {
          setExam(targetExams[0]);
          const submissionsRes = await resultSubmissionAPI.getAll();
          const allSubmissions = submissionsRes.data || [];
          const filtered = allSubmissions.filter((sub) =>
            targetExams.some((e) => e.id === sub.exam)
          );
          setSubmissions(filtered);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId, batchId, toast]);

  const loadMarks = async (submission, subjectId) => {
    try {
      setLoadingMarks(true);
      const res = await markAPI.getAll({
        exam_id: submission.exam,
        class_id: submission.class_assigned,
        subject_id: subjectId,
      });
      setMarks(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load marks');
    } finally {
      setLoadingMarks(false);
    }
  };

  const handlePublish = async (submissionId) => {
    if (publishing) return;
    try {
      setPublishing(true);
      await resultSubmissionAPI.publish(submissionId);
      toast.success('Results published successfully');
      const submissionsRes = await resultSubmissionAPI.getAll();
      const allSubmissions = submissionsRes.data || [];
      const filtered = allSubmissions.filter((sub) =>
        exams.some((e) => e.id === sub.exam)
      );
      setSubmissions(filtered);
    } catch (error) {
      console.error(error);
      toast.error('Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  const submissionsBySubject = useMemo(() => {
    const map = new Map();
    submissions.forEach((sub) => {
      const ids = sub.subject_ids || [];
      ids.forEach((id) => {
        if (!map.has(id)) {
          map.set(id, []);
        }
        map.get(id).push(sub);
      });
    });
    return map;
  }, [submissions]);

  const subjectStatuses = useMemo(() => {
    const statuses = [];
    const relatedExams = batchId 
      ? exams.filter((e) => e.batch_id === batchId)
      : examId 
      ? exams.filter((e) => e.id === Number(examId))
      : [];

    relatedExams.forEach((e) => {
      (e.schedules || []).forEach((sch) => {
        const subs = submissions.filter((sub) => sub.exam === e.id && (sub.subject_ids || []).includes(sch.subject));
        const hasSubmission = subs.length > 0;
        const sub = subs[0];
        statuses.push({
          exam_id: e.id,
          subject_id: sch.subject,
          subject_name: sch.subject_name || 'Subject',
          exam_title: e.title || 'Exam',
          exam_date: sch.date,
          has_submission: hasSubmission,
          status: hasSubmission ? sub.status : 'not_submitted',
          submission: sub,
        });
      });
    });

    return statuses;
  }, [exams, submissions, batchId, examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Exam not found</h1>
            <button
              type="button"
              onClick={() => navigate('/admin/results')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Back to Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSubmission) {
    const subjectExam = exams.find((e) => e.id === selectedSubmission.exam);
    const subjectSchedule = subjectExam?.schedules?.find((s) => String(s.subject) === String(selectedSubjectId));
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <button
            type="button"
            onClick={() => setSelectedSubmission(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Exam</h2>
                <p className="text-lg font-semibold text-gray-900">{subjectExam?.title || 'Exam Routine'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Class</h2>
                <p className="text-lg font-semibold text-gray-900">{subjectExam?.class_name || '—'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Subject</h2>
                <p className="text-lg font-semibold text-gray-900">{subjectSchedule?.subject_name || '—'}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Date</h2>
                <p className="text-lg font-semibold text-gray-900">{subjectSchedule?.date || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Student Marks</h3>
            </div>
            {loadingMarks ? (
              <div className="p-8 text-center text-gray-500">Loading marks...</div>
            ) : marks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No marks found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obtained Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marks.map((mark) => {
                      const percentage = mark.max_score > 0 ? ((mark.score / mark.max_score) * 100).toFixed(2) : 0;
                      return (
                        <tr key={mark.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{mark.student_name || '—'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.roll_number || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {mark.score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {mark.max_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              percentage >= 80 ? 'bg-green-100 text-green-800' :
                              percentage >= 60 ? 'bg-blue-100 text-blue-800' :
                              percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {percentage}%
                            </span>
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
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
            <p className="text-sm text-gray-600 mt-1">{exam.title || 'Exam Routine'} - {exam.class_name}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/results')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to All Results
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Subject-wise Result Status</h2>
          </div>
          {subjectStatuses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No subjects found for this exam</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {subjectStatuses.map((status, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">{status.subject_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {status.exam_date || 'Date not set'} 
                        {status.exam_date && <span className="mx-2">•</span>}
                        Exam ID: {status.exam_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {status.has_submission ? (
                        <>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            status.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {status.status === 'published' ? 'Published' : 'Pending'}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              setSelectedSubmission(status.submission);
                              setSelectedSubjectId(status.subject_id);
                              await loadMarks(status.submission, status.subject_id);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            View Marks
                          </button>
                          {status.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => handlePublish(status.submission.id)}
                              disabled={publishing}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              {publishing ? 'Publishing...' : 'Publish'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                          Not Submitted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamResultsView;
