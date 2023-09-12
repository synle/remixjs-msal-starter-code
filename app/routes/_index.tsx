import { useState, useEffect } from "react";
import axios from "axios";

import type { SessionData } from "~/utils/backend/Session";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SessionData | undefined>();

  useEffect(() => {
    async function _fetch() {
      try {
        const { data: newProfile } = await axios.get<SessionData>(
          `/api/auth/me`
        );
        setProfile(newProfile);
      } finally {
        setLoading(false);
      }
    }
    _fetch();
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      {profile ? (
        <h2>
          Welcome back, {profile.fullName}! Click here to{" "}
          <a href="/api/auth/logout">log out</a>.
        </h2>
      ) : (
        <h2>
          You are not authenticated, click{" "}
          <a href="/api/auth/login">here to log in</a>.
        </h2>
      )}
    </div>
  );
}
