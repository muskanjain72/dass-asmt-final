import React, { useState } from 'react';

const RegistrationModal = ({ event, onClose, onSubmit, submitting }) => {
    const [responses, setResponses] = useState({});
    const [uploadingField, setUploadingField] = useState(null);

    if (!event) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (uploadingField) {
            alert("Please wait for the file to finish uploading.");
            return;
        }
        onSubmit(responses);
    };

    const handleChange = (label, value) => {
        setResponses(prev => ({ ...prev, [label]: value }));
    };

    const handleFileUpload = async (label, file) => {
        if (!file) return;

        setUploadingField(label);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleChange(label, res.data.url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('File upload failed. Please try again.');
        } finally {
            setUploadingField(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                {/* Header */}
                <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center" style={{ background: 'var(--primary-gradient)' }}>
                    <h2 className="text-xl font-bold">Complete Registration</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scroller-hide">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{event.name}</h3>
                        <p className="text-sm text-gray-500">Please provide the additional information requested by the organizer.</p>
                    </div>

                    <div className="space-y-4">
                        {event.formSchema && event.formSchema.length > 0 ? (
                            event.formSchema.map((field, idx) => (
                                <div key={idx} className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {field.type === 'dropdown' ? (
                                        <select
                                            required={field.required}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                                            value={responses[field.label] || ''}
                                            onChange={(e) => handleChange(field.label, e.target.value)}
                                        >
                                            <option value="">Select an option</option>
                                            {field.options && field.options.map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'checkbox' ? (
                                        <div className="flex flex-wrap gap-4 mt-1">
                                            {field.options && field.options.map((opt, i) => (
                                                <label key={i} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                        checked={(responses[field.label] || []).includes(opt)}
                                                        onChange={(e) => {
                                                            const current = responses[field.label] || [];
                                                            const next = e.target.checked
                                                                ? [...current, opt]
                                                                : current.filter(val => val !== opt);
                                                            handleChange(field.label, next);
                                                        }}
                                                    />
                                                    <span className="text-sm text-gray-600">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'file' ? (
                                        <div className="space-y-2">
                                            <input
                                                type="file"
                                                required={field.required && !responses[field.label]}
                                                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                                onChange={(e) => handleFileUpload(field.label, e.target.files[0])}
                                            />
                                            {uploadingField === field.label && <p className="text-[10px] text-purple-600 animate-pulse">Uploading...</p>}
                                            {responses[field.label] && (
                                                <p className="text-[10px] text-green-600 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    File uploaded successfully
                                                </p>
                                            )}
                                        </div>
                                    ) : field.type === 'number' ? (
                                        <input
                                            type="number"
                                            required={field.required}
                                            placeholder={`Enter ${field.label}`}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                                            value={responses[field.label] || ''}
                                            onChange={(e) => handleChange(field.label, e.target.value)}
                                        />
                                    ) : (
                                        <input
                                            type={field.type === 'email' ? 'email' : 'text'}
                                            required={field.required}
                                            placeholder={`Enter ${field.label}`}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                                            value={responses[field.label] || ''}
                                            onChange={(e) => handleChange(field.label, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No additional information needed. Click register to proceed.</p>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold text-sm disabled:opacity-50"
                            style={{ background: 'var(--primary-gradient)' }}
                        >
                            {submitting ? 'Registering...' : 'Confirm Registration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationModal;
