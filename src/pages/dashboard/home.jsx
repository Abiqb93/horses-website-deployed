import React, { useEffect, useState } from "react";

export function Home() {
  const [trackedHorses, setTrackedHorses] = useState([]);
  const [todayNotifications, setTodayNotifications] = useState([]);
  const [upcomingNotifications, setUpcomingNotifications] = useState([]);

  useEffect(() => {
    const fetchTrackedAndRaces = async () => {
      try {
        // 1. Fetch tracked horses
        // const trackedRes = await fetch("http://localhost:8080/api/horseTracking/all");
        const trackedRes = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking/all");

        
        const trackedJson = await trackedRes.json();
        const trackedNames = [...new Set(trackedJson.data.map(h => h.horseName?.toLowerCase().trim()))];

        setTrackedHorses(trackedNames);

        // 2. Fetch race entries
        // const racesRes = await fetch("http://localhost:8080/api/RacesAndEntries");
        const racesRes = await fetch("https://horseracesbackend-production.up.railway.app/api/RacesAndEntries");
        const racesJson = await racesRes.json();
        const raceEntries = racesJson.data || [];

        // 3. Prepare notifications
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayNotifs = [];
        const upcomingNotifs = [];

        for (const entry of raceEntries) {
          const raceHorse = entry.Horse?.toLowerCase().trim();
          const raceTrack = entry.FixtureTrack || entry.Track || "-";
          const raceTime = entry.RaceTime || "-";
          const raceTitle = entry.RaceTitle || "-";

          // Parse FixtureDate like "Wednesday 18  June 2025"
          const dateStr = entry.FixtureDate?.replace(/^\w+\s/, "").trim();
          const raceDate = new Date(Date.parse(dateStr));
          raceDate.setHours(0, 0, 0, 0);

          const dayDiff = Math.floor((raceDate - today) / (1000 * 60 * 60 * 24));

          if (trackedNames.includes(raceHorse)) {
            const message = `<strong>${entry.Horse}</strong> is racing at <em>${raceTrack}</em> <strong>${raceTime}</strong><br/><u>${raceTitle}</u>`;

            if (dayDiff === 0) {
              todayNotifs.push(`🟢 ${message}`);
            } else if (dayDiff > 0) {
              upcomingNotifs.push(`📅 In ${dayDiff} day(s): ${message}`);
            }
          }
        }

        setTodayNotifications(todayNotifs);
        setUpcomingNotifications(upcomingNotifs);
      } catch (err) {
        console.error("Error checking upcoming races:", err);
      }
    };

    fetchTrackedAndRaces();
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏇 My Horses Dashboard</h1>

      {todayNotifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-green-700 mb-2">🔵 Today's Updates</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            {todayNotifications.map((msg, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: msg }} />
            ))}
          </ul>
        </div>
      )}

      {upcomingNotifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">🗓 Upcoming Entries</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            {upcomingNotifications.map((msg, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: msg }} />
            ))}
          </ul>
        </div>
      )}

      {todayNotifications.length === 0 && upcomingNotifications.length === 0 && (
        <p className="text-gray-500 italic">No upcoming races for your tracked horses.</p>
      )}
    </div>
  );
}

export default Home;
