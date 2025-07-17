import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function MyOwners() {
  const [ownerData, setOwnerData] = useState([]);
  const [relatedMap, setRelatedMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const userId = (() => {
          const storedUser = localStorage.getItem("user");
          return storedUser ? JSON.parse(storedUser).userId : "Guest";
        })();

        const resOwners = await fetch(`https://horseracesbackend-production.up.railway.app/api/owner_tracking?user=${userId}`);
        const jsonOwners = await resOwners.json();
        const owners = jsonOwners.data || [];

        const ownerToHorseMap = {};
        const allHorseNames = new Set();

        for (const owner of owners) {
          const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/owner?ownerFullName=${encodeURIComponent(owner.ownerFullName)}`);
          const json = await response.json();
          const horses = json.data || [];

          const names = [];
          horses.forEach(h => {
            const cleanName = h.horseName?.toLowerCase().trim();
            if (cleanName) {
              names.push(h.horseName);
              allHorseNames.add(cleanName);
            }
          });

          ownerToHorseMap[owner.ownerFullName] = [...new Set(names)];
        }

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

            if (!allHorseNames.has(horseName)) return;

            const title = ent.RaceTitle || ent.Race || ent.title || "";
            const track = ent.FixtureTrack || ent.Track || ent.Course || ent.Racecourse || ent.track || "";
            const time = ent.RaceTime || ent.Time || ent.time || "";

            const match = {
              source: key,
              title,
              track,
              time,
              horseName: horseNameRaw,
              dateRaw: ent.FixtureDate || ent.meetingDate || ent.MeetingDate || ent.Date || ent.date || ent.raceDate || null,
              timeRaw: ent.RaceTime || ent.Time || ent.time || ent.raceTime || "",
            };

            if (!matchMap[horseName]) matchMap[horseName] = [];
            matchMap[horseName].push(match);
          });
        });

        const enrichedOwners = owners.map(o => ({
          ...o,
          horseList: ownerToHorseMap[o.ownerFullName] || [],
        }));

        setOwnerData(enrichedOwners);
        setRelatedMap(matchMap);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch owner data or related entries.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleDelete = async id => {
    if (!window.confirm("Delete this owner tracking entry?")) return;
    try {
      await fetch(`https://horseracesbackend-production.up.railway.app/api/owner_tracking/${id}`, { method: "DELETE" });
      setOwnerData(d => d.filter(r => r.id !== id));
    } catch (e) {
      alert("Delete failed");
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-lg font-bold mb-4">My Owner Tracking</h1>
      {isLoading && <div className="italic">Loading data...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!isLoading && !error && ownerData.length > 0 && (
        <div className="space-y-6">
          {ownerData.map((owner) => {
            const horses = owner.horseList || [];
            const visibleHorses = horses.slice(0, visibleCount);

            return (
              <div key={owner.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between text-sm mb-3">
                  <div>
                    <div><strong>Owner:</strong> {owner.ownerFullName}</div>
                    <div><strong>Tracked on:</strong> {new Date(owner.created_at).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(owner.id)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Horse List */}
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">Horses</div>
                    <ul className="text-xs list-disc ml-5 space-y-1">
                      {visibleHorses.map((horse, idx) => (
                        <li key={idx}>
                          <Link
                            to={`/dashboard/horse/${encodeURIComponent(horse)}`}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {horse}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {horses.length > visibleCount && (
                      <button
                        onClick={() => setVisibleCount(v => v + 5)}
                        className="text-xs text-blue-600 mt-2 hover:underline"
                      >
                        Show more
                      </button>
                    )}
                  </div>

                  {/* Upcoming Runners */}
                  <div>
                    <div className="font-semibold text-gray-700 mb-1">Upcoming Runners</div>
                    <div className="text-xs space-y-2">
                      {visibleHorses.map(horseName => {
                        const key = horseName.toLowerCase();
                        const matches = relatedMap[key] || [];
                        const sorted = matches
                          .slice()
                          .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0));

                        return (
                          <div key={horseName}>
                            <strong className="block text-gray-800">{horseName.toUpperCase()}</strong>
                            {sorted.length === 0 ? (
                              <span className="text-gray-400">No activities</span>
                            ) : (
                              <ul className="ml-3 list-disc">
                                {sorted.map((m, idx) => (
                                  <li key={idx}>
                                    {m.source} @ {m.track} {m.time}{" "}
                                    <em>{m.title}</em>{" "}
                                    ({m.dateRaw || "Unknown date"} {m.timeRaw})
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && !error && ownerData.length === 0 && (
        <div className="text-gray-500 italic">No owner data available.</div>
      )}
    </div>
  );
}

export default MyOwners;
