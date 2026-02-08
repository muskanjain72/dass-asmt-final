import { useState } from 'react';
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
        // Custom Form
        formSchema: []
    });

    // For Form Builder
    const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '' });

    // Tab State for Sections
    const [activeSection, setActiveSection] = useState('basic'); // basic, custom

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
        try {
            await api.post('/events', formData);
            alert('Event Draft Created Successfully!');
            navigate('/organizer/dashboard');
        } catch (error) {
            console.error("Error creating event", error);
            alert('Error creating event');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Event</h1>

            {/* Simple Steps / Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 border-b-2 font-medium ${activeSection === 'basic' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveSection('basic')}
                >
                    1. Basic Details
                </button>
                <button
                    className={`py-2 px-4 border-b-2 font-medium ${activeSection === 'custom' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveSection('custom')}
                >
                    2. Registration Form
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">

                {/* section: Basic Details */}
                {activeSection === 'basic' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                                <input type="text" name="name" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2" value={formData.name} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select name="type" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2" value={formData.type} onChange={handleChange}>
                                    <option value="normal">Event (Workshop/Comp)</option>
                                    <option value="merchandise">Merchandise Sale</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" rows={3} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2" value={formData.description} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                                <input type="datetime-local" name="registrationDeadline" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={formData.registrationDeadline} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="datetime-local" name="startDate" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={formData.startDate} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input type="datetime-local" name="endDate" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={formData.endDate} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fee (₹)</label>
                                <input type="number" name="registrationFee" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={formData.registrationFee} onChange={handleChange} />
                            </div>
                            {formData.type === 'normal' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Registration Limit</label>
                                    <input type="number" name="registrationLimit" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={formData.registrationLimit} onChange={handleChange} />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                                    <input type="number" name="merchandiseStock" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={formData.merchandiseStock} onChange={handleChange} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setActiveSection('custom')} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                                Next: Form Builder
                            </button>
                        </div>
                    </div>
                )}

                {/* section: Form Builder */}
                {activeSection === 'custom' && (
                    <div className="space-y-6">
                        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                            <h3 className="font-medium text-gray-900 mb-2">Add Custom Field</h3>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 items-end">
                                <div className="sm:col-span-2">
                                    <input type="text" placeholder="Field Label (e.g. T-Shirt Size)" className="block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} />
                                </div>
                                <div>
                                    <select className="block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })}>
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="dropdown">Dropdown</option>
                                        <option value="checkbox">Checkbox</option>
                                    </select>
                                </div>
                                <div>
                                    <button type="button" onClick={addCustomField} className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Add Field</button>
                                </div>
                            </div>
                            {(newField.type === 'dropdown' || newField.type === 'checkbox') && (
                                <div className="mt-2">
                                    <input type="text" placeholder="Options (comma separated)" className="block w-full border-gray-300 rounded-md shadow-sm p-2 border" value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} />
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Current Form Fields</h3>
                            {formData.formSchema.length === 0 && <p className="text-gray-500 text-sm">No custom fields added.</p>}
                            <ul className="space-y-2">
                                {formData.formSchema.map((field, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                                        <span className="text-sm font-medium">{field.label} <span className="text-gray-400 font-normal">({field.type})</span></span>
                                        <button type="button" onClick={() => removeCustomField(idx)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-200">
                            <button type="button" onClick={() => setActiveSection('basic')} className="text-gray-600 hover:text-gray-900 font-medium">
                                Back
                            </button>
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-bold">
                                Create Draft Event
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default CreateEvent;
