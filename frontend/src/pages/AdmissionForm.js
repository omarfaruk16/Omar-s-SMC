import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { admissionAPI, classAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const AdmissionForm = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const autoDownloadRef = useRef(false);
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [classes, setClasses] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentTranId, setPaymentTranId] = useState('');
  const [paymentValId, setPaymentValId] = useState('');
  const [downloadingSubmission, setDownloadingSubmission] = useState(false);

  const amount = Number(process.env.REACT_APP_ADMISSION_FORM_FEE_AMOUNT || 3500);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const templateResponse = await admissionAPI.getDefaultTemplate();
        const data = templateResponse.data;
        setTemplate(data);
        try {
          const classesResponse = await classAPI.getAll();
          setClasses(classesResponse.data || []);
        } catch (classesError) {
          console.error('Failed to load classes:', classesError);
          setClasses([]);
        }

        const initial = {};
        (data.field_definitions || []).forEach((field) => {
          if (field.name === 'submission_date') {
            initial[field.name] = new Date().toISOString().slice(0, 10);
          } else {
            initial[field.name] = '';
          }
        });
        setFormData(initial);
      } catch (error) {
        console.error('Failed to load admission form template:', error);
        toast.error('Unable to load the admission form right now.');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [toast]);

  const fields = useMemo(() => template?.field_definitions || [], [template]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadSubmission = useCallback(async (tranId, valId) => {
    if (!tranId || downloadingSubmission) return;
    try {
      setDownloadingSubmission(true);
      const response = await admissionAPI.downloadSubmission({ tran_id: tranId, val_id: valId });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admission-form-${tranId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download admission form submission:', error);
      toast.error(error.response?.data?.detail || 'Unable to download the admission form right now.');
    } finally {
      setDownloadingSubmission(false);
    }
  }, [downloadingSubmission, toast]);

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!template || paying) return;

    setPaying(true);
    try {
      const response = await admissionAPI.initAdmissionPayment({
        template_slug: template.slug,
        form_data: formData,
      });
      const gatewayUrl = response.data?.data;
      if (!gatewayUrl) {
        toast.error(response.data?.message || response.data?.detail || 'Failed to start payment');
        return;
      }
      if (response.data?.tran_id) {
        sessionStorage.setItem('admission_tran_id', response.data.tran_id);
      }
      window.location.assign(gatewayUrl);
    } catch (error) {
      console.error('Failed to start admission payment:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Failed to start payment');
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    if (!payment) return;
    const tranId = params.get('tran_id') || '';
    const valId = params.get('val_id') || '';
    setPaymentStatus(payment);
    setPaymentTranId(tranId);
    setPaymentValId(valId);
    setPaymentModalOpen(true);
    ['payment', 'source', 'tran_id', 'val_id'].forEach((key) => params.delete(key));
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ''}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (paymentStatus !== 'success' || !paymentTranId || autoDownloadRef.current) return;
    autoDownloadRef.current = true;
    handleDownloadSubmission(paymentTranId, paymentValId);
  }, [handleDownloadSubmission, paymentStatus, paymentTranId, paymentValId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            Admission form is not available at the moment.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
            {template.description && (
              <p className="text-gray-600 mb-6">{template.description}</p>
            )}

            <form onSubmit={submitPayment} className="space-y-5">
              {fields.map((field) => {
                const isMultiline = field.multiline || field.name === 'address';
                const value = formData[field.name] ?? '';
                const isClassField = field.name === 'student_class';
                const isDateField = field.name === 'date_of_birth';
                const isSubmissionDate = field.name === 'submission_date';
                const hasRequiredFlag = Object.prototype.hasOwnProperty.call(field, 'required') ||
                  Object.prototype.hasOwnProperty.call(field, 'is_required');
                const isRequired = hasRequiredFlag
                  ? Boolean(field.required ?? field.is_required)
                  : !isSubmissionDate;

                return (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {isClassField ? (
                      <select
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={isRequired}
                      >
                        <option value="">Select class</option>
                        {classes.length === 0 ? (
                          <option value="" disabled>No classes available</option>
                        ) : (
                          classes.map((classItem) => {
                            const label = classItem.section
                              ? `${classItem.name} - ${classItem.section}`
                              : classItem.name;
                            return (
                              <option key={classItem.id} value={label}>
                                {label}
                              </option>
                            );
                          })
                        )}
                      </select>
                    ) : isMultiline ? (
                      <textarea
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={isRequired}
                      />
                    ) : (
                      <input
                        type={isDateField ? 'date' : 'text'}
                        value={value}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={isRequired}
                        readOnly={isSubmissionDate}
                      />
                    )}
                  </div>
                );
              })}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={paying}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {paying ? 'Redirecting to payment...' : `Pay with SSLCOMMERZ (BDT ${amount})`}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  After successful payment, your filled admission form PDF will download automatically.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={paymentStatus === 'success' ? 'Payment Successful' : 'Payment Failed'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {paymentStatus === 'success'
              ? 'Your admission payment has been completed successfully.'
              : 'Your admission payment could not be completed. Please try again.'}
          </p>
          {paymentStatus === 'success' && (
            <button
              type="button"
              onClick={() => handleDownloadSubmission(paymentTranId, paymentValId)}
              disabled={downloadingSubmission}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {downloadingSubmission ? 'Preparing PDF...' : 'Download Admission PDF'}
            </button>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 rounded bg-gray-200 text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdmissionForm;
