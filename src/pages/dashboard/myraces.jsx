import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function MyRace() {
  const [raceData, setRaceData] = useState([]);
  const [relatedMap, setRelatedMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const userId = (() => {
          const storedUser = localStorage.getItem("user");
          return storedUser ? JSON.parse(storedUser).userId : "Guest";
        })();
        const resLog = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_selection_log?user=${userId}`);
        const jsonLog = await resLog.json();
        const races = jsonLog.data || [];
        setRaceData(races);

        const sources = [
          { key: "RacesAndEntries", url: "https://horseracesbackend-production.up.railway.app/api/RacesAndEntries" },
          { key: "FranceRaceRecords", url: "https://horseracesbackend-production.up.railway.app/api/FranceRaceRecords" },
          { key: "IrelandRaceRecords", url: "https://horseracesbackend-production.up.railway.app/api/IrelandRaceRecords" },
          { key: "ClosingEntries", url: "https://horseracesbackend-production.up.railway.app/api/ClosingEntries" },
          { key: "DeclarationsTracking", url: "https://horseracesbackend-production.up.railway.app/api/DeclarationsTracking" },
          { key: "EntriesTracking", url: "https://horseracesbackend-production.up.railway.app/api/EntriesTracking" },
        ];
        const results = await Promise.all(sources.map(s => fetch(s.url).then(r => r.json())));

        const matchMap = {};
        results.forEach((json, i) => {
          const key = sources[i].key;
          (json.data || []).forEach(ent => {
            const horseNameRaw = ent.Horse || ent["Horse Name"];
            if (!horseNameRaw) return;
            const horseName = horseNameRaw.toLowerCase().trim();

            const title = ent.RaceTitle || ent.Race || ent.title || "";
            const track = ent.FixtureTrack || ent.Track || ent.Course || ent.Racecourse || ent.track || "";
            const time = ent.RaceTime || ent.Time || ent.time || "";

            const match = { source: key, title, track, time };

            if (!matchMap[horseName]) matchMap[horseName] = [];
            matchMap[horseName].push(match);
          });
        });
        setRelatedMap(matchMap);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch race data or related entries.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleDelete = async id => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await fetch(`https://horseracesbackend-production.up.railway.app/api/race_selection_log/${id}`, { method: "DELETE" });
      setRaceData(d => d.filter(r => r.id !== id));
    } catch (e) {
      alert("Delete failed");
    }
  };

  const renderMatches = race => {
    const horses = JSON.parse(race.allHorses) || [];
    const lines = horses.map(h => {
      const key = h.horseName.toLowerCase().trim();
      const matches = relatedMap[key];
      if (!matches) return null;
      return matches.map((m, idx) => (
        <div key={idx} className="text-xs mb-1">
          • <strong>{h.horseName}</strong> – {m.source} @ {m.track} {m.time} <em>{m.title}</em>
        </div>
      ));
    });
    return lines.flat().length ? lines : <div className="text-xs text-gray-500">—</div>;
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-lg font-bold mb-4">Race Selection Log</h1>
      {isLoading && <div className="italic">Loading data...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!isLoading && !error && raceData.length > 0 && (
        <div className="space-y-4">
          {raceData.map(race => {
            const horses = JSON.parse(race.allHorses).sort(
              (a, b) => a.positionOfficial - b.positionOfficial
            );

            return (
              <div key={race.id} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {/* Column 1: Metadata */}
                <div className="text-sm space-y-1 relative">
                  <button
                    onClick={() => handleDelete(race.id)}
                    className="absolute top-0 right-0 text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                  <div><strong>ID:</strong> {race.id}</div>
                  <div><strong>Date:</strong> {new Date(race.meetingDate).toLocaleDateString()}</div>
                  <div><strong>Title:</strong> {race.raceTitle}</div>
                  <div><strong>Country:</strong> {race.countryCode}</div>
                  <div><strong>Course:</strong> {race.courseName}</div>
                  <div><strong>Surface:</strong> {race.raceSurfaceName}</div>
                </div>

                {/* Column 2: Horses */}
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 mb-2">Horses</div>
                  <ul className="list-disc ml-5 space-y-1 text-xs">
                    {horses.map((h, idx) => (
                      <li key={idx}>
                        {h.positionOfficial}.{" "}
                        <Link
                          to={`/dashboard/horse/${encodeURIComponent(h.horseName.trim())}`}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {h.horseName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Ongoing Activities */}
                <div className="text-sm">
                  <div className="font-semibold text-gray-700 mb-2">Ongoing Activities</div>
                  <div className="space-y-1 text-xs">
                    {renderMatches(race)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && !error && raceData.length === 0 && (
        <div className="text-gray-500 italic">No race data available.</div>
      )}
    </div>
  );
}

export default MyRace;
