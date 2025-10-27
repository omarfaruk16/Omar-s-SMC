import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classAPI, subjectAPI } from '../services/api';

const TeacherRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    nid: '',
    teacher_id: '',
    designation: '',
    class_id: '',
    subject_id: '',
    date_of_birth: '',
    // index_num: '',
    // designation: '',
    // date_of_birth: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const { registerTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        setOptionsError('');
        const [classesResponse, subjectsResponse] = await Promise.all([
          classAPI.getAll(),
          subjectAPI.getAll(),
        ]);

        if (!isMounted) {
          return;
        }

        setClasses(classesResponse.data || []);
        setSubjects(subjectsResponse.data || []);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load classes/subjects', err);
        setOptionsError('Failed to load class and subject options. Please refresh the page.');
      } finally {
        if (isMounted) {
          setOptionsLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!formData.class_id) {
      setFilteredSubjects([]);
      return;
    }

    const selectedClassId = Number(formData.class_id);
    const availableSubjects = subjects.filter((subject) =>
      (subject.classes || []).some((clsId) => clsId === selectedClassId)
    );
    setFilteredSubjects(availableSubjects);

    const hasExistingSelection = availableSubjects.some(
      (subject) => String(subject.id) === String(formData.subject_id || '')
    );

    if (!hasExistingSelection && formData.subject_id) {
      setFormData((prev) => ({ ...prev, subject_id: '' }));
    }
  }, [formData.class_id, formData.subject_id, subjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'teacher_id' ? value.toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === 'class_id' ? { subject_id: '' } : {}),
    }));
    setError('');
  };

  const extractErrorMessage = (payload) => {
    if (!payload) {
      return 'Registration failed. Please try again.';
    }
    if (typeof payload === 'string') {
      return payload;
    }
    if (Array.isArray(payload) && payload.length > 0) {
      return extractErrorMessage(payload[0]);
    }
    if (payload.detail) {
      return extractErrorMessage(payload.detail);
    }
    for (const key of Object.keys(payload)) {
      const value = payload[key];
      if (!value) {
        continue;
      }
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value) && value.length > 0) {
        const nested = extractErrorMessage(value[0]);
        if (nested) {
          return nested;
        }
      }
      if (typeof value === 'object') {
        const nested = extractErrorMessage(value);
        if (nested) {
          return nested;
        }
      }
    }
    return 'Registration failed. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!formData.teacher_id.trim()) {
      setError('Teacher ID is required');
      setLoading(false);
      return;
    }

    if (!formData.designation.trim()) {
      setError('Designation is required');
      setLoading(false);
      return;
    }

    if (optionsLoading) {
      setError('Please wait until class and subject options finish loading.');
      setLoading(false);
      return;
    }

    if (!formData.class_id) {
      setError('Please select a class.');
      setLoading(false);
      return;
    }

    if (filteredSubjects.length === 0) {
      setError('No subjects are available for the selected class. Please choose a different class or contact the administration.');
      setLoading(false);
      return;
    }

    if (!formData.subject_id) {
      setError('Please select a subject.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        nid: formData.nid,
        teacher_id: formData.teacher_id.trim().toUpperCase(),
        designation: formData.designation.trim(),
        class_id: Number(formData.class_id),
        subject_id: Number(formData.subject_id),
      };

      const result = await registerTeacher(payload);
      if (!result.success) {
        setError(extractErrorMessage(result.error));
        return;
      }

      setRegistrationInfo(result.data);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Teacher registration failed', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your account has been created and is pending admin approval. You will be notified once approved.
          </p>
          {registrationInfo?.teacher_id && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800 mb-4">
              <p className="font-medium">Reference ID: <span className="font-semibold">{registrationInfo.teacher_id}</span></p>
              <p className="text-xs text-blue-600 mt-1">
                Please note this Teacher ID for your records. You will need it when following up with the administration.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">SMS</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Teacher Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* National ID */}
                <div>
                  <label htmlFor="nid" className="block text-sm font-medium text-gray-700 mb-1">
                    National ID (NID) *
                  </label>
                  <input
                    id="nid"
                    name="nid"
                    type="text"
                    required
                    value={formData.nid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567890123"
                    minLength="10"
                    maxLength="17"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Professional Information
              </h3>
              {optionsLoading && (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Loading available classes and subjects...
                </div>
              )}
              {optionsError && !optionsLoading && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {optionsError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher ID *
                  </label>
                  <input
                    id="teacher_id"
                    name="teacher_id"
                    type="text"
                    required
                    value={formData.teacher_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 uppercase"
                    placeholder="T-2025-ENG01"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Provide a unique identifier that follows your institution&apos;s format (e.g., T-2025-ENG01).
                  </p>
                </div>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <input
                    id="designation"
                    name="designation"
                    type="text"
                    required
                    list="designation-options"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Assistant Teacher"
                  />
                  <datalist id="designation-options">
                    <option value="Assistant Teacher" />
                    <option value="Senior Teacher" />
                    <option value="Head Teacher" />
                    <option value="Lecturer" />
                    <option value="Assistant Professor" />
                    <option value="Associate Professor" />
                    <option value="Professor" />
                  </datalist>
                  <p className="mt-2 text-xs text-gray-500">
                    Start typing to use a suggested title or enter your exact designation.
                  </p>
                </div>
                <div>
                  <label htmlFor="class_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Class *
                  </label>
                  <select
                    id="class_id"
                    name="class_id"
                    required
                    value={formData.class_id}
                    onChange={handleChange}
                    disabled={optionsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                        {cls.section ? ` - ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Choose the class you primarily teach so that the matching subjects can be selected.
                  </p>
                </div>
                <div>
                  <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Subject *
                  </label>
                  <select
                    id="subject_id"
                    name="subject_id"
                    required
                    value={formData.subject_id}
                    onChange={handleChange}
                    disabled={optionsLoading || !formData.class_id || filteredSubjects.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">
                      {formData.class_id ? 'Select subject' : 'Select a class first'}
                    </option>
                    {filteredSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                        {subject.code ? ` (${subject.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {formData.class_id && !optionsLoading && filteredSubjects.length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      No subjects are mapped to this class yet. Please choose a different class or contact the administration.
                    </p>
                  )}
                  {filteredSubjects.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Subjects listed here are already linked to the selected class.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="teacher@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="01712345678"
                  />
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Account Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    id="password2"
                    name="password2"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-yellow-800">
                  Your registration will be reviewed by an administrator. You will receive notification once your account is approved.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register as Teacher'
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default TeacherRegister;
