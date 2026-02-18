import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const RegistrationModal = ({ event, onClose, onSubmit, submitting }) => {
    const { user } = useAuth();
    const [responses, setResponses] = useState({});
    const [uploadingField, setUploadingField] = useState(null);

    // Initialize responses for merchandise
    useEffect(() => {
        if (event.type === 'merchandise' && user && Object.keys(responses).length === 0) {
            setResponses({
                'Full Name': `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                'Email ID': user.email || '',
                'Contact Number': user.contactNumber || '',
                quantity: 1,
                variants: {}
            });
        }
    }, [event.type, user]);

    if (!event) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (uploadingField) {
            alert("Please wait for the file to finish uploading.");
            return;
        }

        // Validate variants for merchandise
        if (event.type === 'merchandise' && event.merchandiseVariants) {
            const missing = event.merchandiseVariants.find(v => !responses.variants?.[v.category]);
            if (missing) {
                alert(`Please select ${missing.category}`);
                return;
            }
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
        <div className="glass-modal-overlay">
            <div className="premium-card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', background: 'var(--primary-gradient)', color: 'white', position: 'relative' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Complete Registration</h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>{event.name}</p>
                    </div>
                    <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: 'white', zIndex: 2 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ padding: '32px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {event.type === 'merchandise' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                                {/* Personal Details Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>Personal Details</h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>Full Name *</label>
                                            <input type="text" required className="premium-input" placeholder="Enter your full name" value={responses['Full Name'] || ''} onChange={(e) => handleChange('Full Name', e.target.value)} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>Email ID *</label>
                                                <input type="email" required className="premium-input" placeholder="your@email.com" value={responses['Email ID'] || ''} onChange={(e) => handleChange('Email ID', e.target.value)} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>Contact No. *</label>
                                                <input type="tel" required className="premium-input" placeholder="Phone number" value={responses['Contact Number'] || ''} onChange={(e) => handleChange('Contact Number', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Config Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>Configuration</h4>

                                    {event.merchandiseVariants && event.merchandiseVariants.map((variant, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>Select {variant.category} *</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {variant.options.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentVariants = responses.variants || {};
                                                            handleChange('variants', { ...currentVariants, [variant.category]: opt });
                                                        }}
                                                        className={`variant-btn ${responses.variants?.[variant.category] === opt ? 'active' : ''}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>Quantity *</label>
                                        <div className="qty-counter">
                                            <button type="button" onClick={() => handleChange('quantity', Math.max(1, (responses.quantity || 1) - 1))} className="qty-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            </button>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 900, width: '40px', textAlign: 'center', color: '#111827' }}>{responses.quantity || 1}</span>
                                            <button type="button" onClick={() => {
                                                const currentQty = responses.quantity || 1;
                                                const limit = event.purchaseLimit || 99;
                                                const stock = event.merchandiseStock || 99;
                                                if (currentQty < limit && currentQty < stock) {
                                                    handleChange('quantity', currentQty + 1);
                                                }
                                            }} className="qty-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginLeft: '4px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Limit: {event.purchaseLimit || '∞'}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Stock: {event.merchandiseStock || '∞'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="summary-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h5 style={{ fontSize: '0.65rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Order Summary</h5>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'rgba(167, 139, 250, 0.1)', padding: '4px 8px', borderRadius: '6px', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.2)' }}>Instant Ticket</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <p style={{ fontSize: '2rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>₹{(responses.quantity || 1) * event.registrationFee}</p>
                                            <p style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, marginTop: '4px' }}>Total Payable Amount</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a78bfa', margin: 0 }}>₹{event.registrationFee} × {responses.quantity || 1}</p>
                                            <p style={{ fontSize: '0.6rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>Incl. all taxes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Normal Event Form
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {event.formSchema && event.formSchema.length > 0 ? (
                                    event.formSchema.map((field, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>
                                                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                            </label>

                                            {field.type === 'dropdown' ? (
                                                <select required={field.required} className="premium-input" value={responses[field.label] || ''} onChange={(e) => handleChange(field.label, e.target.value)}>
                                                    <option value="">Select an option</option>
                                                    {field.options && field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : field.type === 'radio' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                                                    {field.options && field.options.map((opt, i) => (
                                                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                            <input type="radio" name={field.label} required={field.required} style={{ width: '18px', height: '18px', accentColor: 'var(--primary-purple)' }} checked={responses[field.label] === opt} onChange={() => handleChange(field.label, opt)} />
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: responses[field.label] === opt ? 'var(--primary-purple)' : '#4b5563' }}>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'checkbox' ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '4px' }}>
                                                    {field.options && field.options.map((opt, i) => (
                                                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-purple)', borderRadius: '4px' }}
                                                                checked={(responses[field.label] || []).includes(opt)}
                                                                onChange={(e) => {
                                                                    const current = responses[field.label] || [];
                                                                    const next = e.target.checked
                                                                        ? [...current, opt]
                                                                        : current.filter(val => val !== opt);
                                                                    handleChange(field.label, next);
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: (responses[field.label] || []).includes(opt) ? 'var(--primary-purple)' : '#4b5563' }}>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'file' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <input
                                                        type="file"
                                                        required={field.required && !responses[field.label]}
                                                        className="premium-file-input"
                                                        onChange={(e) => handleFileUpload(field.label, e.target.files[0])}
                                                    />
                                                    {uploadingField === field.label && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f5f3ff', borderRadius: '8px', width: 'fit-content' }}>
                                                            <div style={{ width: '16px', height: '16px', border: '2px solid #9333ea', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#9333ea', textTransform: 'uppercase', margin: 0 }}>Optimizing Assets...</p>
                                                        </div>
                                                    )}
                                                    {responses[field.label] && !uploadingField && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5', width: 'fit-content' }}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="#10b981"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                            <p style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', margin: 0 }}>Cloud Encrypted</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <input type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} required={field.required} className="premium-input" placeholder={`Enter ${field.label}`} value={responses[field.label] || ''} onChange={(e) => handleChange(field.label, e.target.value)} />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div style={{ width: '64px', height: '64px', background: '#f5f3ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ margin: 'auto' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>Entry Reserved</h3>
                                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, marginTop: '8px', textTransform: 'uppercase' }}>No extra data required</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '16px', background: 'white', position: 'sticky', bottom: 0, paddingTop: '16px', marginTop: 'auto' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, borderRadius: '16px', height: '56px' }}>Back</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, borderRadius: '16px', height: '56px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {submitting ? 'Authenticating...' : event.type === 'merchandise' ? 'Finalize Order' : 'Complete Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationModal;
