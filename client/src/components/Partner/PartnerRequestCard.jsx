export default function PartnerRequestCard({
  request,
  onAccept,
  onReject,
}) {
  return (
    <div className="bg-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      {/* Sender Info */}
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-white truncate">
          {request.sender.display_name}
        </h3>

        <p className="text-zinc-400 text-sm truncate">
          {request.sender.email}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={() => onAccept(request)}
          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg font-medium transition"
        >
          Accept
        </button>

        <button
          onClick={() => onReject(request)}
          className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg font-medium transition"
        >
          Reject
        </button>
      </div>

    </div>
  );
}   