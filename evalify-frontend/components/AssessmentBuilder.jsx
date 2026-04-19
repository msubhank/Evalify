import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssessmentBuilder = ({ teacher, scopedClassId = null, onAssignmentCreated }) => {
    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newAssessment, setNewAssessment] = useState({
        id: null,
        classId: scopedClassId || '',
        title: '',
        description: '',
        deadline: '',
        durationValue: '',
        durationUnit: 'Minutes',
        type: 'CODING',
        starterCode: '// Evalify Starter Code\n\nfunction main() {\n  // Implementation here\n}',
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [classesRes, assignmentsRes] = await Promise.all([
                axios.get(`${API_URL}/classes/user/${teacher.id}`),
                axios.get(`${API_URL}/assignments/user/${teacher.id}`)
            ]);

            setClasses(classesRes.data);
            setAssignments(assignmentsRes.data);

            // Set default class if not scoped
            if (!scopedClassId && classesRes.data.length > 0 && !newAssessment.classId) {
                setNewAssessment(prev => ({ ...prev, classId: classesRes.data[0].id }));
            }
        } catch (err) {
            console.error("Failed to fetch assessment builder data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [teacher.id, scopedClassId]);

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        const cid = scopedClassId || newAssessment.classId;
        if (!cid || !newAssessment.title) {
            alert("Please select a class and enter a title.");
            return;
        }

        try {
            let res;
            if (newAssessment.id) {
                // Update existing
                res = await axios.put(`${API_URL}/assignments/${newAssessment.id}`, {
                    title: newAssessment.title,
                    description: newAssessment.description,
                    deadline: newAssessment.deadline,
                    durationValue: newAssessment.durationValue,
                    durationUnit: newAssessment.durationUnit,
                    type: newAssessment.type,
                    starterCode: newAssessment.type === 'CODING' ? newAssessment.starterCode : '',
                    language: 'javascript' // Currently hardcoded
                });
                alert('Assessment updated successfully!');
                setAssignments(assignments.map(a => a.id === newAssessment.id ? res.data : a));
            } else {
                // Create new
                res = await axios.post(`${API_URL}/assignments`, {
                    classId: cid,
                    title: newAssessment.title,
                    description: newAssessment.description,
                    deadline: newAssessment.deadline,
                    durationValue: newAssessment.durationValue,
                    durationUnit: newAssessment.durationUnit,
                    type: newAssessment.type,
                    starterCode: newAssessment.type === 'CODING' ? newAssessment.starterCode : '',
                    language: 'javascript'
                });
                alert(`New ${newAssessment.type} published successfully!`);
                setAssignments([res.data, ...assignments]);
            }

            // Reset form
            setNewAssessment({
                id: null,
                classId: scopedClassId || (classes.length > 0 ? classes[0].id : ''),
                title: '',
                description: '',
                deadline: '',
                durationValue: '',
                durationUnit: 'Minutes',
                type: 'CODING',
                starterCode: '// Evalify Starter Code\n\nfunction main() {\n  // Implementation here\n}',
            });

            if (onAssignmentCreated) onAssignmentCreated(res?.data);
        } catch (err) {
            console.error("Failed to publish/update assessment:", err);
            alert(err.response?.data?.error || "Failed to save assessment. Check if all fields are correct.");
        }
    };

    const handleModifyClick = (assignment) => {
        setNewAssessment({
            id: assignment.id,
            classId: assignment.class_id,
            title: assignment.title || '',
            description: assignment.description || '',
            deadline: assignment.deadline ? new Date(assignment.deadline).toISOString().split('T')[0] : '',
            durationValue: assignment.duration_value || assignment.duration || '',
            durationUnit: assignment.duration_unit || assignment.durationUnit || 'Minutes',
            type: assignment.type || 'CODING',
            starterCode: assignment.starter_code || '// Evalify Starter Code\n\nfunction main() {\n  // Implementation here\n}',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setNewAssessment({
            id: null,
            classId: scopedClassId || (classes.length > 0 ? classes[0].id : ''),
            title: '',
            description: '',
            deadline: '',
            durationValue: '',
            durationUnit: 'Minutes',
            type: 'CODING',
            starterCode: '// Evalify Starter Code\n\nfunction main() {\n  // Implementation here\n}',
        });
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to archive this assessment?")) return;
        try {
            await axios.delete(`${API_URL}/assignments/${id}`);
            setAssignments(assignments.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to delete assignment:", err);
            alert("Failed to archive assessment.");
        }
    };

    const filteredAssignments = scopedClassId
        ? assignments.filter(a => a.class_id === scopedClassId)
        : assignments;

    if (isLoading && classes.length === 0) {
        return <div className="p-20 text-center text-slate-500 animate-pulse">Loading assessments...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in text-slate-100 pb-10">
            <div className="bg-slate-900 p-10 rounded-[40px] border border-white/10 shadow-3xl">
                {!scopedClassId && (
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 text-3xl">
                            🛠️
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white">Global Assessment Builder</h2>
                            <p className="text-slate-400 mt-1 font-medium">Create and manage labs across all your classrooms.</p>
                        </div>
                    </div>
                )}

                {classes.length === 0 ? (
                    <div className="text-center py-16 bg-slate-950 rounded-3xl border border-dashed border-white/10">
                        <p className="text-slate-500 text-lg">You haven't created any classes yet.</p>
                        <p className="text-slate-600 text-sm mt-2">Go to the Dashboard to create a class first.</p>
                    </div>
                ) : (
                    <form onSubmit={handleCreateAssessment} className="space-y-8 p-10 bg-slate-950/80 backdrop-blur-md rounded-[40px] border border-white/10 shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {!scopedClassId && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Target Classroom</label>
                                    <select
                                        className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner appearance-none"
                                        value={newAssessment.classId}
                                        onChange={e => setNewAssessment({ ...newAssessment, classId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select a class...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Assessment Type</label>
                                <select
                                    className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner appearance-none"
                                    value={newAssessment.type}
                                    onChange={e => setNewAssessment({ ...newAssessment, type: e.target.value })}
                                >
                                    <option value="CODING">Coding Lab</option>
                                    <option value="ASSIGNMENT">Standard Assignment</option>
                                    <option value="QUIZ">Quiz / Multiple Choice</option>
                                    <option value="EXAM">Proctored Exam</option>
                                </select>
                            </div>
                            {scopedClassId && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Assessment Title</label>
                                    <input
                                        type="text" placeholder="e.g. Lab 01: Sorting" required
                                        className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner"
                                        value={newAssessment.title}
                                        onChange={e => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        {!scopedClassId && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Assessment Title</label>
                                <input
                                    type="text" placeholder="e.g. Midterm Coding Lab" required
                                    className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner"
                                    value={newAssessment.title}
                                    onChange={e => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Submission Deadline</label>
                                <input
                                    type="date" required
                                    className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner"
                                    value={newAssessment.deadline}
                                    onChange={e => setNewAssessment({ ...newAssessment, deadline: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Time Limit & Unit</label>
                                <div className="flex gap-4">
                                    <input
                                        type="number" min="0" placeholder="Value..."
                                        className="w-full bg-slate-800 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner"
                                        value={newAssessment.durationValue}
                                        onChange={e => setNewAssessment({ ...newAssessment, durationValue: e.target.value })}
                                    />
                                    <select
                                        className="bg-slate-800 border border-white/5 rounded-3xl px-8 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner appearance-none min-w-[140px]"
                                        value={newAssessment.durationUnit}
                                        onChange={e => setNewAssessment({ ...newAssessment, durationUnit: e.target.value })}
                                    >
                                        <option value="Minutes">Minutes</option>
                                        <option value="Hours">Hours</option>
                                        <option value="Days">Days</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Problem Statement & Requirements</label>
                            <textarea
                                placeholder="Explain the coding challenge or assignment instructions..." rows={5}
                                className="w-full bg-slate-800 border border-white/5 rounded-[32px] p-6 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-white shadow-inner"
                                value={newAssessment.description}
                                onChange={e => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                required
                            />
                        </div>

                        {newAssessment.type === 'CODING' && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Starter Code Boilerplate</label>
                                <textarea
                                    rows={8}
                                    className="w-full bg-[#0B0F19] border border-white/10 rounded-[32px] p-6 text-xs font-mono text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={newAssessment.starterCode}
                                    onChange={e => setNewAssessment({ ...newAssessment, starterCode: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="flex gap-4 mt-8">
                            <button type="submit" className="flex-[2] bg-blue-600 py-6 rounded-[32px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-2xl shadow-blue-600/40 active:scale-95 transition-all text-white">
                                {newAssessment.id ? 'Save Updates' : (scopedClassId ? 'Broadcast to Students' : 'Publish Global Assessment')}
                            </button>
                            {newAssessment.id && (
                                <button type="button" onClick={handleCancelEdit} className="flex-1 bg-slate-800 py-6 rounded-[32px] font-black uppercase tracking-widest hover:bg-slate-700 shadow-2xl active:scale-95 transition-all text-slate-400">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>

            <div className="bg-slate-900/50 p-10 rounded-[40px] border border-white/10 shadow-3xl">
                <h3 className="text-2xl font-black mb-8">
                    {scopedClassId ? 'Active Class Assessments' : 'All Published Assessments'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAssignments.map(a => {
                        const classInfo = classes.find(c => c.id === a.class_id);
                        return (
                            <div key={a.id} className="p-8 bg-slate-950 rounded-[48px] border border-white/5 hover:border-blue-500/20 transition-all group relative flex flex-col h-full">
                                {(a.duration_value || a.duration) && (
                                    <div className="absolute top-8 right-8 text-[10px] bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-yellow-500/20">
                                        ⏱️ {a.duration_value || a.duration} {a.duration_unit || a.durationUnit}
                                    </div>
                                )}
                                <div className="mb-6 flex items-center gap-2">
                                    <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${a.type === 'CODING' ? 'bg-green-500/10 text-green-400' :
                                        a.type === 'QUIZ' ? 'bg-yellow-500/10 text-yellow-400' :
                                            a.type === 'EXAM' ? 'bg-red-500/10 text-red-400' :
                                                'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {a.type || 'LAB'}
                                    </span>
                                    {!scopedClassId && <span className="text-[10px] text-slate-500 font-bold uppercase">{classInfo?.name || 'Loading...'}</span>}
                                </div>
                                <h4 className="font-black text-xl mb-4 pr-20 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{a.title}</h4>
                                <p className="text-sm text-slate-500 mb-8 font-medium line-clamp-2 leading-relaxed">{a.description}</p>
                                <div className="flex gap-4 mt-auto">
                                    <button 
                                        onClick={() => handleModifyClick(a)} 
                                        className="flex-1 py-3 rounded-[20px] bg-slate-900 text-[10px] font-black text-white border border-white/10 hover:bg-slate-800 tracking-widest uppercase transition-all"
                                    >
                                        Modify
                                    </button>
                                    <button onClick={() => handleDeleteAssignment(a.id)} className="flex-1 py-3 rounded-[20px] bg-red-500/10 text-[10px] font-black text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all tracking-widest uppercase">Archive</button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredAssignments.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-600 italic font-medium">
                            No active assessments found {scopedClassId ? 'for this classroom' : 'yet'}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssessmentBuilder;
