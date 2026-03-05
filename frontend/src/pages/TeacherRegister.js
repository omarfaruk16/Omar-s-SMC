import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { classAPI, subjectAPI } from '../services/api';
import { DESIGNATION_OPTIONS } from '../constants/designations';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
  });
  const [classSubjectAssignments, setClassSubjectAssignments] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState({ class_id: '', subject_id: '' });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const { registerTeacher, isAdmin } = useAuth();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'teacher_id' ? value.toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    setError('');
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCurrentAssignmentChange = (field, value) => {
    setCurrentAssignment((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'class_id') {
        updated.subject_id = '';
      }
      return updated;
    });
    setError('');
  };

  const addAssignment = () => {
    if (!currentAssignment.class_id) {
      setError('Please select a class before adding.');
      return;
    }
    if (!currentAssignment.subject_id) {
      setError('Please select a subject before adding.');
      return;
    }

    // Check for duplicates
    const isDuplicate = classSubjectAssignments.some(
      (a) => a.class_id === currentAssignment.class_id && a.subject_id === currentAssignment.subject_id
    );
    if (isDuplicate) {
      setError('This class-subject combination has already been added.');
      return;
    }

    setClassSubjectAssignments((prev) => [...prev, { ...currentAssignment }]);
    setCurrentAssignment({ class_id: '', subject_id: '' });
    setError('');
  };

  const removeAssignment = (index) => {
    setClassSubjectAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilteredSubjectsForClass = (classId) => {
    if (!classId) return [];
    return subjects.filter((subject) => Number(subject.class_assigned) === Number(classId));
  };

  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === Number(classId));
    return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : '';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === Number(subjectId));
    return subject ? `${subject.name}${subject.code ? ` (${subject.code})` : ''}` : '';
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

  const showError = (message) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.password2) {
      showError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      showError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!formData.designation.trim()) {
      showError('Designation is required');
      setLoading(false);
      return;
    }

    if (optionsLoading) {
      showError('Please wait until class and subject options finish loading.');
      setLoading(false);
      return;
    }

    // Validate assignments
    if (!classSubjectAssignments || classSubjectAssignments.length === 0) {
      showError('Please add at least one class-subject assignment.');
      setLoading(false);
      return;
    }

    for (const assignment of classSubjectAssignments) {
      if (!assignment.class_id) {
        showError('Please select a class for all assignments.');
        setLoading(false);
        return;
      }
      if (!assignment.subject_id) {
        showError('Please select a subject for all assignments.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        nid: formData.nid,
        designation: formData.designation.trim(),
        class_subject_assignments: classSubjectAssignments.map((a) => ({
          class_id: Number(a.class_id),
          subject_id: Number(a.subject_id),
        })),
      };

      const trimmedTeacherId = formData.teacher_id.trim();
      if (trimmedTeacherId) {
        payload.teacher_id = trimmedTeacherId.toUpperCase();
      }

      if (isAdmin) {
        payload.auto_approve = true;
      }

      // Handle profile image - create FormData if image is provided
      let finalPayload = payload;
      if (profileImage) {
        const formDataWithImage = new FormData();
        Object.keys(payload).forEach(key => {
          if (key === 'class_subject_assignments') {
            // FormData requires JSON stringify for complex objects
            formDataWithImage.append(key, JSON.stringify(payload[key]));
          } else {
            formDataWithImage.append(key, payload[key]);
          }
        });
        formDataWithImage.append('image', profileImage);
        finalPayload = formDataWithImage;
      }

      const result = await registerTeacher(finalPayload);
      if (!result.success) {
        showError(extractErrorMessage(result.error));
        return;
      }

      setRegistrationInfo(result.data);
      setSuccess(true);
      if (isAdmin) {
        setTimeout(() => {
          navigate('/admin/users?tab=teachers');
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Teacher registration failed', err);
      showError('Registration failed. Please try again.');
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
                    Teacher ID (optional)
                  </label>
                  <input
                    id="teacher_id"
                    name="teacher_id"
                    type="text"
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
                  <select
                    id="designation"
                    name="designation"
                    required
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a designation</option>
                    {DESIGNATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Choose your teaching designation from the list.
                  </p>
                </div>
              </div>
            </div>

            {/* Class-Subject Assignments Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Class-Subject Assignments *
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add all the classes and subjects you will be teaching. Select a class and subject, then click "Add" to add them to your list.
              </p>
              
              {/* Input Row */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Class Select */}
                  <div>
                    <label
                      htmlFor="current_class"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Class
                    </label>
                    <select
                      id="current_class"
                      value={currentAssignment.class_id}
                      onChange={(e) => handleCurrentAssignmentChange('class_id', e.target.value)}
                      disabled={optionsLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                          {cls.section ? ` - ${cls.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Select */}
                  <div>
                    <label
                      htmlFor="current_subject"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Subject
                    </label>
                    <select
                      id="current_subject"
                      value={currentAssignment.subject_id}
                      onChange={(e) => handleCurrentAssignmentChange('subject_id', e.target.value)}
                      disabled={
                        optionsLoading ||
                        !currentAssignment.class_id ||
                        getFilteredSubjectsForClass(currentAssignment.class_id).length === 0
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {currentAssignment.class_id ? 'Select subject' : 'Select a class first'}
                      </option>
                      {getFilteredSubjectsForClass(currentAssignment.class_id).map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                          {subject.code ? ` (${subject.code})` : ''}
                        </option>
                      ))}
                    </select>
                    {currentAssignment.class_id &&
                      !optionsLoading &&
                      getFilteredSubjectsForClass(currentAssignment.class_id).length === 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          No subjects are mapped to this class.
                        </p>
                      )}
                  </div>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={addAssignment}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
                >
                  + Add to List
                </button>
              </div>

              {/* Assignments List */}
              {classSubjectAssignments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Added Assignments ({classSubjectAssignments.length})
                  </h4>
                  {classSubjectAssignments.map((assignment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {getClassName(assignment.class_id)}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-700">
                          {getSubjectName(assignment.subject_id)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {classSubjectAssignments.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No assignments added yet. Please add at least one class-subject combination.
                </p>
              )}
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

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>

                {/* Image preview */}
                {profileImagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                    />
                  </div>
                )}
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
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password2"
                      name="password2"
                      type={showPassword2 ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password2}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword2(!showPassword2)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword2 ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
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
