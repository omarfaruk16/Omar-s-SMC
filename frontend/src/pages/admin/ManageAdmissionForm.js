import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { admissionAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const fontOptions = ['Helvetica', 'Helvetica-Bold', 'Times-Roman', 'Times-Bold', 'Courier', 'Courier-Bold'];
const defaultFieldCatalog = [
  { name: 'first_name', label: 'First Name', source: 'user.first_name', multiline: false, visible: true },
  { name: 'last_name', label: 'Last Name', source: 'user.last_name', multiline: false, visible: true },
  { name: 'email', label: 'Email Address', source: 'user.email', multiline: false, visible: true },
  { name: 'phone', label: 'Phone Number', source: 'user.phone', multiline: false, visible: true },
  { name: 'date_of_birth', label: 'Date of Birth', source: 'date_of_birth', multiline: false, visible: true },
  { name: 'student_class', label: 'Preferred / Assigned Class', source: 'student_class', multiline: false, visible: true },
  { name: 'address', label: 'Present Address', source: 'address', multiline: true, visible: true },
  { name: 'guardian_name', label: 'Guardian Name', source: 'guardian_name', multiline: false, visible: true },
  { name: 'guardian_phone', label: 'Guardian Contact No.', source: 'guardian_phone', multiline: false, visible: true },
  { name: 'registration_id', label: 'Registration ID', source: 'registration_id', multiline: false, visible: true },
  { name: 'submission_date', label: 'Submission Date', source: 'submission_date', multiline: false, visible: true },
];

const DEFAULT_TEMPLATE_PAYLOAD = {
  name: 'Standard Admission Form',
  description: 'Default admission form layout with core student fields.',
  school_name: "Rosey Mozammel Women's College",
  school_address: 'Gurudaspur, Natore, Bangladesh',
  eiin_number: '123456',
  slogan: 'Empowering Women Through Education',
  footer_text: "Rosey Mozammel Women's College • Gurudaspur, Natore",
  footer_secondary_text: 'For admission assistance call 01309-124030',
  watermark_text: "Rosey Mozammel Women's College",
  signature_caption: 'Guardian Signature',
  header_background_color: '#1f2937',
  header_text_color: '#ffffff',
  primary_color: '#2563eb',
  accent_color: '#1e40af',
  text_color: '#111827',
  header_font_name: 'Helvetica-Bold',
  body_font_name: 'Helvetica',
  label_font_size: 11,
  body_font_size: 10,
  is_default: true,
  layout_metadata: { fields: defaultFieldCatalog },
};

const SortableFieldCard = ({ field, onHide, onLabelChange, onMultilineToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.name });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg px-4 py-3 shadow-sm transition ${
        isDragging ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{field.label}</p>
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 cursor-grab"
              {...attributes}
              {...listeners}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10h10M7 14h10" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500">Data source: {field.source}</p>
          <div className="mt-2 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onLabelChange(field.name, e.target.value)}
                className="w-full px-3 py-1.5 border rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <label className="inline-flex items-center text-xs text-gray-600 space-x-2">
              <input
                type="checkbox"
                checked={field.multiline}
                onChange={(e) => onMultilineToggle(field.name, e.target.checked)}
              />
              <span>Show as multi-line field</span>
            </label>
          </div>
        </div>
        <button
          type="button"
          className="text-xs text-red-600 hover:underline ml-4"
          onClick={onHide}
        >
          Hide
        </button>
      </div>
    </div>
  );
};

