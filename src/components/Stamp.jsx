export default function Stamp({ status, animate = false }) {
  // status: 'acknowledged' | 'pending' | 'overdue' | 'late'
  const config = {
    acknowledged: { text: "Acknowledged", cls: "stamp-green" },
    late: { text: "Acknowledged — Late", cls: "stamp-red" },
    pending: { text: "Pending", cls: "stamp-amber" },
    overdue: { text: "Overdue", cls: "stamp-red" },
  }[status];

  return (
    <span className={`stamp ${config.cls} ${animate ? "stamp-animate" : ""}`}>
      {config.text}
    </span>
  );
}
