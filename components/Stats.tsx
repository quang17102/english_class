interface StatsProps {
  total: number;
  shipping: number;
  done: number;
  cancel: number;
}

export default function Stats({ total, shipping, done, cancel }: StatsProps) {
  const statItems = [
    { 
      label: 'Tổng đơn', 
      value: total, 
      color: 'text-[var(--accent2)]', 
      bg: 'bg-[rgba(124,92,252,0.12)]', 
      border: 'border-[rgba(124,92,252,0.25)]',
      icon: '📦'
    },
    { 
      label: 'Đang giao', 
      value: shipping, 
      color: 'text-[var(--blue)]', 
      bg: 'bg-[rgba(96,165,250,0.12)]', 
      border: 'border-[rgba(96,165,250,0.25)]',
      icon: '🚚'
    },
    { 
      label: 'Hoàn thành', 
      value: done, 
      color: 'text-[var(--green)]', 
      bg: 'bg-[rgba(34,197,94,0.12)]', 
      border: 'border-[rgba(34,197,94,0.25)]',
      icon: '✅'
    },
    { 
      label: 'Đã hủy', 
      value: cancel, 
      color: 'text-[var(--red)]', 
      bg: 'bg-[rgba(248,113,113,0.12)]', 
      border: 'border-[rgba(248,113,113,0.25)]',
      icon: '❌'
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`glass p-3 rounded-[10px] border ${item.border} ${item.bg} transition-all hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[14px] opacity-80">{item.icon}</span>
            <div className={`text-[22px] font-bold ${item.color} leading-none`}>
              {item.value}
            </div>
          </div>
          <div className="text-[10px] text-[var(--text2)] font-medium">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

