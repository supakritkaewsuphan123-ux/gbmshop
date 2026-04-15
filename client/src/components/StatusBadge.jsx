const STATUS_MAP = {
  pending_payment: { label: 'รอชำระเงิน', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  waiting_approval: { label: 'รอการอนุมัติ', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  meeting_scheduled: { label: 'นัดรับแล้ว', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  paid: { label: 'ชำระเงินสำเร็จ', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  pending_delivery: { label: 'รอจัดส่ง (COD)', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  pending: { label: 'รอดำเนินการ', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  processing: { label: '⏳ กำลังเตรียมของ', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  completed: { label: '✅ ส่งสำเร็จ', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status] || { label: status?.toUpperCase() ?? '-', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  return (
    <span className={`badge border text-xs ${info.color}`}>
      {info.label}
    </span>
  );
}

export { STATUS_MAP };
