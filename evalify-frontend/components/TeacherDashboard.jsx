import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AttendanceTable from './AttendanceTable';
import AssessmentBuilder from './AssessmentBuilder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TeacherDashboard = ({ teacher }) => {
  const [classes, setClasses] = useState([]);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [logs, setLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [viewMode, setViewMode] = useState('roster');

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'GENERAL'
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [inspectSubmission, setInspectSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '', totalMarks: '100' });
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState('');

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const fetchData = async () => {
    try {
      const [classRes, rosterRes, attendanceRes, assignmentsRes, integrityRes, submissionsRes] = await Promise.all([
        axios.get(`${API_URL}/classes/user/${teacher.id}`),
        axios.get(`${API_URL}/classes/teacher/${teacher.id}/roster`),
        axios.get(`${API_URL}/attendance?teacherId=${teacher.id}`),
        axios.get(`${API_URL}/assignments/user/${teacher.id}`),
        axios.get(`${API_URL}/integrity?teacherId=${teacher.id}`),
        axios.get(`${API_URL}/assignments/submissions?teacherId=${teacher.id}`)
      ]);
      setClasses(classRes.data);
      setStudents(rosterRes.data);
      setAttendance(attendanceRes.data);
      setAssignments(assignmentsRes.data);
      setLogs(integrityRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Error fetching teacher dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teacher.id]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (selectedClass) {
        try {
          const res = await axios.get(`${API_URL}/announcements/class/${selectedClass.id}`);
          setAnnouncements(res.data);
        } catch (error) {
          console.error("Error fetching announcements:", error);
        }
      }
    };
    fetchAnnouncements();
    setSelectedAssignmentFilter('');
  }, [selectedClass]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName) return;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const res = await axios.post(`${API_URL}/classes`, {
        name: newClassName,
        code: code,
        teacherId: teacher.id
      });
      const newCls = res.data;

      setClasses([...classes, newCls]);
      setNewClassName('');
      setIsCreatingClass(false);
      setSelectedClass(newCls);
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error.response?.data?.error || 'Failed to create class');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedClass || !newAnnouncement.title || !newAnnouncement.content) return;

    try {
      const res = await axios.post(`${API_URL}/announcements`, {
        classId: selectedClass.id,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        author: teacher.name
      });

      const announcement = res.data;
      setAnnouncements([announcement, ...announcements]);
      setIsCreatingAnnouncement(false);
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'GENERAL'
      });
      alert("Announcement posted to all students in " + selectedClass.name);
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to post announcement.");
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      await axios.post(`${API_URL}/assignments/submissions`, {
        studentId: gradingSubmission.student_id,
        assignmentId: gradingSubmission.assignment_id,
        code: gradingSubmission.code,
        language: gradingSubmission.language,
        output: gradingSubmission.output,
        status: 'GRADED',
        score: gradeData.score,
        totalMarks: gradeData.totalMarks,
        feedback: gradeData.feedback
      });

      alert("Grade assigned successfully!");
      setGradingSubmission(null);
      setGradeData({ score: '', feedback: '', totalMarks: '100' });

      // Update local submissions state
      setSubmissions(submissions.map(s =>
        (s.student_id === gradingSubmission.student_id && s.assignment_id === gradingSubmission.assignment_id)
          ? { ...s, score: gradeData.score, total_marks: gradeData.totalMarks, feedback: gradeData.feedback, status: 'GRADED' }
          : s
      ));
    } catch (error) {
      console.error("Error saving grade:", error);
      alert(error.response?.data?.error || "Failed to save grade.");
    }
  };

  const handleArchiveOldAttendance = async () => {
    if (window.confirm("Archive all attendance records older than 30 days?")) {
      try {
        await axios.post(`${API_URL}/attendance/archive`, { days: 30 });
        alert("Old records archived successfully.");
        fetchData();
      } catch (error) {
        console.error("Error archiving attendance:", error);
        alert("Failed to archive records.");
      }
    }
  };

  const classStudents = students.filter(s => (s.joinedClasses || []).includes(selectedClass?.code || ''));
  const classSubmissions = submissions.filter(s => s.assignment_id && assignments.some(a => a.id === s.assignment_id && a.class_id === selectedClass?.id));

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 pb-10">
      {/* --- TEACHER DASHBOARD VIEW (MAIN) --- */}
      {!selectedClass ? (
        <>
          <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl sm:rounded-[60px] border border-white/10 shadow-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 text-xl">🏛️</span>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">Teacher Dashboard</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage your classroom portfolios</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingClass(!isCreatingClass)}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-xs font-black transition-all shadow-xl tracking-widest uppercase ${isCreatingClass ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40'}`}
              >
                {isCreatingClass ? 'Close Form' : '+ Build New Class'}
              </button>
            </div>

            {isCreatingClass && (
              <form onSubmit={handleCreateClass} className="flex flex-col sm:flex-row gap-4 mb-12 p-6 sm:p-8 bg-slate-950/80 backdrop-blur-md rounded-3xl sm:rounded-[40px] border border-white/10 animate-slide-down">
                <input
                  type="text"
                  placeholder="Full Class Name (e.g. Data Structures & Algorithms)"
                  className="flex-1 bg-slate-800 border border-white/5 rounded-2xl sm:rounded-3xl p-5 outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-bold placeholder-slate-500 shadow-inner"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-12 py-5 rounded-2xl sm:rounded-3xl font-black text-white transition-all shadow-2xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest text-sm">
                  Initialize
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {classes.map(c => {
                const classStudentsCount = students.filter(s => (s.joinedClasses || []).includes(c.code)).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClass(c);
                      setViewMode('roster');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-6 sm:p-8 rounded-[40px] sm:rounded-[48px] bg-slate-950 border border-white/5 hover:border-blue-500/40 hover:bg-slate-900 transition-all duration-300 text-left relative overflow-hidden group shadow-xl"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="text-8xl">🏫</span>
                    </div>
                    <h4 className="font-black text-2xl mb-2 text-slate-100 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{c.name}</h4>
                    <div
                      onClick={(e) => handleCopyCode(e, c.code)}
                      className="inline-block px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest mb-6 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                    >
                      {copiedCode === c.code ? 'COPIED ✓' : `Code: ${c.code}`}
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Enrolled</span>
                        <span className="text-sm font-bold text-slate-300">{classStudentsCount} Students</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-400 transition-all flex items-center gap-2">
                      Control Panel <span>→</span>
                    </div>
                  </button>
                );
              })}
              {classes.length === 0 && !isCreatingClass && (
                <div className="col-span-full py-20 text-center bg-slate-950/50 rounded-[40px] border border-dashed border-white/5">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-2">No classrooms found</p>
                  <p className="text-slate-600 text-xs">Create your first class to start managing students and labs.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* --- DEDICATED CLASS PAGE (TEACHER) --- */
        <div className="animate-slide-up space-y-8">
          <div className="bg-slate-900 p-6 sm:p-10 rounded-2xl sm:rounded-[60px] border border-white/10 shadow-3xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[24px] bg-blue-600/20 text-blue-400 flex items-center justify-center text-3xl shadow-inner border border-blue-500/20">
                  🏫
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black text-white mb-1 uppercase tracking-tight">{selectedClass.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-950 border border-white/5 rounded-lg text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                      Class Code: {selectedClass.code}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest animate-pulse">
                      Management Mode
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedClass(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-950 text-xs font-black text-white uppercase border border-white/10 hover:bg-slate-800 hover:border-white/20 tracking-widest transition-all group flex items-center justify-center gap-3 active:scale-95"
              >
                <span className="group-hover:-translate-x-1 transition-transform text-lg">←</span>
                Dashboard
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex flex-wrap bg-slate-950/50 p-2 rounded-2xl sm:rounded-3xl border border-white/5 w-fit shadow-lg backdrop-blur-md">
              {[
                { id: 'roster', label: 'Students', icon: '👤' },
                { id: 'assignments', label: 'Labs', icon: '🧪' },
                { id: 'attendance', label: 'Attendance', icon: '✅' },
                { id: 'submissions', label: 'Submissions', icon: '📥' },
                { id: 'announcements', label: 'Announcements', icon: '📢' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-[16px] sm:rounded-[20px] text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest ${viewMode === mode.id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 border border-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <span className="text-sm sm:text-lg">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[500px]">
            {viewMode === 'roster' && (
              <div className="bg-slate-900 border border-white/5 rounded-3xl sm:rounded-[60px] overflow-hidden shadow-3xl animate-fade-in">
                <div className="p-6 sm:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Student Register</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{selectedClass.name} Portfolio</p>
                  </div>
                  <span className="text-[10px] bg-blue-600/10 text-blue-400 px-5 py-2 rounded-full font-black tracking-widest border border-blue-500/10 uppercase shadow-lg shadow-blue-600/5">
                    {classStudents.length} Verified Accounts
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-600 bg-slate-950/50 font-black uppercase tracking-widest text-[9px]">
                      <tr>
                        <th className="p-6 sm:p-8">Student Identity</th>
                        <th className="p-6 sm:p-8">Reg No.</th>
                        <th className="p-6 sm:p-8 text-center">Integrity Status</th>
                        <th className="p-6 sm:p-8 text-center">Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {classStudents.map(s => {
                        const studentLogs = logs.filter(l => l.student_id === s.id);
                        return (
                          <tr key={s.id} className="hover:bg-slate-800/30 transition-all group">
                            <td className="p-6 sm:p-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-slate-300 border border-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{s.name[0]}</div>
                                <div className="flex flex-col">
                                  <span className="font-black text-white text-base group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.name}</span>
                                  <span className="text-xs text-slate-500 font-medium">{s.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 sm:p-8 text-slate-400 font-mono text-xs font-bold tracking-widest">{s.regNo || 'NO_REG'}</td>
                            <td className="p-6 sm:p-8 text-center">
                              <span className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest border ${studentLogs.length > 5 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                {studentLogs.length > 5 ? 'RISK DETECTED' : 'SAFE ENVIRONMENT'}
                              </span>
                            </td>
                            <td className="p-6 sm:p-8 text-center">
                              <div className="flex flex-col items-center gap-0">
                                <span className="font-black text-slate-100 text-lg leading-tight">{studentLogs.length}</span>
                                <span className="text-[9px] text-slate-600 uppercase font-black tracking-tighter">Alerts</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {classStudents.length === 0 && (
                        <tr>
                          <td colSpan="4" className="p-20 text-center text-slate-600 italic font-medium">No students enrolled in this class code yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewMode === 'assignments' && (
              <AssessmentBuilder
                teacher={teacher}
                scopedClassId={selectedClass.id}
                onAssignmentCreated={() => fetchData()}
              />
            )}

            {viewMode === 'submissions' && (
              <div className="bg-slate-900 border border-white/5 rounded-3xl sm:rounded-[60px] overflow-hidden shadow-3xl animate-slide-up">
                <div className="p-6 sm:p-10 border-b border-white/5 bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Code Submissions</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Evaluation Portal</p>
                  </div>
                  <select
                    className="w-full md:w-auto bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 text-white shadow-inner transition-all hover:bg-slate-900 font-black uppercase tracking-widest text-[10px]"
                    value={selectedAssignmentFilter}
                    onChange={(e) => setSelectedAssignmentFilter(e.target.value)}
                  >
                    <option value="">Filter by Assignment</option>
                    {assignments.filter(a => a.class_id === selectedClass.id).map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                </div>
                <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                  {classSubmissions.filter(sub => selectedAssignmentFilter ? sub.assignment_id === selectedAssignmentFilter : true).map(sub => {
                    const assign = assignments.find(a => a.id === sub.assignment_id);
                    const assignmentLogs = logs.filter(l => l.student_id === sub.student_id && l.assignment_id === sub.assignment_id);
                    const flagCount = assignmentLogs.length;

                    return (
                      <div key={sub.id} className="bg-slate-950 p-6 sm:p-10 rounded-3xl sm:rounded-[48px] border border-white/5 hover:border-blue-500/20 transition-all group shadow-2xl relative flex flex-col overflow-hidden">
                        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                          <div>
                            <h5 className="font-black text-white text-2xl group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-tight">{sub.student_name || 'Student'}</h5>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Lab: {assign?.title || 'Unknown'}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {new Date(sub.submitted_at || sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setInspectSubmission(sub);
                                setGradeData({ score: sub.score || '', feedback: sub.feedback || '', totalMarks: sub.total_marks || '100' });
                              }}
                              title="Expand for Better View"
                              className="p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-all active:scale-95"
                            >
                              🔍
                            </button>
                            <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border ${flagCount > 3 ? 'bg-red-500/10 text-red-500 border-red-500/30' : flagCount > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                              {flagCount > 3 ? `HIGH RISK (${flagCount})` : flagCount > 0 ? `CAUTION (${flagCount})` : 'INTEGRITY OK ✓'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 text-left relative z-10">
                          <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 h-64 overflow-auto shadow-inner group-hover:bg-blue-600/5 transition-all">
                            <h6 className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Source Code
                            </h6>
                            <pre className="text-xs font-mono text-indigo-400 leading-relaxed">{sub.code}</pre>
                          </div>

                          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-white/5 h-64 overflow-auto shadow-2xl">
                            <h6 className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Output
                            </h6>
                            <pre className={`text-xs font-mono leading-relaxed whitespace-pre-wrap ${sub.output?.includes('ERROR]') ? 'text-red-400' : 'text-emerald-400'} font-medium`}>
                              {sub.output || 'No output recorded.'}
                            </pre>
                          </div>
                        </div>

                        {gradingSubmission?.id === sub.id ? (
                          <form onSubmit={handleSaveGrade} className="space-y-6 mb-6 p-8 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-blue-500/20 animate-fade-in text-left relative z-10 shadow-2xl">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="col-span-1">
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-2 block tracking-widest">Score</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner text-center font-black"
                                  placeholder="0"
                                  value={gradeData.score}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || /^[0-9\b]+$/.test(val)) {
                                      setGradeData({ ...gradeData, score: val });
                                    }
                                  }}
                                  required
                                />
                              </div>
                              <div className="col-span-1">
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-2 block tracking-widest">Total</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner text-center font-black"
                                  placeholder="100"
                                  value={gradeData.totalMarks}
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || /^[0-9\b]+$/.test(val)) {
                                      setGradeData({ ...gradeData, totalMarks: val });
                                    }
                                  }}
                                  required
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[9px] text-slate-500 font-black uppercase mb-2 block tracking-widest">Feedback Notes</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                  placeholder="Review logic..."
                                  value={gradeData.feedback}
                                  onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <button type="submit" className="flex-2 bg-green-600 hover:bg-green-500 py-4 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl shadow-green-600/20 active:scale-95">Verify & Post Grade</button>
                              <button type="button" onClick={() => setGradingSubmission(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all active:scale-95">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            {(sub.score !== null && sub.score !== undefined) && (
                              <div className="flex-1 bg-blue-600/5 border border-blue-500/10 rounded-[28px] p-5 text-left shadow-inner">
                                <p className="text-[9px] text-slate-600 font-black uppercase mb-1 tracking-widest">Current Multiplier</p>
                                <p className="text-2xl font-black text-blue-400">{sub.score}<span className="text-slate-600 text-[10px] normal-case font-bold ml-1">/ {sub.total_marks || 100}</span></p>
                              </div>
                            )}
                            {sub.feedback && (
                              <div className="flex-[2] bg-slate-900 border border-white/5 rounded-[28px] p-5 text-left">
                                <p className="text-[9px] text-slate-600 font-black uppercase mb-1 tracking-widest">Instructor Remarks</p>
                                <p className="text-xs text-slate-400 italic leading-relaxed font-medium">"{sub.feedback}"</p>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setGradeData({ score: sub.score || '', feedback: sub.feedback || '', totalMarks: sub.total_marks || '100' });
                          }}
                          className={`w-full py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all relative z-10 ${sub.status === 'GRADED' ? 'bg-slate-800 text-slate-500 hover:bg-slate-700 border border-white/5' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'}`}
                        >
                          {sub.status === 'GRADED' ? 'Modify Evaluation' : 'Begin Assessment Evaluation'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'attendance' && (
              <div className="bg-slate-900 border border-white/5 rounded-3xl sm:rounded-[60px] overflow-hidden shadow-3xl animate-fade-in">
                <div className="p-6 sm:p-10 border-b border-white/5 bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Attendance Logs</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Live Tracking Overview</p>
                  </div>
                  <button
                    onClick={handleArchiveOldAttendance}
                    className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-xl"
                  >
                    Archive Stale Records
                  </button>
                </div>
                <div className="p-0 sm:p-2">
                  <AttendanceTable
                    attendance={attendance.filter(a => a.class_id === selectedClass.id)}
                    students={students}
                    classes={classes}
                    showClassColumn={false}
                  />
                </div>
              </div>
            )}

            {viewMode === 'announcements' && (
              <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl sm:rounded-[60px] border border-white/5 shadow-3xl animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Class Announcements</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Broadcast to all students</p>
                  </div>
                  <button onClick={() => setIsCreatingAnnouncement(!isCreatingAnnouncement)} className="w-full md:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-[10px] font-black text-white uppercase border border-white/10 hover:bg-slate-700 tracking-widest shadow-xl transition-all">
                    {isCreatingAnnouncement ? 'Discard Editor' : '+ New Broadcast'}
                  </button>
                </div>

                {isCreatingAnnouncement && (
                  <form onSubmit={handleCreateAnnouncement} className="space-y-8 mb-16 p-8 sm:p-10 bg-slate-950/80 backdrop-blur-md rounded-[40px] sm:rounded-[48px] border border-white/10 animate-slide-down shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Subject Line</label>
                        <input
                          type="text" placeholder="e.g. Tomorrow's Lab Requirements" required
                          className="w-full bg-slate-800 border border-white/5 rounded-2xl sm:rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner"
                          value={newAnnouncement.title}
                          onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Broadcast Priority</label>
                        <select
                          className="w-full bg-slate-800 border border-white/5 rounded-2xl sm:rounded-3xl p-5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-bold text-white shadow-inner"
                          value={newAnnouncement.type}
                          onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                        >
                          <option value="GENERAL">General Update</option>
                          <option value="ASSIGNMENT">Lab Assignment</option>
                          <option value="QUIZ">Quiz Alert</option>
                          <option value="EXAM">Examination</option>
                          <option value="IMPORTANT">Critical / Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-3">Message Body</label>
                      <textarea
                        placeholder="Type your message here..." rows={6}
                        className="w-full bg-slate-800 border border-white/5 rounded-2xl sm:rounded-[32px] p-6 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-white shadow-inner leading-relaxed"
                        value={newAnnouncement.content}
                        onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 py-6 rounded-[32px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-2xl shadow-blue-600/40 active:scale-95 transition-all text-white">Broadcast Announcement Now</button>
                  </form>
                )}

                <div className="space-y-6">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="p-6 sm:p-10 bg-slate-950 rounded-[40px] sm:rounded-[48px] border border-white/5 hover:border-blue-500/20 transition-all group shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl">📢</span>
                      </div>
                      <div className="relative flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 shadow-lg group-hover:bg-blue-600 group-hover:text-white transition-all">📢</div>
                          <div>
                            <h4 className="font-black text-2xl text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{announcement.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${announcement.type === 'IMPORTANT' ? 'bg-red-500/10 text-red-400 border-red-500/20' : announcement.type === 'QUIZ' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : announcement.type === 'EXAM' ? 'bg-purple-500/10 text-purple-400 border-red-500/20' : announcement.type === 'ASSIGNMENT' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {announcement.type}
                              </span>
                              <span className="text-[10px] text-slate-600 font-bold tracking-widest uppercase">Verified Broadcast</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                            {new Date(announcement.created_at || announcement.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-medium whitespace-pre-wrap text-left relative z-10">{announcement.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div className="text-center py-20 text-slate-600 italic font-medium">No announcements posted yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CODE INSPECTION MODAL (FULL SCREEN) --- */}
      {inspectSubmission && (() => {
        const filteredSubs = classSubmissions.filter(sub => selectedAssignmentFilter ? sub.assignment_id === selectedAssignmentFilter : true);
        const currentIndex = filteredSubs.findIndex(s => s.id === inspectSubmission.id);
        const nextSub = filteredSubs[currentIndex + 1];
        const prevSub = filteredSubs[currentIndex - 1];

        const assign = assignments.find(a => a.id === inspectSubmission.assignment_id);
        const assignmentLogs = logs.filter(l => l.student_id === inspectSubmission.student_id && l.assignment_id === inspectSubmission.assignment_id);
        const flagCount = assignmentLogs.length;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-fade-in overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
              onClick={() => setInspectSubmission(null)}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-slate-900 border border-white/10 rounded-[40px] shadow-4xl flex flex-col overflow-hidden animate-slide-up">
              {/* Modal Header */}
              <div className="p-6 sm:p-8 border-b border-white/5 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-3xl shadow-inner">👨‍💻</div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{inspectSubmission.student_name || 'Student Inspection'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{assign?.title || 'Lab Review'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-widest border ${flagCount > 3 ? 'bg-red-500/10 text-red-500 border-red-500/30' : flagCount > 0 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {flagCount > 3 ? `HIGH RISK (${flagCount})` : flagCount > 0 ? `CAUTION (${flagCount})` : 'INTEGRITY OK'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center bg-slate-950 rounded-2xl p-1 border border-white/5 shadow-inner mr-4">
                    <button
                      disabled={!prevSub}
                      onClick={() => setInspectSubmission(prevSub)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!prevSub ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                      ← Previous
                    </button>
                    <span className="text-[10px] text-slate-600 px-2 font-mono">{currentIndex + 1} / {filteredSubs.length}</span>
                    <button
                      disabled={!nextSub}
                      onClick={() => setInspectSubmission(nextSub)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!nextSub ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-300'}`}
                    >
                      Next →
                    </button>
                  </div>
                  <button
                    onClick={() => setInspectSubmission(null)}
                    className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-all font-black text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  {/* Code Block */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Source Code
                      </h4>
                      <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest">{inspectSubmission.language || 'Standard'} Script</span>
                    </div>
                    <div className="bg-slate-950 border border-white/5 rounded-[32px] p-8 shadow-inner overflow-x-auto min-h-[400px]">
                      <pre className="text-sm font-mono text-indigo-400 leading-relaxed tab-size-4">
                        {inspectSubmission.code}
                      </pre>
                    </div>
                  </div>

                  {/* Output Block */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Compilation & Output
                      </h4>
                      <div className="flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                      </div>
                    </div>
                    <div className="bg-[#05070A] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-x-auto min-h-[400px]">
                      <pre className={`text-sm font-mono leading-relaxed whitespace-pre-wrap ${inspectSubmission.output?.includes('ERROR]') ? 'text-red-400' : 'text-emerald-400'} font-medium`}>
                        {inspectSubmission.output || 'No logs generated during execution.'}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TeacherDashboard;