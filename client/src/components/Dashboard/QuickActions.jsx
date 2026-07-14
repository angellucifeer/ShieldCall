import { FiMessageCircle, FiPhone, FiVideo } from "react-icons/fi";

export default function QuickActions() {
  const actions = [
    {
      title: "Chat",
      icon: <FiMessageCircle size={28} />,
    },
    {
      title: "Voice Call",
      icon: <FiPhone size={28} />,
    },
    {
      title: "Video Call",
      icon: <FiVideo size={28} />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {actions.map((action) => (
        <button
          key={action.title}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800 transition"
        >
          <div className="flex flex-col items-center gap-3">
            {action.icon}

            <span>{action.title}</span>
          </div>
        </button>
      ))}
    </div>
  );
}