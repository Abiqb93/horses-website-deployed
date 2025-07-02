import React, { useEffect, useState } from "react";

const BASE_PATH = "/horses-website-deployed";

export function Home() {
  const [trackedHorses, setTrackedHorses] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackedAndRaces = async () => {
      try {
        const trackedRes = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking/all");
        const trackedJson = await trackedRes.json();
        const trackedNames = [...new Set(trackedJson.data.map(h => h.horseName?.toLowerCase().trim()))];
        setTrackedHorses(trackedNames);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
          const url = sources[i].url;
          const data = fetches[i].data || [];
          const isMergedGroup = ["RacesAndEntries", "FranceRaceRecords", "IrelandRaceRecords"].includes(label);
          const targetGroup = isMergedGroup ? "RaceUpdates" : label;

          for (const entry of data) {
            const rawHorseName = entry.Horse || entry["Horse Name"];
            const horseName = rawHorseName?.toLowerCase().trim();
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
            const encodedHorseName = encodeURIComponent(rawHorseName?.trim() || "");
            const encodedUrl = encodeURIComponent(url);
            const encodedRaceTitle = encodeURIComponent(raceTitle);

            const message = `
              <div class="text-sm leading-snug">
                <a href="${BASE_PATH}/dashboard/horse/${encodedHorseName}" class="text-blue-600 font-medium hover:underline">
                  ${rawHorseName}
                </a>
                at <span class="italic text-gray-600">${raceTrack}</span> <strong>${raceTime}</strong><br/>
                <a href="${BASE_PATH}/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}" class="text-indigo-700 font-medium hover:underline">
                  ${raceTitle}
                </a>
              </div>
            `;

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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3" key={label}>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">{label}</h2>

        {todayList.length > 0 && (
          <div>
            <h3 className="text-green-700 text-sm font-semibold">Today</h3>
            <ul className="space-y-1 mt-1">
              {todayList.map((msg, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: msg }} className="pl-2 border-l-4 border-green-300" />
              ))}
            </ul>
          </div>
        )}

        {upcomingList.length > 0 && (
          <div>
            <h3 className="text-blue-700 text-sm font-semibold">Upcoming</h3>
            <ul className="space-y-1 mt-1">
              {upcomingList.map((msg, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: msg }} className="pl-2 border-l-4 border-blue-200" />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const hasAny = Object.values(groupedNotifications).some(g => g.today.length || g.upcoming.length);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">🏇 My Horses Dashboard</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Loading tracked horse updates...</span>
        </div>
      ) : hasAny ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(groupedNotifications).map(([label, data]) => {
            const formattedLabel = label
              .replace(/([a-z])([A-Z])/g, '$1 $2') // adds space before capital letters
              .replace(/^./, str => str.toUpperCase()); // capitalize first letter

            return renderGroupCard(formattedLabel, data.today, data.upcoming);
          })}
        </div>
      ) : (
        <p className="text-gray-500 italic">No upcoming races for your tracked horses.</p>
      )}
    </div>
  );
}

export default Home;
