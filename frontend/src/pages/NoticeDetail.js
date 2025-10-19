import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { noticeAPI } from '../services/api';

const NoticeDetail = () => {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotice();
  }, [id]);

  const fetchNotice = async () => {
    try {
      const response = await noticeAPI.getOne(id);
      setNotice(response.data);
    } catch (error) {
      console.error('Error fetching notice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-4">Notice not found</p>
          <Link to="/notices" className="text-blue-600 hover:text-blue-700">
            Back to Notices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/notices"
            className="text-blue-600 hover:text-blue-700 mb-6 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Notices
          </Link>

          <div className="bg-white rounded-lg shadow-md p-8 mt-4">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded">
                Official Notice
              </span>
              <span className="text-sm text-gray-500">
                {new Date(notice.created_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{notice.title}</h1>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{notice.description}</p>

            {notice.file && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Attachment</h3>
                <a
                  href={notice.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Attachment
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;
