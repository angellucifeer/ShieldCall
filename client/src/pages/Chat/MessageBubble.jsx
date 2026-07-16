function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  mine,
  text,
  createdAt,
  delivered,
  seen,
}) {
  return (
    <div
      className={`flex mb-2 ${
        mine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[80%]
          sm:max-w-[70%]
          px-4
          py-3
          rounded-3xl
          shadow-md
          transition-all
          ${
            mine
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 rounded-br-md"
              : "bg-zinc-800 rounded-bl-md"
          }
        `}
      >
        <p className="text-white text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {text}
        </p>

        <div
          className={`mt-2 flex items-center gap-1 text-[11px] ${
            mine
              ? "justify-end text-blue-100"
              : "justify-end text-zinc-400"
          }`}
        >
          <span>{formatTime(createdAt)}</span>

          {mine && (
  <span
    className={`text-xs ${
      seen
        ? "text-sky-400"
        : "text-white/80"
    }`}
  >
    {delivered ? "✓✓" : "✓"}
  </span>
)}
        </div>
      </div>
    </div>
  );
}