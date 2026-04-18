const STATUS_MAP = {
  pending_payment: { label: 'รอชำระเงิน', color: 'bg-slate-50 text-slate-400 border-slate-100' },
  waiting_approval: { label: 'รอการอนุมัติ', color: 'bg-slate-100 text-slate-600 border-slate-200 font-black' },
  meeting_scheduled: { label: 'นัดรับแล้ว', color: 'bg-slate-900 text-white border-transparent' },
  paid: { label: 'ชำระเงินสำเร็จ', color: 'bg-slate-900 text-white border-transparent shadow-glow-sm' },
  rejected: { label: 'ถูกปฏิเสธ', color: 'bg-white text-red-500 border-red-500 shadow-sm' },
  pending_delivery: { label: 'รอจัดส่ง (COD)', color: 'bg-slate-50 text-slate-900 border-slate-900' },
  pending: { label: 'รอดำเนินการ', color: 'bg-slate-50 text-slate-400 border-slate-100' },
  processing: { label: 'เตรียมของ', color: 'bg-slate-900 text-white border-transparent' },
  completed: { label: 'สำเร็จแล้ว', color: 'bg-slate-900 text-white border-transparent' },
};

export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status?.toUpperCase() ?? '-', color: 'bg-slate-50 text-slate-300 border-slate-100' };
  return (
    <span className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${info.color}`}>
      {info.label}
    </span>
  );
}

export { STATUS_MAP };
