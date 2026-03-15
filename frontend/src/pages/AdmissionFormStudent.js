import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { admissionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const PRICE_MAP = {
  all: 3600,
  one: 1200,
  two: 1700,
  three: 2000,
};

const AdmissionFormStudent = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selection, setSelection] = useState('all');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    const source = params.get('source');

    if (!payment || source !== 'admission') return;

    if (payment === 'success') {
      toast.success('Admission payment completed successfully.');
    } else {
      toast.error('Admission payment failed or was cancelled. Please try again.');
    }

    ['payment', 'source', 'tran_id', 'val_id'].forEach((key) => params.delete(key));
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
  }, [location.pathname, location.search, navigate, toast]);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await admissionAPI.getStudentInfo();
        setStudent(res.data?.student || null);
        setSubjects(res.data?.subjects || []);
      } catch (error) {
        console.error('Failed to load admission form data', error);
        toast.error('Unable to load admission form data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast, user]);

  const amount = useMemo(() => PRICE_MAP[selection] || 0, [selection]);

  const subjectCount = useMemo(() => {
    if (selection === 'one') return 1;
    if (selection === 'two') return 2;
    if (selection === 'three') return 3;
    return 0;
  }, [selection]);

  const startPayment = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const payload = {
        subject_selection: selection,
        selected_subjects: selection === 'all' ? [] : selectedSubjects,
      };
      const response = await admissionAPI.initAdmissionPayment(payload);
      const gatewayUrl = response.data?.data;
      if (!gatewayUrl) {
        toast.error(response.data?.message || response.data?.detail || 'Failed to start payment');
        return;
      }
      window.location.assign(gatewayUrl);
    } catch (error) {
      console.error('Failed to start admission payment:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Failed to start payment');
    } finally {
      setPaying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admission Form</h1>
            <p className="text-gray-600 mb-6">You need to log in first to access this form.</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            Student profile is not available.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Admission Form Fill-up</h1>
            <p className="text-gray-600">Your details are prefilled and read-only.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-semibold text-gray-900">{student.first_name} {student.last_name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-gray-900">{student.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-semibold text-gray-900">{student.phone || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Class</p>
              <p className="font-semibold text-gray-900">{student.student_class || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Roll Number</p>
              <p className="font-semibold text-gray-900">{student.roll_number || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Guardian Name</p>
              <p className="font-semibold text-gray-900">{student.guardian_name || '—'}</p>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Selection</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              {['all', 'one', 'two', 'three'].map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="radio"
                    name="subject_selection"
                    value={option}
                    checked={selection === option}
                    onChange={() => {
                      setSelection(option);
                      setSelectedSubjects([]);
                    }}
                  />
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </label>
              ))}
            </div>

            {selection === 'all' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subjects.map((sub) => (
                  <div key={sub.id} className="px-4 py-3 border rounded-lg bg-gray-50">
                    <p className="font-medium text-gray-900">{sub.name}</p>
                    <p className="text-xs text-gray-500">Code: {sub.code}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: subjectCount }).map((_, index) => (
                  <select
                    key={`subject-${index}`}
                    value={selectedSubjects[index] || ''}
                    onChange={(e) => {
                      const next = [...selectedSubjects];
                      next[index] = Number(e.target.value);
                      setSelectedSubjects(next);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-6">
            <div>
              <p className="text-sm text-gray-600">Payable amount</p>
              <p className="text-2xl font-bold text-gray-900">BDT {amount}</p>
            </div>
            <button
              type="button"
              disabled={paying || (selection !== 'all' && selectedSubjects.filter(Boolean).length !== subjectCount)}
              onClick={startPayment}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {paying ? 'Redirecting...' : 'Pay & Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionFormStudent;