const ManageAdmissionForm = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  const [templates, setTemplates] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [template, setTemplate] = useState(null);
  const [fieldCatalog, setFieldCatalog] = useState(defaultFieldCatalog);
  const [fieldConfig, setFieldConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const formState = useMemo(() => {
    if (!template) return null;
    return {
      name: template.name || '',
      description: template.description || '',
      school_name: template.school_name || '',
      school_address: template.school_address || '',
      eiin_number: template.eiin_number || '',
      slogan: template.slogan || '',
      footer_text: template.footer_text || '',
      footer_secondary_text: template.footer_secondary_text || '',
      watermark_text: template.watermark_text || '',
      signature_caption: template.signature_caption || '',
      header_background_color: template.header_background_color || '#1f2937',
      header_text_color: template.header_text_color || '#ffffff',
      primary_color: template.primary_color || '#2563eb',
      accent_color: template.accent_color || '#1e40af',
      text_color: template.text_color || '#111827',
      header_font_name: template.header_font_name || 'Helvetica-Bold',
      body_font_name: template.body_font_name || 'Helvetica',
      label_font_size: template.label_font_size || 11,
      body_font_size: template.body_font_size || 10,
      is_default: template.is_default || false,
    };
  }, [template]);

  const buildFieldConfig = useCallback(
    (tmpl, catalog) => {
      const layoutFields = tmpl?.layout_metadata?.fields || [];
      const layoutMap = {};
      layoutFields.forEach((field, index) => {
        if (field?.name) layoutMap[field.name] = { ...field, order: index };
      });

      const merged = catalog.map((field, index) => {
        const layout = layoutMap[field.name] || {};
        const order = typeof layout.order === 'number' ? layout.order : index;
        return {
          ...field,
          label: layout.label || field.label,
          visible: layout.visible !== undefined ? layout.visible : field.visible ?? true,
          multiline: layout.multiline !== undefined ? layout.multiline : field.multiline ?? false,
          order,
        };
      });

      return merged
        .sort((a, b) => a.order - b.order)
        .map((field) => {
          const { order, ...rest } = field;
          return rest;
        });
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const initialise = async () => {
      setLoading(true);
      try {
        const templatesResPromise = admissionAPI.listTemplates();
        const fieldsResPromise = admissionAPI.getAvailableFields().catch(() => null);
        const [templatesRes, fieldsRes] = await Promise.all([templatesResPromise, fieldsResPromise]);

        if (!isMounted) {
          return;
        }

        const availableFields = fieldsRes?.data?.fields?.length ? fieldsRes.data.fields : defaultFieldCatalog;
        setFieldCatalog(availableFields);

        let templateList = templatesRes.data || [];

        if ((!templateList || templateList.length === 0) && isMounted) {
          try {
            const createdRes = await admissionAPI.createTemplate(DEFAULT_TEMPLATE_PAYLOAD);
            templateList = [createdRes.data];
          } catch (creationError) {
            console.error('Failed to auto-create admission template', creationError);
          }
        }

        setTemplates(templateList);

        let activeTemplate = null;
        try {
          const defaultRes = await admissionAPI.getDefaultTemplate();
          activeTemplate = defaultRes.data;
        } catch (error) {
          if (error?.response?.status === 404 && templateList.length > 0) {
            activeTemplate = templateList.find((item) => item.is_default) || templateList[0];
          } else {
            throw error;
          }
        }

        if (!activeTemplate && templateList.length > 0) {
          activeTemplate = templateList[0];
        }

        if (activeTemplate && isMounted) {
          setSelectedSlug(activeTemplate.slug);
          setTemplate(activeTemplate);
          setFieldConfig(buildFieldConfig(activeTemplate, availableFields));
        } else if (isMounted) {
          toastRef.current?.error('No admission form template is configured yet.');
        }
      } catch (error) {
        console.error('Failed to load admission templates', error);
        if (isMounted) {
          toastRef.current?.error('Failed to load admission form templates');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialise();

    return () => {
      isMounted = false;
    };
  }, [buildFieldConfig]);

  useEffect(() => {
    if (!selectedSlug || !fieldCatalog.length) return;

    let isMounted = true;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        const response = await admissionAPI.getTemplate(selectedSlug);
        if (!isMounted) {
          return;
        }
        setTemplate(response.data);
        setFieldConfig(buildFieldConfig(response.data, fieldCatalog));
        setLogoFile(null);
        setBackgroundFile(null);
        setRemoveLogo(false);
        setRemoveBackground(false);
      } catch (error) {
        console.error('Failed to load template', error);
        if (isMounted) {
          toastRef.current?.error('Could not load the selected template');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTemplate();

    return () => {
      isMounted = false;
    };
  }, [selectedSlug, fieldCatalog, buildFieldConfig]);

  const handleFieldVisibilityToggle = (name, visible) => {
    setFieldConfig((prev) => {
      const updated = prev.map((field) =>
        field.name === name ? { ...field, visible } : field
      );
      const visibleFields = updated.filter((f) => f.visible);
      const hiddenFields = updated.filter((f) => !f.visible);
      return [...visibleFields, ...hiddenFields];
    });
  };

  const handleFieldLabelChange = (name, label) => {
    setFieldConfig((prev) =>
      prev.map((field) => (field.name === name ? { ...field, label } : field))
    );
  };

  const handleFieldMultilineToggle = (name, multiline) => {
    setFieldConfig((prev) =>
      prev.map((field) => (field.name === name ? { ...field, multiline } : field))
    );
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setFieldConfig((prev) => {
      const activeFields = prev.filter((f) => f.visible);
      const inactiveFields = prev.filter((f) => !f.visible);
      const oldIndex = activeFields.findIndex((f) => f.name === active.id);
      const newIndex = activeFields.findIndex((f) => f.name === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }
      const reordered = arrayMove(activeFields, oldIndex, newIndex);
      return [...reordered, ...inactiveFields];
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!template || !formState) return;
    try {
      setSaving(true);
      const payload = new FormData();
      Object.entries(formState).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });

      if (logoFile) {
        payload.append('logo', logoFile);
      } else if (removeLogo) {
        payload.append('remove_logo', 'true');
      }

      if (backgroundFile) {
        payload.append('background_image', backgroundFile);
      } else if (removeBackground) {
        payload.append('remove_background_image', 'true');
      }

      const fieldsPayload = fieldConfig.map(({ name, label, source, visible, multiline }) => ({
        name,
        label,
        source,
        visible,
        multiline,
      }));

      payload.append('layout_metadata', JSON.stringify({ fields: fieldsPayload }));

      await admissionAPI.updateTemplate(template.slug, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Admission form template updated successfully');

      const refreshed = await admissionAPI.getTemplate(template.slug);
      setTemplate(refreshed.data);
      setFieldConfig(buildFieldConfig(refreshed.data, fieldCatalog));
      setLogoFile(null);
      setBackgroundFile(null);
      setRemoveLogo(false);
      setRemoveBackground(false);
    } catch (error) {
      console.error('Failed to save admission template', error);
      toast.error('Failed to save admission template');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !template) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template || !formState) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">No admission form template found</h1>
            <p className="text-gray-600">Please create a template from the Django admin first.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeFields = fieldConfig.filter((field) => field.visible);
  const inactiveFields = fieldConfig.filter((field) => !field.visible);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admission Form Designer</h1>
            <p className="text-gray-600 mt-1">
              Configure branding, layout, colours and fields for the admission form PDF.
            </p>
          </div>
          {templates.length > 1 && (
            <div className="flex items-center space-x-3">
              <label htmlFor="template-selector" className="text-sm font-medium text-gray-700">
                Active template
              </label>
              <select
                id="template-selector"
                value={selectedSlug || ''}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {templates.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name} {item.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Branding */}
          <section className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Institution Branding</h2>
              <p className="text-sm text-gray-500 mt-1">
                Update institute details that appear on the form header and footer.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formState.description}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional short description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={formState.school_name}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, school_name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EIIN Number</label>
                <input
                  type="text"
                  value={formState.eiin_number}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, eiin_number: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  value={formState.school_address}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, school_address: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slogan / Tagline</label>
                <input
                  type="text"
                  value={formState.slogan}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, slogan: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Empowering Women Through Education"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Watermark Text</label>
                <input
                  type="text"
                  value={formState.watermark_text}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, watermark_text: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                <input
                  type="text"
                  value={formState.footer_text}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, footer_text: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Secondary Text</label>
                <input
                  type="text"
                  value={formState.footer_secondary_text}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, footer_secondary_text: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional additional footer note"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature Caption</label>
                <input
                  type="text"
                  value={formState.signature_caption}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, signature_caption: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setLogoFile(e.target.files?.[0] || null);
                      setRemoveLogo(false);
                    }}
                  />
                  {template.logo_url && !removeLogo && (
                    <img src={template.logo_url} alt="Logo preview" className="w-12 h-12 rounded object-contain border" />
                  )}
                  {template.logo_url && (
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => setRemoveLogo((prev) => !prev)}
                    >
                      {removeLogo ? 'Undo remove' : 'Remove logo'}
                    </button>
                  )}
                </div>
                {logoFile && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {logoFile.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setBackgroundFile(e.target.files?.[0] || null);
                      setRemoveBackground(false);
                    }}
                  />
                  {template.background_image_url && !removeBackground && (
                    <img
                      src={template.background_image_url}
                      alt="Background preview"
                      className="w-20 h-12 rounded object-cover border"
                    />
                  )}
                  {template.background_image_url && (
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => setRemoveBackground((prev) => !prev)}
                    >
                      {removeBackground ? 'Undo remove' : 'Remove background'}
                    </button>
                  )}
                </div>
                {backgroundFile && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {backgroundFile.name}</p>
                )}
              </div>
            </div>
          </section>

          {/* Colours and typography */}
          <section className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Colours & Typography</h2>
              <p className="text-sm text-gray-500 mt-1">
                Match the admission form style with your institute’s branding.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'header_background_color', label: 'Header Background' },
                { key: 'header_text_color', label: 'Header Text' },
                { key: 'primary_color', label: 'Primary Colour' },
                { key: 'accent_color', label: 'Accent Colour' },
                { key: 'text_color', label: 'Body Text Colour' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type="text"
                      value={formState[key]}
                      onChange={(e) => setTemplate((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#1f2937"
                    />
                  </div>
                  <input
                    type="color"
                    value={formState[key]}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-12 h-12 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Font</label>
                <select
                  value={formState.header_font_name}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, header_font_name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
                <select
                  value={formState.body_font_name}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, body_font_name: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Label Size</label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={formState.label_font_size}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, label_font_size: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Value Size</label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={formState.body_font_size}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, body_font_size: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Field configuration */}
          <section className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Form Fields</h2>
              <p className="text-sm text-gray-500 mt-1">
                Drag to reorder the fields or switch them on/off. Multi-line fields display as text areas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Displayed Fields</h3>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 min-h-[300px]">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={activeFields.map((field) => field.name)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {activeFields.map((field) => (
                          <SortableFieldCard
                            key={field.name}
                            field={field}
                            onHide={() => handleFieldVisibilityToggle(field.name, false)}
                            onLabelChange={handleFieldLabelChange}
                            onMultilineToggle={handleFieldMultilineToggle}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    {activeFields.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-10">
                        Drag fields here to include them in the admission form.
                      </p>
                    )}
                  </DndContext>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Hidden Fields</h3>
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 space-y-3 min-h-[300px]">
                  {inactiveFields.length === 0 && (
                    <p className="text-xs text-gray-500">All available fields are currently in use.</p>
                  )}
                  {inactiveFields.map((field) => (
                    <div key={field.name} className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                      <p className="text-sm font-semibold text-gray-700">{field.label}</p>
                      <p className="text-xs text-gray-500 mb-3">Source: {field.source}</p>
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center text-xs text-gray-600 space-x-1">
                          <input
                            type="checkbox"
                            checked={field.multiline}
                            onChange={(e) => handleFieldMultilineToggle(field.name, e.target.checked)}
                          />
                          <span>Multi-line</span>
                        </label>
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => handleFieldVisibilityToggle(field.name, true)}
                        >
                          Show field
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              onClick={async () => {
                try {
                  setLoading(true);
                  const fresh = await admissionAPI.getTemplate(template.slug);
                  setTemplate(fresh.data);
                  setFieldConfig(buildFieldConfig(fresh.data, fieldCatalog));
                  setLogoFile(null);
                  setBackgroundFile(null);
                  setRemoveLogo(false);
                  setRemoveBackground(false);
                  toast.info('Reverted to saved version');
                } catch (error) {
                  console.error('Failed to reset template', error);
                  toast.error('Could not revert changes');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Reset changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageAdmissionForm;
