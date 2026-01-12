import React, { useEffect, useMemo, useState } from 'react';
import { admissionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const AdmissionForm = () => {
  const toast = useToast();
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const amount = Number(process.env.REACT_APP_ADMISSION_FORM_FEE_AMOUNT || 3500);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        const response = await admissionAPI.getDefaultTemplate();
        const data = response.data;
        setTemplate(data);

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

              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {isMultiline ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  );
};

export default AdmissionForm;
