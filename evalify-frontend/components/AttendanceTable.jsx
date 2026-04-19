import React, { useState } from 'react';

const AttendanceTable = ({ attendance, students, classes, showClassColumn = true, onArchiveOld }) => {
    const [isSummaryView, setIsSummaryView] = useState(false);

    const exportToCSV = () => {
        const headers = ["Student Name", "Reg Number", "Class", "Resource", "Timestamp", "Status"];
        const rows = attendance.map(r => {
            const student = students.find(s => s.id === r.student_id);
            const cls = classes.find(c => c.id === r.class_id);
            return [
                student?.name || 'Unknown',
                student?.regNo || 'N/A',
                cls?.name || cls?.code || 'N/A',
                r.material_title,
                new Date(r.timestamp).toLocaleString(),
                "Present"
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getGroupedAttendance = () => {
        const grouped = {};
        attendance.forEach(r => {
            const date = new Date(r.timestamp).toLocaleDateString();
            const key = `${r.student_id}_${date}`;
            if (!grouped[key]) {
                grouped[key] = {
                    ...r,
                    resources: [r.material_title],
                    count: 1,
                    date
                };
            } else {
                if (!grouped[key].resources.includes(r.material_title)) {
                    grouped[key].resources.push(r.material_title);
                }
                grouped[key].count++;
            }
        });
        return Object.values(grouped);
    };

    const displayData = isSummaryView ? getGroupedAttendance() : attendance;

    if (attendance.length === 0) {
        return (
            <div className="py-20 text-center text-slate-500 italic">
                No attendance records found.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center px-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsSummaryView(!isSummaryView)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isSummaryView ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'}`}
                    >
                        {isSummaryView ? 'Show All Access Logs' : 'Daily Summary View'}
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        Export CSV
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onArchiveOld}
                        className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-amber-600/10 text-amber-500 border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all"
                    >
                        Archive {'>'} 30 Days
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-slate-950/50 rounded-3xl border border-white/5">
                <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 border-b border-white/10 font-black uppercase tracking-widest text-[10px] bg-slate-900/50 sticky top-0">
                        <tr>
                            <th className="p-6">Student Name</th>
                            <th className="p-6">Reg Number</th>
                            {showClassColumn && <th className="p-6">Class</th>}
                            <th className="p-6">{isSummaryView ? 'Resources Count' : 'Resource Accessed'}</th>
                            <th className="p-6">{isSummaryView ? 'Date' : 'Access Timestamp'}</th>
                            <th className="p-6 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayData.map(r => {
                            const student = students.find(s => s.id === r.student_id);
                            const cls = classes.find(c => c.id === r.class_id);

                            return (
                                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="p-6 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                                        {student?.name || 'Unknown'}
                                    </td>
                                    <td className="p-6 text-slate-400 font-mono text-xs">
                                        {student?.regNo || 'N/A'}
                                    </td>
                                    {showClassColumn && (
                                        <td className="p-6">
                                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md font-mono text-slate-300 border border-white/10">
                                                {cls?.name || cls?.code || 'N/A'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-6 font-bold text-slate-200">{isSummaryView ? `${r.resources.length} Materials` : r.material_title}</td>
                                    <td className="p-6 text-slate-400 text-xs">
                                        {isSummaryView ? r.date : new Date(r.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-green-400 font-black text-[10px] uppercase bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 shadow-sm shadow-green-500/10 block w-max mx-auto">
                                            Present
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTable;
