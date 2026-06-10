import { useState } from "react";
import { defaultApiToken, sessionKey } from "../config/reporting";

export default function useStoredSession() {
  const [session, setSessionState] = useState(() => {
    try {
      const storedSession = JSON.parse(localStorage.getItem(sessionKey));

      if (storedSession?.apiToken && (!defaultApiToken || storedSession.apiToken === defaultApiToken)) {
        return storedSession;
      }
    } catch {
      // Require an explicit sign-in when there is no valid stored session.
    }

    return null;
  });

  function setSession(nextSession) {
    setSessionState(nextSession);

    if (nextSession) {
      localStorage.setItem(sessionKey, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(sessionKey);
    }
  }

  return [session, setSession];
}
