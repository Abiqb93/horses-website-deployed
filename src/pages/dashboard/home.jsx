import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Home() {
  const [trackedHorses, setTrackedHorses] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackedAndRaces = async () => {
      try {
        const userId = localStorage.getItem("userId") || "Guest";
        const trackedRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${encodeURIComponent(userId)}`);
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

        for (const { date, records } of resultsFetches) {
          for (const record of records) {
            const horseName = record.horseName?.toLowerCase().trim();
            if (trackedNames.includes(horseName)) {
              filteredResults.push({
                horseName: record.horseName,
                position: record.positionOfficial,
                raceTitle: record.raceTitle,
                country: record.countryCode,
                date,
                track: record.courseName || "-",
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
  }, []);

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
          {hasResults && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">Results (Last 3 Days)</h2>
              <ul className="space-y-1 mt-1 text-sm leading-snug">
                {resultsData
                  .sort((a, b) => a.position - b.position)
                  .map((res) => {
                    let icon = "📌";
                    if (res.position === 1) icon = "🏁";
                    else if (res.position === 2) icon = "📈";
                    else if (res.position === 3) icon = "🎯";

                    const encodedRaceTitle = encodeURIComponent(res.raceTitle);
                    const encodedDate = encodeURIComponent(res.date);
                    const encodedUrl = encodeURIComponent("https://horseracesbackend-production.up.railway.app/api/APIData_Table2");

                    return (
                      <li
                        key={`${res.horseName}-${res.raceTitle}-${res.date}`}
                        className="pl-2 border-l-4 border-purple-300 flex items-start gap-2"
                      >
                        <span className="text-lg pt-[1px]">{icon}</span>
                        <span className="text-sm leading-snug">
                          <Link
                            to={`/dashboard/horse/${encodeURIComponent(res.horseName)}`}
                            className="text-blue-700 font-medium hover:underline"
                          >
                            {res.horseName}
                          </Link>{" "}
                          finished <strong>{res.position}</strong> in{" "}
                          <Link
                            to={`/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}&meetingDate=${encodedDate}`}
                            className="text-indigo-700 font-medium hover:underline"
                          >
                            {res.raceTitle}
                          </Link>{" "}
                          at <span className="text-gray-800">{res.track}</span> ({res.country}) on{" "}
                          <span className="text-gray-700">{res.date}</span>
                        </span>
                      </li>
                    );
                  })}
              </ul>


            </div>
          )}

          {/* 🔥 Race Updates & Others */}
          {hasAny ? (
            <div className="flex flex-wrap gap-5">
              {groupedNotifications["RaceUpdates"] &&
                renderGroupCard(
                  "Race Updates",
                  groupedNotifications["RaceUpdates"].today,
                  groupedNotifications["RaceUpdates"].upcoming
                )}

              {Object.entries(groupedNotifications)
                .filter(([label]) => label !== "RaceUpdates")
                .map(([label, data]) => {
                  const formattedLabel = label
                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                    .replace(/^./, str => str.toUpperCase());
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
