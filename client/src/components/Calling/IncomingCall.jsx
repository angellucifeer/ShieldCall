import { FiPhone, FiPhoneOff } from "react-icons/fi";

export default function IncomingCall({
  call,
  onAnswer,
  onDecline,
}) {

  console.log("IncomingCall rendered:", call?.id);

  if (!call) return null;

  return (

    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center">

      <div className="text-center">

        <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-5xl font-bold mx-auto">

          📞

        </div>

        <h1 className="text-3xl font-bold mt-8">

          Incoming Call

        </h1>

        <p className="text-zinc-400 mt-2">

          {call.call_type === "video"
            ? "Video Call"
            : "Voice Call"}

        </p>

        <div className="flex justify-center gap-8 mt-10">

          <button

            onClick={onDecline}

            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center"

          >

            <FiPhoneOff size={28}/>

          </button>

          <button
  onClick={onAnswer}
  className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center"
>
  <FiPhone size={28} />
</button>

        </div>

      </div>

    </div>

  );

}