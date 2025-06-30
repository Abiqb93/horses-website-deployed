import React, { useEffect, useState } from "react";

export function Home() {
  const [trackedHorses, setTrackedHorses] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackedAndRaces = async () => {
      try {
        const trackedRes = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking/all");
        // const trackedRes = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking/all");
        const trackedJson = await trackedRes.json();
        const trackedNames = [...new Set(trackedJson.data.map(h => h.horseName?.toLowerCase().trim()))];
        setTrackedHorses(trackedNames);

        const today = new Date(); today.setHours(0, 0, 0, 0);

        const grouped = {
          RaceUpdates: { today: [], upcoming: [] },
          ClosingEntries: { today: [], upcoming: [] },
          DeclarationsTracking: { today: [], upcoming: [] },
          EntriesTracking: { today: [], upcoming: [] },
        };

        const sources = [
          { label: "RacesAndEntries", url: "https://horseracesbackend-production.up.railway.app/api/RacesAndEntries" },
          { label: "FranceRaceRecords", url: "https://horseracesbackend-production.up.railway.app/api/FranceRaceRecords" },
          { label: "IrelandRaceRecords", url: "https://horseracesbackend-production.up.railway.app/api/IrelandRaceRecords" },
          { label: "ClosingEntries", url: "https://horseracesbackend-production.up.railway.app/api/ClosingEntries" },
          { label: "DeclarationsTracking", url: "https://horseracesbackend-production.up.railway.app/api/DeclarationsTracking" },
          { label: "EntriesTracking", url: "https://horseracesbackend-production.up.railway.app/api/EntriesTracking" },
        ];

        const fetches = await Promise.all(sources.map(src => fetch(src.url).then(r => r.json())));
        for (let i = 0; i < fetches.length; i++) {
          const label = sources[i].label;
          const data = fetches[i].data || [];
          const isMergedGroup = ["RacesAndEntries", "FranceRaceRecords", "IrelandRaceRecords"].includes(label);
          const targetGroup = isMergedGroup ? "RaceUpdates" : label;

          for (const entry of data) {
            const horseName = (entry.Horse || entry["Horse Name"])?.toLowerCase().trim();
            if (!trackedNames.includes(horseName)) continue;

            const raceTrack = entry.FixtureTrack || entry.Track || entry.Course || entry.Racecourse || entry.track || "-";
            const raceTime = entry.RaceTime || entry.Time || entry.time || "-";
            const raceTitle = entry.RaceTitle || entry.title || entry.Race || "-";

            let dateStr = entry.FixtureDate || entry.Date || entry.date;
            let raceDate;
            if (label === "FranceRaceRecords") {
              const [dd, mm, yyyy] = dateStr.split("/");
              raceDate = new Date(`${yyyy}-${mm}-${dd}`);
            } else if (label === "IrelandRaceRecords") {
              dateStr = dateStr.replace(/^\w+,\s*/, "").replace(/(\d+)(st|nd|rd|th)/, "$1");
              raceDate = new Date(dateStr);
            } else {
              raceDate = new Date(Date.parse(dateStr));
            }
            if (isNaN(raceDate)) continue;
            raceDate.setHours(0, 0, 0, 0);

            const dayDiff = Math.floor((raceDate - today) / (1000 * 60 * 60 * 24));
            const message = `<strong>${entry.Horse || entry["Horse Name"]}</strong> is racing at <em>${raceTrack}</em> <strong>${raceTime}</strong><br/><u>${raceTitle}</u>`;

            if (dayDiff === 0) {
              grouped[targetGroup].today.push(`🟢 ${message}`);
            } else if (dayDiff > 0) {
              grouped[targetGroup].upcoming.push(`📅 In ${dayDiff} day(s): ${message}`);
            }
          }
        }

        setGroupedNotifications(grouped);
      } catch (err) {
        console.error("Error checking upcoming races:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedAndRaces();
  }, []);

  const renderGroupCard = (label, todayList, upcomingList) => {
    const hasContent = todayList.length > 0 || upcomingList.length > 0;
    if (!hasContent) return null;

    return (
      <div className="bg-white border rounded-lg shadow p-4" key={label}>
        <h2 className="text-md font-bold text-gray-700 mb-2">{label}</h2>

        {todayList.length > 0 && (
          <>
            <h3 className="text-green-700 font-semibold text-sm mb-1">Today</h3>
            <ul className="list-disc pl-4 text-sm text-gray-800 mb-3 space-y-1">
              {todayList.map((msg, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: msg }} />
              ))}
            </ul>
          </>
        )}

        {upcomingList.length > 0 && (
          <>
            <h3 className="text-blue-700 font-semibold text-sm mb-1">Upcoming</h3>
            <ul className="list-disc pl-4 text-sm text-gray-800 space-y-1">
              {upcomingList.map((msg, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: msg }} />
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };

  const hasAny = Object.values(groupedNotifications).some(g => g.today.length || g.upcoming.length);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🏇 My Horses Dashboard</h1>

      {loading ? (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Loading tracked horse updates...</span>
        </div>
      ) : hasAny ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(groupedNotifications).map(([label, data]) =>
            renderGroupCard(label, data.today, data.upcoming)
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">No upcoming races for your tracked horses.</p>
      )}
    </div>
  );
}

export default Home;
