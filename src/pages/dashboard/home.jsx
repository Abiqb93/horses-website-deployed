import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Home() {
  const [trackedHorses, setTrackedHorses] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharedWithMeUsers, setSharedWithMeUsers] = useState([]);
  const [selectedSharedUser, setSelectedSharedUser] = useState(null);

  const [reviewed_results, setreviewed_results] = useState(new Set());

  useEffect(() => {
    const fetchReviewed = async () => {
      const storedUser = localStorage.getItem("user");
      const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";

      try {
        const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/reviewed_results?user_id=${encodeURIComponent(userId)}`);
        const json = await res.json();

        const reviewedKeys = json.data.map(r => {
          const title = r.race_title.trim().toLowerCase();
          const name = r.horse_name.trim().toLowerCase();
          return `${name}-${title}`;
        });

        setreviewed_results(new Set(reviewedKeys));

      } catch (err) {
        console.error("Error fetching reviewed results:", err);
      }
    };

    fetchReviewed();
  }, []);

  useEffect(() => {
    const fetchSharedUsers = async () => {
      const storedUser = localStorage.getItem("user");
      const currentUserId = storedUser ? JSON.parse(storedUser).userId : "Guest";

      try {
        const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horse_tracking_shares");
        const json = await res.json();
        const sharedWithMe = json.data.filter(r => r.shared_with_user_id === currentUserId);
        setSharedWithMeUsers(sharedWithMe);
      } catch (err) {
        console.error("Error fetching shared users:", err);
      }
    };

    fetchSharedUsers();
  }, []);

  const markAsReviewed = async (horseName, raceTitle, date) => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";

    const cleanDate = date; // ✅ already correct from res.date
    const key = `${horseName.trim().toLowerCase()}-${raceTitle.trim().toLowerCase()}`;

    setreviewed_results(prev => new Set(prev).add(key));

    await fetch("https://horseracesbackend-production.up.railway.app/api/reviewed_results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        horse_name: horseName,
        race_title: raceTitle,
        race_date: cleanDate,
      }),
    });
  };




  useEffect(() => {
    const fetchTrackedAndRaces = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const loggedInUserId = storedUser ? JSON.parse(storedUser).userId : "Guest";

        const effectiveUserId = selectedSharedUser || loggedInUserId;

        const trackedRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${encodeURIComponent(effectiveUserId)}`);
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

            const notification = {
              rawHorseName,
              encodedHorseName,
              raceTrack,
              raceTime,
              raceTitle,
              encodedUrl,
              encodedRaceTitle,
              dayDiff,
              raceKey: `${rawHorseName}-${raceTitle}-${dateStr}`
            };

            if (dayDiff === 0) {
              grouped[targetGroup].today.push(notification);
            } else if (dayDiff > 0) {
              grouped[targetGroup].upcoming.push(notification);
            }
          }
        }

        // Fetch recent results from APIData_Table2
        const resultDates = [0, 1, 2].map(offset => {
          const d = new Date();
          d.setDate(d.getDate() - offset);
          return d.toISOString().split("T")[0];
        });

        const resultsFetches = await Promise.all(
          resultDates.map(date =>
            fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2?meetingDate=${date}`)
              .then(res => res.json())
              .then(json => ({ date, records: json.data || [] }))
          )
        );

        const filteredResults = [];

        for (const { date: meetingDate, records } of resultsFetches) {
          for (const record of records) {
            const horseName = record.horseName?.toLowerCase().trim();
            if (trackedNames.includes(horseName)) {
              const localDate = new Date(record.meetingDate);
              const yyyy = localDate.getFullYear();
              const mm = String(localDate.getMonth() + 1).padStart(2, '0');
              const dd = String(localDate.getDate()).padStart(2, '0');
              const formattedDate = `${yyyy}-${mm}-${dd}`;
              const reviewKey = `${record.horseName?.trim().toLowerCase()}-${record.raceTitle?.trim().toLowerCase()}`;

              const timeOnly = record.scheduledTimeOfRaceLocal
                ? new Date(record.scheduledTimeOfRaceLocal).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Europe/London'
                  })
                : null;

              filteredResults.push({
                horseName: record.horseName,
                position: record.positionOfficial,
                raceTitle: record.raceTitle,
                country: record.countryCode,
                date: formattedDate,
                time: timeOnly,
                track: record.courseName || "-",
                reviewKey,
              });
            }
          }
        }

        setGroupedNotifications(grouped);
        setResultsData(filteredResults);
      } catch (err) {
        console.error("Error checking upcoming races:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedAndRaces();
  }, [selectedSharedUser]);

  const renderGroupCard = (label, todayList, upcomingList) => {
    const hasContent = todayList.length > 0 || upcomingList.length > 0;
    if (!hasContent) return null;
  
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3 min-w-[300px]" key={label}>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">{label}</h2>

        {todayList.length > 0 && (
          <div>
            <h3 className="text-green-700 text-sm font-semibold">Today</h3>
            <ul className="space-y-1 mt-1">
              {todayList.map((item) => (
                <li key={item.raceKey} className="pl-2 border-l-4 border-green-300 text-sm leading-snug">
                  <Link
                    to={`/dashboard/horse/${item.encodedHorseName}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {item.rawHorseName}
                  </Link>{" "}
                  at <span className="italic text-gray-600">{item.raceTrack}</span>{" "}
                  <strong>{item.raceTime}</strong>
                  <br />
                  <Link
                    to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                    className="text-indigo-700 font-medium hover:underline"
                  >
                    {item.raceTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {upcomingList.length > 0 && (
          <div>
            <h3 className="text-blue-700 text-sm font-semibold">Upcoming</h3>
            <ul className="space-y-1 mt-1">
              {upcomingList.map((item) => (
                <li key={item.raceKey} className="pl-2 border-l-4 border-blue-200 text-sm leading-snug">
                  📅 In {item.dayDiff} day(s):{" "}
                  <Link
                    to={`/dashboard/horse/${item.encodedHorseName}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {item.rawHorseName}
                  </Link>{" "}
                  at <span className="italic text-gray-600">{item.raceTrack}</span>{" "}
                  <strong>{item.raceTime}</strong>
                  <br />
                  <Link
                    to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                    className="text-indigo-700 font-medium hover:underline"
                  >
                    {item.raceTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const hasAny = Object.values(groupedNotifications).some(g => g.today.length || g.upcoming.length);
  const hasResults = resultsData.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Dashboard</h1>

      {sharedWithMeUsers.length > 0 && (
        <div className="flex items-center justify-end mb-4 gap-2">
          <label className="text-sm font-medium text-gray-700">View:</label>
          <select
            value={selectedSharedUser || ""}
            onChange={(e) => {
              setSelectedSharedUser(e.target.value || null);
              setLoading(true); // triggers loading spinner
            }}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            <option value="">My Horses</option>
            {sharedWithMeUsers.map(user => (
              <option key={user.owner_user_id} value={user.owner_user_id}>
                {user.owner_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Loading tracked horse updates...</span>
        </div>
      ) : (
        <>
          {/* 🔥 Results First */}
          {(hasResults || hasAny) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hasResults && (
                <div className="col-span-full">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3 w-full">
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">Results (Last 3 Days)</h2>
                    <div>
                      <ul className="space-y-1 mt-1 text-sm leading-snug">
                        {[...resultsData]
                            .sort((a, b) => {
                              const aDate = new Date(`${a.date} ${a.time || '00:00'}`);
                              const bDate = new Date(`${b.date} ${b.time || '00:00'}`);
                              return aDate - bDate;
                            })
                            .map((res) => {
                            const normalizedRaceTitle = res.raceTitle?.toLowerCase().replace(/\s+/g, " ").trim();
                            const encodedRaceTitle = encodeURIComponent(normalizedRaceTitle);
                            const encodedDate = encodeURIComponent(res.date);
                            const encodedUrl = encodeURIComponent("https://horseracesbackend-production.up.railway.app/api/APIData_Table2");

                            const titleCase = (str) =>
                              str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

                            return (
                              <li
                                key={res.reviewKey}
                                className={`pl-2 text-sm leading-snug flex justify-between items-start
                                  ${reviewed_results.has(res.reviewKey)
                                    ? "border-l-4 border-gray-300 text-gray-400 opacity-60"
                                    : "border-l-4 border-blue-300 text-gray-800"}
                                `}
                              >
                                <div className="flex-1">
                                  📅{" "}
                                  <Link
                                    to={`/dashboard/horse/${encodeURIComponent(res.horseName)}`}
                                    className={`font-medium hover:underline ${
                                      reviewed_results.has(res.reviewKey) ? "text-gray-400" : "text-blue-700"
                                    }`}
                                  >
                                    {titleCase(res.horseName)}
                                  </Link>{" "}
                                  finished <strong>{res.position}</strong> in{" "}
                                  <Link
                                    to={`/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}&meetingDate=${encodedDate}`}
                                    className={`font-medium hover:underline ${
                                      reviewed_results.has(res.reviewKey) ? "text-gray-400" : "text-indigo-700"
                                    }`}
                                  >
                                    {titleCase(res.raceTitle)}
                                  </Link>{" "}
                                  at {res.track} ({res.country}) on <strong>{res.date}</strong>
                                  {res.time && (
                                    <span className="ml-1 text-black">
                                      at <strong>{res.time}</strong>
                                    </span>
                                  )}
                                </div>

                                {!reviewed_results.has(res.reviewKey) && (
                                  <button
                                    onClick={() => markAsReviewed(res.horseName, res.raceTitle, res.date)}
                                    className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                                    title="Mark as Reviewed"
                                  >
                                    ✓
                                  </button>
                                )}
                              </li>



                            );
                          })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Boxes */}
              {groupedNotifications["RaceUpdates"] &&
                renderGroupCard(
                  "Declarations & Entries",
                  groupedNotifications["RaceUpdates"].today,
                  groupedNotifications["RaceUpdates"].upcoming
                )}

              {Object.entries(groupedNotifications)
                .filter(([label]) => label !== "RaceUpdates")
                .map(([label, data]) => {
                  let formattedLabel = label;
                  if (label === "ClosingEntries") formattedLabel = "Early Closing Entries";
                  else {
                    formattedLabel = label
                      .replace(/([a-z])([A-Z])/g, "$1 $2")
                      .replace(/^./, str => str.toUpperCase());
                  }

                  return renderGroupCard(formattedLabel, data.today, data.upcoming);
                })}
            </div>
          ) : (
            <p className="text-gray-500 italic">No upcoming races for your tracked horses.</p>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
