import React, { useEffect, useState } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link } from "react-router-dom";

export function MyHorses() {
  const [lastRaces, setLastRaces] = useState([]);
  const [todayRaces, setTodayRaces] = useState([]);
  const [upcomingRaces, setUpcomingRaces] = useState([]);
  const [error, setError] = useState(null);
  const [trackingStates, setTrackingStates] = useState({});
  const [allTrackedHorses, setAllTrackedHorses] = useState([]);
  const [shareSearch, setShareSearch] = useState("");
  const [shareResults, setShareResults] = useState([]);
  const [selectedShareUser, setSelectedShareUser] = useState(null);
  

  useEffect(() => {
    const fetchTrackedAndRaces = async () => {
      try {
        const userId = (() => {
          const storedUser = localStorage.getItem("user");
          return storedUser ? JSON.parse(storedUser).userId : "Guest";
        })();
        const trackedRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${userId}`);
        const trackedJson = await trackedRes.json();
        const trackedData = trackedJson.data || [];
        setAllTrackedHorses(trackedData);
        const trackedMap = {};

        for (const h of trackedData) {
          const name = h.horseName?.toLowerCase().trim();
          if (!name) continue;
          if (!trackedMap[name]) trackedMap[name] = [];
          trackedMap[name].push(h);
        }

        const trackedNames = Object.keys(trackedMap);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const past = [], todayList = [], future = [];
        const newTrackingStates = {};

        const processEntries = (entries, getHorse, getDate, getTrack, getTime, getTitle, sourceLabel) => {
          for (const entry of entries) {
            const rawHorse = getHorse(entry)?.toLowerCase().trim();
            if (!trackedNames.includes(rawHorse)) continue;

            let dateStr = getDate(entry);
            let raceDate;

            if (sourceLabel === "FranceRaceRecords") {
              const [dd, mm, yyyy] = dateStr.split("/");
              raceDate = new Date(`${yyyy}-${mm}-${dd}`);
            } else if (sourceLabel === "IrelandRaceRecords") {
              dateStr = dateStr.replace(/^\w+,\s*/, "").replace(/(\d+)(st|nd|rd|th)/, "$1");
              raceDate = new Date(dateStr);
            } else {
              raceDate = new Date(Date.parse(dateStr));
            }

            if (isNaN(raceDate)) continue;

            raceDate.setHours(0, 0, 0, 0);
            const dayDiff = Math.floor((raceDate - today) / (1000 * 60 * 60 * 24));

            const formatted = {
              horse: getHorse(entry),
              horseKey: rawHorse,
              raceTrack: getTrack(entry),
              raceTime: getTime(entry),
              raceTitle: getTitle(entry),
              raceDate: raceDate.toDateString(),
              daysUntilRace: dayDiff,
              source: sourceLabel,
            };

            if (!newTrackingStates[rawHorse]) {
              newTrackingStates[rawHorse] = {
                isTracked: true,
                noteInput: "",
                showNotes: false,
                notes: trackedMap[rawHorse],
              };
            }

            if (dayDiff < 0) past.push(formatted);
            else if (dayDiff === 0) todayList.push(formatted);
            else future.push(formatted);
          }
        };

        const [
          racesRes,
          franceRes,
          irelandRes,
          closingRes,
          declRes,
          entriesRes
        ] = await Promise.all([
          fetch("https://horseracesbackend-production.up.railway.app/api/RacesAndEntries"),
          fetch("https://horseracesbackend-production.up.railway.app/api/FranceRaceRecords"),
          fetch("https://horseracesbackend-production.up.railway.app/api/IrelandRaceRecords"),
          fetch("https://horseracesbackend-production.up.railway.app/api/ClosingEntries"),
          fetch("https://horseracesbackend-production.up.railway.app/api/DeclarationsTracking"),
          fetch("https://horseracesbackend-production.up.railway.app/api/EntriesTracking"),
        ]);

        const [
          racesJson,
          franceJson,
          irelandJson,
          closingJson,
          declJson,
          entriesJson
        ] = await Promise.all([
          racesRes.json(),
          franceRes.json(),
          irelandRes.json(),
          closingRes.json(),
          declRes.json(),
          entriesRes.json()
        ]);

        processEntries(racesJson.data || [], e => e.Horse, e => e.FixtureDate || e.Date, e => e.FixtureTrack || e.Track, e => e.RaceTime || "-", e => e.RaceTitle || "-", "RacesAndEntries");
        processEntries(franceJson.data || [], e => e.Horse, e => e.Date, e => e.Racecourse, e => e.Time, e => e.Race, "FranceRaceRecords");
        processEntries(irelandJson.data || [], e => e["Horse Name"], e => e.Date, e => e.Course, e => e["Race Time"], e => e["Race Title"], "IrelandRaceRecords");
        processEntries(closingJson.data || [], e => e.Horse, e => e.date, e => e.track, e => e.time, e => e.title, "ClosingEntries");
        processEntries(declJson.data || [], e => e.Horse, e => e.Date, e => e.Track, e => e.RaceTime, e => e.RaceTitle, "DeclarationsTracking");
        processEntries(entriesJson.data || [], e => e.Horse, e => e.Date, e => e.Track, e => e.RaceTime, e => e.RaceTitle, "EntriesTracking");

        setLastRaces(past);
        setTodayRaces(todayList);
        setUpcomingRaces(future);
        setTrackingStates(newTrackingStates);
      } catch (err) {
        console.error("Error loading tracked races:", err);
        setError("Failed to load tracked horses or race data.");
      }
    };

    fetchTrackedAndRaces();
  }, []);


  const handleNoteChange = (horseKey, value) => {
    setTrackingStates(prev => ({ ...prev, [horseKey]: { ...prev[horseKey], noteInput: value } }));
  };

  const handleTrackNote = async (horseName, horseKey) => {
    const note = trackingStates[horseKey]?.noteInput || "";
    const userId = (() => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    })();

    try {
      await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseName,
          note,
          trackingDate: new Date().toISOString(),
          user: userId
        }),
      });

      const refreshed = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}?user=${userId}`);
      const refreshedJson = await refreshed.json();
      setTrackingStates(prev => ({
        ...prev,
        [horseKey]: {
          ...prev[horseKey],
          isTracked: true,
          noteInput: "",
          notes: refreshedJson.data || [],
        }
      }));
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };


  const handleStopTracking = async (horseName, horseKey) => {
    const userId = (() => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    })();
    if (!window.confirm(`Stop tracking ${horseName}?`)) return;

    await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}?user=${userId}`, {
      method: "DELETE"
    });

    setTrackingStates(prev => ({
      ...prev,
      [horseKey]: { isTracked: false, noteInput: "", showNotes: false, notes: [] }
    }));
  };


  const handleUserSearch = async (query) => {
    setShareSearch(query);
    if (!query.trim()) {
      setShareResults([]);
      return;
    }

    try {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/userSearch?q=${encodeURIComponent(query)}`);
      
      // Optional: safer parse with fallback in case server returns HTML
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setShareResults(json.results || []);
      } catch (err) {
        console.error("Search error: Not valid JSON. Response:", text);
        setShareResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setShareResults([]);
    }
  };

  const handleShareUserSelect = async (user) => {
    const ownerUser = (() => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : null;
    })();

    if (!ownerUser) {
      alert("You must be logged in to share your horses.");
      return;
    }

    try {
      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horse_tracking_shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_user_id: ownerUser,
          shared_with_user_id: user.user_id,
        }),
      });

      const json = await res.json();

      if (res.status === 201) {
        alert(`✅ Tracking shared with ${user.name} (${user.user_id})`);
      } else if (res.status === 409) {
        alert(`⚠️ You have already shared tracking with ${user.name}`);
      } else {
        alert(`❌ Failed to share: ${json.message}`);
      }

      setSelectedShareUser(user);
      setShareSearch(`${user.name} (${user.user_id})`);
      setShareResults([]);
    } catch (err) {
      console.error("Error sharing tracking:", err);
      alert("An error occurred while sharing.");
    }
  };




  const renderTrackingControls = (horse, horseKey) => {
    const state = trackingStates[horseKey] || {};
    return (
      <div className="text-[11px] w-52">
        <div className="flex items-center justify-between mb-1">
          <input
            type="text"
            value={state.noteInput}
            onChange={(e) => handleNoteChange(horseKey, e.target.value)}
            placeholder="Note"
            className="px-1 py-0.5 rounded w-2/3 text-[11px] bg-gray-50"
          />
          <button
            onClick={() => toggleShowNotes(horseKey)}
            className="text-gray-600 hover:underline text-[11px]"
          >
            View Notes
          </button>
        </div>

        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={() => handleTrackNote(horse, horseKey)}
            className="text-blue-600 hover:underline text-[11px]"
          >
            Add Note
          </button>
          <button
            onClick={() => handleStopTracking(horse, horseKey)}
            className="text-red-500 hover:underline text-[11px]"
          >
            ✖
          </button>
        </div>

        {state.showNotes && (
          <div className="border-t pt-1 text-[10px] text-gray-700 max-h-24 overflow-y-auto">
            {state.notes?.length ? state.notes.map((n, i) => (
              <div key={i} className="mb-1 border-b pb-1">
                <div>📝 {n.note}</div>
                <div>{new Date(n.trackingDate).toLocaleString()}</div>
              </div>
            )) : <div className="italic text-gray-400">No notes</div>}
          </div>
        )}
      </div>
    );
  };

  const renderTable = (title, races, color) => (
    <Card className="bg-white text-black mb-6">
      <CardBody className="overflow-x-auto p-4">
        <Typography variant="h6" className={`mb-2 text-${color}-700 font-semibold text-sm`}>{title}</Typography>
        <table className="min-w-full text-[11px] table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 text-left">Tracking</th>
              <th className="px-2 py-2 text-left">Horse</th>
              <th className="px-2 py-2 text-left">Category</th>   {/* ✅ New column */}
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">Time</th>
              <th className="px-2 py-2 text-left">Track</th>
              <th className="px-2 py-2 text-left">Title</th>
              <th className="px-2 py-2 text-left">Source</th>
              {title === "Upcoming Races" && <th className="px-2 py-2 text-center">In</th>}
            </tr>
          </thead>
          <tbody>
            {races.map((race, idx) => {
              const category = trackingStates[race.horseKey]?.notes?.[0]?.TrackingType || "-";
              return (
                <tr key={idx} className="border-b border-gray-200 align-top">
                  <td className="px-2 py-2">{renderTrackingControls(race.horse, race.horseKey)}</td>
                  <td className="px-2 py-2 text-blue-700 underline hover:text-blue-900">
                    <Link to={`/dashboard/horse/${encodeURIComponent(race.horse.trim())}`}>
                      {race.horse}
                    </Link>
                  </td>
                  <td className="px-2 py-2">{category}</td> {/* ✅ FIXED: inside map */}
                  <td className="px-2 py-2">{race.raceDate}</td>
                  <td className="px-2 py-2">{race.raceTime}</td>
                  <td className="px-2 py-2">{race.raceTrack}</td>
                  <td className="px-2 py-2 text-gray-900">{race.raceTitle}</td>
                  <td className="px-2 py-2">{race.source}</td>
                  {title === "Upcoming Races" && <td className="px-2 py-2 text-center">{race.daysUntilRace}d</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );

  if (error) {
    return <Typography color="red" className="text-sm p-4">{error}</Typography>;
  }

    const renderTrackedHorsesTable = () => {  
    const [showCount, setShowCount] = useState(5);
    const [expandedHorse, setExpandedHorse] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState("All");

    if (!allTrackedHorses.length) return null;

    const grouped = {};
    allTrackedHorses.forEach((item) => {
      const name = item.horseName?.trim();
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(item);
    });

    const uniqueCategories = ["All", ...new Set(allTrackedHorses.map(h => h.TrackingType).filter(Boolean))];

    const rows = Object.entries(grouped)
      .map(([name, entries]) => {
        const first = entries[0];
        return {
          name,
          category: first.TrackingType || "-",
          started: first.trackingDate ? new Date(first.trackingDate).toLocaleDateString() : "-",
          notes: entries,
        };
      })
      .filter(row => categoryFilter === "All" || row.category === categoryFilter);

    return (
      <Card className="bg-white text-black mb-6">
        <CardBody className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Typography variant="h6" className="text-blue-700 font-semibold text-sm">
              Tracked Horses Overview
            </Typography>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-[11px] border px-1 py-0.5 rounded bg-gray-50"
              >
                {uniqueCategories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>

              {/* User Search Box */}
              <div className="relative text-[11px]">
                <input
                  type="text"
                  placeholder="Share with user..."
                  value={shareSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="border px-1 py-0.5 rounded bg-gray-50 w-40"
                />
                {shareResults.length > 0 && (
                  <ul className="absolute bg-white border w-40 mt-1 max-h-40 overflow-y-auto z-50 shadow-md rounded">
                    {shareResults.map((u) => (
                      <li
                        key={u.user_id}
                        onClick={() => handleShareUserSelect(u)}
                        className="px-2 py-1 hover:bg-blue-100 cursor-pointer text-[11px]"
                      >
                        {u.name} ({u.user_id})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>


          <table className="min-w-full text-[11px] table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left">Horse</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-left">Tracking Since</th>
                <th className="px-2 py-1 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, showCount).map((t, idx) => (
                <React.Fragment key={idx}>
                  <tr className="border-b border-gray-200 align-top">
                    <td className="px-2 py-1 text-blue-700 underline hover:text-blue-900">
                      <Link to={`/dashboard/horse/${encodeURIComponent(t.name)}`}>
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-2 py-1">{t.category}</td>
                    <td className="px-2 py-1">{t.started}</td>
                    <td className="px-2 py-1">
                      {t.notes.length}
                      <button
                        className="ml-1 text-gray-500 hover:text-gray-800"
                        onClick={() => setExpandedHorse(expandedHorse === t.name ? null : t.name)}
                      >
                        📝
                      </button>
                    </td>
                  </tr>
                  {expandedHorse === t.name && (
                    <tr>
                      <td colSpan="4" className="px-2 py-1 text-[10px] bg-gray-50">
                        {t.notes.map((n, i) => (
                          <div key={i} className="border-b py-1">
                            <div><span className="text-gray-600">📝</span> {n.note}</div>
                            <div className="text-gray-500">{new Date(n.trackingDate).toLocaleString()}</div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {rows.length > showCount && (
            <div className="flex justify-center mt-2">
              <button
                className="text-blue-600 text-[11px] hover:underline"
                onClick={() => setShowCount(prev => prev + 5)}
              >
                Show more...
              </button>
            </div>
          )}
        </CardBody>
      </Card>
    );
    };



  return (
    <div className="p-4">
      <Typography variant="h5" className="text-gray-800 font-bold mb-4">📋 Tracked Horses</Typography>
      {renderTrackedHorsesTable()}
      {lastRaces.length > 0 && renderTable("Last Races", lastRaces, "red")}
      {todayRaces.length > 0 && renderTable("Today’s Races", todayRaces, "green")}
      {upcomingRaces.length > 0 && renderTable("Upcoming Races", upcomingRaces, "blue")}
      {lastRaces.length === 0 && todayRaces.length === 0 && upcomingRaces.length === 0 && (
          <>
            {error ? (
              <Typography color="red" className="text-sm p-4">{error}</Typography>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Loading tracked horse races...</span>
              </div>
            )}
          </>
        )}

    </div>
  );
}

export default MyHorses;
