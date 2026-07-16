import { useEffect } from "react";

import {
  startHeartbeat,
  setOffline,
} from "../services/presence/presenceService";

export default function usePresence(user) {

  useEffect(() => {

    if (!user) return;

    startHeartbeat(user.id);

    const handleUnload = () => {
      setOffline(user.id);
    };

    window.addEventListener(
      "beforeunload",
      handleUnload
    );

    return () => {

      handleUnload();

      window.removeEventListener(
        "beforeunload",
        handleUnload
      );

    };

  }, [user]);

}