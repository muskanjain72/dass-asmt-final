import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'normal',
        eligibility: 'All',
        registrationDeadline: '',
        startDate: '',
        endDate: '',
        registrationLimit: 0,
        registrationFee: 0,
        merchandiseStock: 0,
        purchaseLimit: 1,
        tags: '',
        merchandiseVariants: [],
        formSchema: []
    });

    const [newVariant, setNewVariant] = useState({ category: '', options: '' });
    const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '' });
    const [activeSection, setActiveSection] = useState('basic');
    const [submitting, setSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            setEditMode(true);
            fetchEventToEdit(editId);
        }
    }, []);

    const addVariant = () => {
        if (!newVariant.category || !newVariant.options) return;
        const variantToAdd = {
            category: newVariant.category,
            options: newVariant.options.split(',').map(s => s.trim())
        };
        setFormData(prev => ({
            ...prev,
            merchandiseVariants: [...(prev.merchandiseVariants || []), variantToAdd]
        }));
        setNewVariant({ category: '', options: '' });
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            merchandiseVariants: prev.merchandiseVariants.filter((_, i) => i !== index)
        }));
    };

    const fetchEventToEdit = async (id) => {
        try {
            const { data } = await api.get(`/events/${id}`);
            // Format dates for input[type="datetime-local"]
            const formatDate = (date) => date ? new Date(date).toISOString().slice(0, 16) : '';
            setFormData({
                ...data,
                registrationDeadline: formatDate(data.registrationDeadline),
                startDate: formatDate(data.startDate),
                endDate: formatDate(data.endDate),
                tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
            });
        } catch (error) {
            console.error("Error fetching event for edit", error);
            alert("Error loading event data");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addCustomField = () => {
        if (!newField.label) return;
        const fieldToAdd = {
            ...newField,
            options: newField.options ? newField.options.split(',').map(s => s.trim()) : []
        };
        setFormData(prev => ({
            ...prev,
            formSchema: [...prev.formSchema, fieldToAdd]
        }));
        setNewField({ label: '', type: 'text', required: false, options: '' });
    };

    const removeCustomField = (index) => {
        setFormData(prev => ({
            ...prev,
            formSchema: prev.formSchema.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editMode && formData._id) {
                await api.put(`/events/${formData._id}`, formData);
                alert('Event Updated Successfully!');
                navigate(`/organizer/event/${formData._id}`);
            } else {
                await api.post('/events', formData);
                alert('Event Draft Created Successfully!');
                navigate('/organizer/dashboard');
            }
        } catch (error) {
            console.error("Error saving event", error);
            alert(error.response?.data?.message || 'Error saving event');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827' }}>{editMode ? 'Edit Event' : 'Create New Event'}</h1>
                <p style={{ color: '#6b7280', fontSize: '1.125rem', marginTop: '8px' }}>Follow the steps below to set up your event or merchandise listing.</p>
            </div>

            {/* Stepper Header */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', gap: '48px' }}>
                <div onClick={() => setActiveSection('basic')} style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '12px', borderBottom: activeSection === 'basic' ? '3px solid #6d28d9' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s' }}>
                    <div style={{ backgroundColor: activeSection === 'basic' ? '#6d28d9' : '#e5e7eb', color: activeSection === 'basic' ? 'white' : '#6b7280', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                    <span style={{ fontWeight: 'bold', color: activeSection === 'basic' ? '#6d28d9' : '#6b7280' }}>Basic Details</span>
                </div>
                <div onClick={() => setActiveSection('custom')} style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: '12px', borderBottom: activeSection === 'custom' ? '3px solid #6d28d9' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s' }}>
                    <div style={{ backgroundColor: activeSection === 'custom' ? '#6d28d9' : '#e5e7eb', color: activeSection === 'custom' ? 'white' : '#6b7280', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                    <span style={{ fontWeight: 'bold', color: activeSection === 'custom' ? '#6d28d9' : '#6b7280' }}>Registration Form</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="saas-card" style={{ padding: '40px' }}>
                {activeSection === 'basic' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    Event Name
                                </label>
                                <input type="text" name="name" required className="input" style={{ paddingLeft: '12px' }} placeholder="e.g. Annual Tech Symposium" value={formData.name} onChange={handleChange} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    Listing Type
                                </label>
                                <select name="type" className="input" style={{ paddingLeft: '12px' }} value={formData.type} onChange={handleChange}>
                                    <option value="normal">Normal Event</option>
                                    <option value="merchandise">Merchandise Listing</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    Eligibility
                                </label>
                                <select name="eligibility" className="input" style={{ paddingLeft: '12px' }} value={formData.eligibility} onChange={handleChange}>
                                    <option value="All">All</option>
                                    <option value="IIIT Students Only">IIIT Students Only</option>
                                    <option value="External Only">External Only</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                Event Description
                            </label>
                            <textarea name="description" rows={4} required className="input" style={{ paddingLeft: '12px', resize: 'none' }} placeholder="Describe the event, rules, and expectations..." value={formData.description} onChange={handleChange} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Registration Deadline</label>
                                <input type="datetime-local" name="registrationDeadline" className="input" style={{ paddingLeft: '12px' }} value={formData.registrationDeadline} onChange={handleChange} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Start Date</label>
                                <input type="datetime-local" name="startDate" className="input" style={{ paddingLeft: '12px' }} value={formData.startDate} onChange={handleChange} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>End Date</label>
                                <input type="datetime-local" name="endDate" className="input" style={{ paddingLeft: '12px' }} value={formData.endDate} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                Event Tags (comma separated)
                            </label>
                            <input type="text" name="tags" className="input" style={{ paddingLeft: '12px' }} placeholder="e.g. workshop, coding, music" value={formData.tags} onChange={handleChange} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Registration Fee (₹)</label>
                                <input type="number" name="registrationFee" className="input" style={{ paddingLeft: '12px' }} value={formData.registrationFee} onChange={handleChange} />
                            </div>
                            {formData.type === 'normal' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Registration Limit</label>
                                    <input type="number" name="registrationLimit" className="input" style={{ paddingLeft: '12px' }} value={formData.registrationLimit} onChange={handleChange} />
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Total Stock</label>
                                        <input type="number" name="merchandiseStock" className="input" style={{ paddingLeft: '12px' }} value={formData.merchandiseStock} onChange={handleChange} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#374151' }}>Purchase Limit / Person</label>
                                        <input type="number" name="purchaseLimit" className="input" style={{ paddingLeft: '12px' }} value={formData.purchaseLimit} onChange={handleChange} />
                                    </div>
                                </>
                            )}
                        </div>

                        {formData.type === 'merchandise' && (
                            <div style={{ backgroundColor: '#f3f4f6', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Merchandise Variants (Size, Color, etc.)</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Category</label>
                                        <input type="text" placeholder="e.g. Size" className="input" style={{ paddingLeft: '12px', marginTop: '4px' }} value={newVariant.category} onChange={(e) => setNewVariant({ ...newVariant, category: e.target.value })} />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Options (comma separated)</label>
                                        <input type="text" placeholder="e.g. S, M, L, XL" className="input" style={{ paddingLeft: '12px', marginTop: '4px' }} value={newVariant.options} onChange={(e) => setNewVariant({ ...newVariant, options: e.target.value })} />
                                    </div>
                                    <button type="button" onClick={addVariant} style={{ height: '46px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#111827', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', padding: '0 16px' }}>Add Variant</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                                    {formData.merchandiseVariants?.map((v, idx) => (
                                        <div key={idx} style={{ backgroundColor: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{v.category}:</span>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{v.options.join(', ')}</span>
                                            <button type="button" onClick={() => removeVariant(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button type="button" onClick={() => setActiveSection('custom')} className="btn-primary" style={{ padding: '12px 32px' }}>
                                Next: Customize Form
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Form Builder</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Field Label</label>
                                    <input type="text" placeholder="e.g. Roll Number" className="input" style={{ paddingLeft: '12px', marginTop: '4px' }} value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Type</label>
                                    <select className="input" style={{ paddingLeft: '12px', marginTop: '4px' }} value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                                        <option value="text">Short Text</option>
                                        <option value="number">Number</option>
                                        <option value="dropdown">Selection</option>
                                        <option value="checkbox">Binary (Checkbox)</option>
                                    </select>
                                </div>
                                <button type="button" onClick={addCustomField} style={{ height: '46px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Add Field</button>
                            </div>
                            {(newField.type === 'dropdown' || newField.type === 'checkbox') && (
                                <div style={{ marginTop: '16px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Options (comma separated)</label>
                                    <input type="text" placeholder="Yes, No | Small, Medium, Large" className="input" style={{ paddingLeft: '12px', marginTop: '4px' }} value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} />
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Registration Preview</h3>
                            {formData.formSchema.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb', color: '#9ca3af', fontStyle: 'italic' }}>
                                    No custom fields added. Default fields (Name, Email) are included automatically.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {formData.formSchema.map((field, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold', color: '#111827' }}>{field.label}</span>
                                                <span className="badge badge-gray" style={{ marginLeft: '12px' }}>{field.type}</span>
                                            </div>
                                            <button type="button" onClick={() => removeCustomField(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '8px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '32px' }}>
                            <button type="button" onClick={() => setActiveSection('basic')} style={{ color: '#6d28d9', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                                Back to Details
                            </button>
                            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '12px 48px' }}>
                                {submitting ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Event' : 'Finalize & Create Event')}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default CreateEvent;
