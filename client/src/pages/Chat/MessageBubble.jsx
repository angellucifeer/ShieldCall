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
  seen,
}) {
  return (
    <div
      className={`flex ${
        mine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-3xl px-4 py-3 shadow-md ${
          mine
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-lg"
            : "bg-zinc-800 text-white rounded-bl-lg"
        }`}
      >
        <p className="break-words whitespace-pre-wrap">
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
            <span className="text-xs">
              {seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}