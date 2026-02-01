import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';

const TeacherDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [teacher, setTeacher] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTeacherDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await teacherAPI.getById(id);
            setTeacher(response.data);
        } catch (error) {
            console.error('Error fetching teacher details:', error);
            toast.error('Failed to fetch teacher details');
            navigate('/admin/teachers');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, toast]);

    useEffect(() => {
        fetchTeacherDetails();
    }, [fetchTeacherDetails]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!teacher) return null;

    const user = teacher.user || {};
    
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <button 
                    onClick={() => navigate('/admin/teachers')} 
                    className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Teachers
                </button>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-teal-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="border-4 border-white rounded-full">
                                    <Avatar
                                        image={user.image}
                                        name={`${user.first_name || ''} ${user.last_name || ''}`}
                                        size="2xl"
                                    />
                                </div>
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">
                                        {user.first_name} {user.last_name}
                                    </h2>
                                    <p className="opacity-90">{teacher.designation || 'Teacher'}</p>
                                    <div className="flex items-center mt-2 space-x-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                            user.is_active ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                                        }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => navigate(`/admin/teachers/edit/${id}`)}
                                    className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                                >
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Full Name</div>
                                        <div className="col-span-2 text-sm text-gray-900 font-medium">{user.first_name} {user.last_name}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Bangla Name</div>
                                        <div className="col-span-2 text-sm text-gray-900">{teacher.bangla_name || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Email</div>
                                        <div className="col-span-2 text-sm text-gray-900 break-all">{user.email}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Mobile No</div>
                                        <div className="col-span-2 text-sm text-gray-900">{user.phone || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Address</div>
                                        <div className="col-span-2 text-sm text-gray-900">{teacher.address || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Permanent Address</div>
                                        <div className="col-span-2 text-sm text-gray-900">{teacher.permanent_address || '-'}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Date of Birth</div>
                                        <div className="col-span-2 text-sm text-gray-900">
                                            {formatDate(teacher.date_of_birth)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-sm font-medium text-gray-500">Joined</div>
                                        <div className="col-span-2 text-sm text-gray-900">
                                            {formatDate(user.date_joined)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Information */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Professional Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-sm font-medium text-gray-500">Designation</div>
                                            <div className="col-span-2 text-sm text-gray-900">{teacher.designation || '-'}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-sm font-medium text-gray-500">NID</div>
                                            <div className="col-span-2 text-sm text-gray-900">{teacher.nid || '-'}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-sm font-medium text-gray-500">Monthly Salary</div>
                                            <div className="col-span-2 text-sm text-gray-900">
                                                {teacher.monthly_salary ? `৳ ${teacher.monthly_salary}` : '-'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-sm font-medium text-gray-500">Education</div>
                                            <div className="col-span-2 text-sm text-gray-900 whitespace-pre-wrap">
                                                {teacher.educational_qualification || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Assigned Classes */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                        Assigned Classes
                                    </h3>
                                    {teacher.assigned_classes && teacher.assigned_classes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {teacher.assigned_classes.map((cls, index) => (
                                                <span 
                                                    key={cls.id || index}
                                                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm"
                                                >
                                                    Class {cls.name} {cls.section ? `(${cls.section})` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No classes assigned yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDetails;
