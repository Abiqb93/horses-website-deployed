import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Flag, CalendarDays, CheckCircle, TrendingUp  } from "lucide-react";


export function Home() {
  const [trackedHorses, setTrackedHorses] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharedWithMeUsers, setSharedWithMeUsers] = useState([]);
  const [selectedSharedUser, setSelectedSharedUser] = useState(null);
  const [sireUpdates, setSireUpdates] = useState([]);
  const [damUpdates, setDamUpdates] = useState([]);
  const [ownerUpdates, setOwnerUpdates] = useState([]);
  const [activeSection, setActiveSection] = useState("declarations"); 
  const [selectedSire, setSelectedSire] = useState("");
  const [selectedDam, setSelectedDam] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  // const [predictedRatings, setPredictedRatings] = useState([]);

  const [reviewed_results, setreviewed_results] = useState(new Set());


  function toTitleCase(str) {
    return str
      ?.toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

//   // Fetch predicted Timeform ratings
//   useEffect(() => {
//   fetch('https://horseracesbackend-production.up.railway.app/api/predicted_timeform')
//     .then(res => res.json())
//     .then(data => {
//       setPredictedRatings(data);
//       console.log("[Fetched] predicted_timeform:", data.slice(0, 5));
//     })
//     .catch(err => console.error("Error fetching predicted_timeform:", err));
// }, []);

  const [trackingCache, setTrackingCache] = useState({});
  const fetchTrackingDetails = async (horseName) => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
    const key = horseName.toLowerCase();

    if (trackingCache[key]) return trackingCache[key]; // already cached

    try {
      const res = await fetch(
        `https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${userId}&horseName=${encodeURIComponent(horseName)}`
      );
      const json = await res.json();
      const notes = json.data?.filter(h => h.horseName?.toLowerCase() === key) || [];

      const nonEmptyNotes = notes.filter(n => n.note);
      const latestNote = nonEmptyNotes.sort((a, b) => new Date(b.noteDateTime) - new Date(a.noteDateTime))[0];

      const entry = {
        ...latestNote, // get sire, dam, trainer etc from latest valid note
        notes: nonEmptyNotes.map(n => n.note),  // array of all non-empty notes
      };
      setTrackingCache(prev => ({ ...prev, [key]: entry }));
      return entry;
    } catch (err) {
      console.error("Tracking info fetch failed:", err);
      return null;
    }
  };

  const FetchHorseDetails = ({ horseName, children }) => {
    const [info, setInfo] = useState(null);

    useEffect(() => {
      if (!horseName) return;
      fetchTrackingDetails(horseName).then(setInfo);
    }, [horseName]);

    return children(info);
  };

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

  useEffect(() => {
    const fetchSireUpdates = async () => {
      try {
        const userId = (() => {
          const storedUser = localStorage.getItem("user");
          return storedUser ? JSON.parse(storedUser).userId : "Guest";
        })();

        const resSires = await fetch(`https://horseracesbackend-production.up.railway.app/api/sire_tracking?user=${userId}`);
        const jsonSires = await resSires.json();
        const sires = jsonSires.data || [];

        const allHorseNames = new Set();
        const horseToSireMap = {};

        for (const sire of sires) {
          const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/sire?sireName=${encodeURIComponent(sire.sireName)}`);
          const json = await res.json();
          const horses = json.data || [];

          horses.forEach(h => {
            if (h.horseName) {
              const nameKey = h.horseName.toLowerCase().trim();
              allHorseNames.add(nameKey);
              horseToSireMap[nameKey] = sire.sireName; // 🟢 Set mapping
            }
          });
        }

        const sources = [
          "RacesAndEntries",
          "FranceRaceRecords",
          "IrelandRaceRecords",
          "ClosingEntries",
          "DeclarationsTracking",
          "EntriesTracking",
        ];

        const urls = sources.map(
          s => `https://horseracesbackend-production.up.railway.app/api/${s}`
        );

        const results = await Promise.all(urls.map(url => fetch(url).then(r => r.json())));

        const matched = [];
        results.forEach((res, i) => {
          const key = sources[i];
          (res.data || []).forEach(ent => {
            const horseName = ent.Horse || ent["Horse Name"];
            if (!horseName || !allHorseNames.has(horseName.toLowerCase().trim())) return;

            const title = ent.RaceTitle || ent.Race || ent.title || "";
            const track = ent.FixtureTrack || ent.Track || ent.Course || ent.Racecourse || ent.track || "";
            const time = ent.RaceTime || ent.Time || ent.time || "";
            const dateRaw = ent.FixtureDate || ent.meetingDate || ent.MeetingDate || ent.Date || ent.date || ent.raceDate || "";

            matched.push({
              source: key,
              title,
              track,
              time,
              horseName,
              dateRaw,
              timeRaw: time,
              sireName: horseToSireMap[horseName.toLowerCase().trim()] || "",
            });
          });
        });

        // Sort by date
        matched.sort((a, b) => {
          const d1 = new Date(`${a.dateRaw} ${a.timeRaw}`);
          const d2 = new Date(`${b.dateRaw} ${b.timeRaw}`);
          return d1 - d2;
        });

        setSireUpdates(matched);
      } catch (e) {
        console.error("Error fetching sire updates:", e);
      }
    };
    
    fetchSireUpdates();
  }, []);

  useEffect(() => {
    const fetchDamUpdates = async () => {
      try {
        const userId = JSON.parse(localStorage.getItem("user"))?.userId || "Guest";
        const resDams = await fetch(`https://horseracesbackend-production.up.railway.app/api/dam_tracking?user=${userId}`);
        const jsonDams = await resDams.json();
        const dams = jsonDams.data || [];

        const allHorseNames = new Set();
        const horseToDamMap = {};
        for (const dam of dams) {
          const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/dam?damName=${encodeURIComponent(dam.damName)}`);
          const json = await res.json();
          (json.data || []).forEach(h => {
            if (h.horseName) {
              const key = h.horseName.toLowerCase().trim();
              allHorseNames.add(key);
              horseToDamMap[key] = dam.damName;
            }
          });
        }


        const sources = [
          "RacesAndEntries", "FranceRaceRecords", "IrelandRaceRecords",
          "ClosingEntries", "DeclarationsTracking", "EntriesTracking"
        ];

        const urls = sources.map(s => `https://horseracesbackend-production.up.railway.app/api/${s}`);
        const results = await Promise.all(urls.map(url => fetch(url).then(r => r.json())));

        const matched = [];
        results.forEach((res, i) => {
          const key = sources[i];
          (res.data || []).forEach(ent => {
            const horseName = ent.Horse || ent["Horse Name"];
            if (!horseName || !allHorseNames.has(horseName.toLowerCase().trim())) return;

            const title = ent.RaceTitle || ent.Race || ent.title || "";
            const track = ent.FixtureTrack || ent.Track || ent.Course || ent.Racecourse || ent.track || "";
            const time = ent.RaceTime || ent.Time || ent.time || "";
            const dateRaw = ent.FixtureDate || ent.meetingDate || ent.MeetingDate || ent.Date || ent.date || ent.raceDate || "";

            matched.push({
              source: key,
              title,
              track,
              time,
              horseName,
              dateRaw,
              timeRaw: time,
              damName: horseToDamMap[horseName.toLowerCase().trim()] || "",
            });
          });
        });

        matched.sort((a, b) => new Date(`${a.dateRaw} ${a.timeRaw}`) - new Date(`${b.dateRaw} ${b.timeRaw}`));
        setDamUpdates(matched);
      } catch (err) {
        console.error("Error fetching dam updates:", err);
      }
    };

    fetchDamUpdates();
  }, []);

  useEffect(() => {
    const fetchOwnerUpdates = async () => {
      try {
        const userId = JSON.parse(localStorage.getItem("user"))?.userId || "Guest";
        const resOwners = await fetch(`https://horseracesbackend-production.up.railway.app/api/owner_tracking?user=${userId}`);
        const jsonOwners = await resOwners.json();
        const owners = jsonOwners.data || [];

        const allHorseNames = new Set();
        const horseToOwnerMap = {};
        for (const owner of owners) {
          const horses = JSON.parse(owner.correspondingHorses || "[]");
          horses.forEach(name => {
            const key = name?.toLowerCase().trim();
            if (key) {
              allHorseNames.add(key);
              horseToOwnerMap[key] = owner.ownerFullName;
            }
          });
        }

        const sources = [
          "RacesAndEntries", "FranceRaceRecords", "IrelandRaceRecords",
          "ClosingEntries", "DeclarationsTracking", "EntriesTracking"
        ];

        const urls = sources.map(s => `https://horseracesbackend-production.up.railway.app/api/${s}`);
        const results = await Promise.all(urls.map(url => fetch(url).then(r => r.json())));

        const matched = [];
        results.forEach((res, i) => {
          const key = sources[i];
          (res.data || []).forEach(ent => {
            const horseName = ent.Horse || ent["Horse Name"];
            if (!horseName || !allHorseNames.has(horseName.toLowerCase().trim())) return;

            const title = ent.RaceTitle || ent.Race || ent.title || "";
            const track = ent.FixtureTrack || ent.Track || ent.Course || ent.Racecourse || ent.track || "";
            const time = ent.RaceTime || ent.Time || ent.time || "";
            const dateRaw = ent.FixtureDate || ent.meetingDate || ent.MeetingDate || ent.Date || ent.date || ent.raceDate || "";

            matched.push({
              source: key,
              title,
              track,
              time,
              horseName,
              dateRaw,
              timeRaw: time,
              ownerName: horseToOwnerMap[horseName.toLowerCase().trim()] || "",
            });

          });
        });

        matched.sort((a, b) => new Date(`${a.dateRaw} ${a.timeRaw}`) - new Date(`${b.dateRaw} ${b.timeRaw}`));
        setOwnerUpdates(matched);
      } catch (err) {
        console.error("Error fetching owner updates:", err);
      }
    };

    fetchOwnerUpdates();
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
        const trackedData = trackedJson.data || [];
        const trackedNames = [...new Set(trackedData.map(h => h.horseName?.toLowerCase().trim()))];
        
        setTrackedHorses(trackedNames);

        // 🆕 Set cache upfront
        const newCache = {};
        for (const entry of trackedData) {
          const key = entry.horseName?.toLowerCase();
          if (key) newCache[key] = entry;
        }
        setTrackingCache(newCache);

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

            const raceTrack =
              entry.FixtureTrack ||
              entry.Track ||
              entry.Course ||
              entry.Racecourse ||
              entry.track ||
              entry["Course"] || // for Ireland
              "-";
            let raceTime =
                entry.RaceTime ||
                entry.Time ||
                entry.time ||
                entry["Race Time"] || // Ireland
                entry.OffTime ||      // Ireland fallback
                "-";

            if (label === "FranceRaceRecords" && typeof raceTime === "string" && raceTime.includes("h")) {
              const [hh, mm] = raceTime.split("h");
              const localTime = new Date();
              localTime.setHours(parseInt(hh), parseInt(mm), 0, 0);

              raceTime = localTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Europe/London"
              }); // e.g., "12:26 PM"
            }

            let raceTitle =
                entry.RaceTitle ||
                entry.title ||
                entry.Race ||
                entry["Race Title"] ||  // Ireland
                entry.EventName ||      // Ireland fallback
                "-";


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
                numberOfRunners: record.numberOfRunners, // ✅ Add this line
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
    <ul className="space-y-2 mt-1">
      {todayList.map((item) => (
        <li key={item.raceKey} className="pl-2 border-l-4 border-green-300 text-sm leading-snug">
          <div className="flex items-start">
            <CalendarDays className="inline-block w-4 h-4 text-gray-300 mr-1 mt-0.5" />
            <div>
              {/* HORSE NAME */}
              <div className="font-bold text-black uppercase flex flex-wrap items-center gap-x-1">
                <Link to={`/dashboard/horse/${item.encodedHorseName}`} className="hover:underline">
                  {item.rawHorseName}
                </Link>
                {(toTitleCase(item.sireName) || toTitleCase(item.damName) || toTitleCase(item.ownerName)) && (
                  <span className="text-xs text-gray-500 font-normal normal-case">
                    ({toTitleCase(item.sireName) || toTitleCase(item.damName) || toTitleCase(item.ownerName)})
                  </span>
                )}

                {(() => {
                  const info = trackingCache[item.rawHorseName?.toLowerCase().trim()];
                  if (!info) return null;
                  return (
                    <sup className="ml-1 text-xs text-gray-500">
                      {info.TrackingType && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-px rounded mr-1 tracking-tight">
                          {info.TrackingType}
                        </span>
                      )}
                      {info.note && (
                        <button
                          onClick={() =>
                            setTrackingCache((prev) => ({
                              ...prev,
                              [item.rawHorseName?.toLowerCase().trim()]: {
                                ...info,
                                _showNotes: !info._showNotes,
                              },
                            }))
                          }
                          className="text-blue-500 underline hover:text-blue-700 ml-1"
                        >
                          [notes]
                        </button>
                      )}
                    </sup>
                  );
                })()}
              </div>

              {/* METADATA */}
              {(() => {
                const isFromTracked = ["RaceUpdates", "DeclarationsTracking", "EntriesTracking", "ClosingEntries"].some(section =>
                  groupedNotifications[section]?.today?.some(e => e.raceKey === item.raceKey) ||
                  groupedNotifications[section]?.upcoming?.some(e => e.raceKey === item.raceKey)
                );

                if (!isFromTracked) return null;

                const info = trackingCache[item.rawHorseName?.toLowerCase()] || {};
                const metadata = [
                  (item.sireName || info.sireName) && `${toTitleCase(item.sireName || info.sireName)} (S)`,
                  (item.damName || info.damName) && `${toTitleCase(item.damName || info.damName)} (D)`,
                  (item.ownerName || info.ownerFullName) && `${toTitleCase(item.ownerName || info.ownerFullName)} (O)`,
                  info.trainerFullName && `${toTitleCase(info.trainerFullName)} (T)`
                ]
                  .filter(Boolean)
                  .join(" | ");

                if (!metadata) return null;

                return (
                  <div className="ml-4 text-xs text-gray-600 mt-0.5">
                    {metadata}
                  </div>
                );
              })()}



              {/* NOTES */}
              {(() => {
                const info = trackingCache[item.rawHorseName?.toLowerCase()];
                if (!info || !info._showNotes || !info.note) return null;
                return (
                  <div className="ml-4 mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    {info.note}
                  </div>
                );
              })()}

              {/* RACE INFO INLINE */}
              <div className="ml-4 mt-1 text-[13px] text-black flex flex-wrap gap-x-4 gap-y-1 items-center font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-300" />
                  {toTitleCase(item.raceTrack)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-300" />
                  {item.raceTime}
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="w-4 h-4 text-gray-300" />
                  <Link
                    to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                    className="text-indigo-700 hover:underline"
                  >
                    {item.raceTitle}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
      )}


        {upcomingList.length > 0 && (() => {
          const groupedByDay = {};
          for (const item of upcomingList) {
            const label = `In ${item.dayDiff} Day${item.dayDiff === 1 ? "" : "s"}`;
            if (!groupedByDay[label]) groupedByDay[label] = [];
            groupedByDay[label].push(item);
          }

          return Object.entries(groupedByDay).map(([label, entries]) => (
            <div key={label} className="mt-4">
              <h3 className="text-blue-700 text-sm font-semibold">{label}</h3>
              <ul className="space-y-2 mt-1">
                {entries.map((item) => (
                  <li key={item.raceKey} className="pl-2 border-l-4 border-blue-200 text-sm leading-snug">
                    <div className="flex items-start">
                      <CalendarDays className="inline-block w-4 h-4 text-gray-300 mr-1 mt-0.5" />
                      <div>
                        {/* HORSE NAME */}
                        <div className="font-bold text-black uppercase flex flex-wrap items-center gap-x-1">
                          <Link to={`/dashboard/horse/${item.encodedHorseName}`} className="hover:underline">
                            {item.rawHorseName}
                          </Link>
                          {(toTitleCase(item.sireName) || toTitleCase(item.damName) || toTitleCase(item.ownerName)) && (
                              <span className="text-xs text-gray-500 font-normal normal-case">
                                ({toTitleCase(item.sireName) || toTitleCase(item.damName) || toTitleCase(item.ownerName)})
                              </span>
                            )}

                          {(() => {
                            const info = trackingCache[item.rawHorseName?.toLowerCase().trim()];
                            if (!info) return null;
                            return (
                              <sup className="ml-1 text-xs text-gray-500">
                                {info.TrackingType && (
                                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-px rounded mr-1 tracking-tight">
                                    {info.TrackingType}
                                  </span>
                                )}
                                {info.note && (
                                  <button
                                    onClick={() =>
                                      setTrackingCache((prev) => ({
                                        ...prev,
                                        [item.rawHorseName?.toLowerCase().trim()]: {
                                          ...info,
                                          _showNotes: !info._showNotes,
                                        },
                                      }))
                                    }
                                    className="text-blue-500 underline hover:text-blue-700 ml-1"
                                  >
                                    [notes]
                                  </button>
                                )}
                              </sup>
                            );
                          })()}
                        </div>

                        {/* METADATA */}
                        {(() => {
                          // Skip rendering metadata in "Mare Updates" (i.e. dam tab)
                          if (activeSection === "dam") return null;

                          const info = trackingCache[item.rawHorseName?.toLowerCase()] || {};
                          const sireName = toTitleCase(item.sireName) || toTitleCase(info.sireName);
                          const damName = toTitleCase(item.damName) || toTitleCase(info.damName);
                          const ownerName = toTitleCase(item.ownerName) || toTitleCase(info.ownerFullName);
                          const trainerName = info.trainerFullName;

                          const showOwnerInline = !!item.ownerName;
                          const metadata = [
                            sireName && `${toTitleCase(sireName)} (S)`,
                            damName && `${toTitleCase(damName)} (D)`,
                            ownerName && `${ownerName} (O)`,
                            trainerName && `${trainerName} (T)`
                          ].filter(Boolean).join(" | ");
                          if (!metadata) return null;

                          return (
                            <div className="ml-4 text-xs text-gray-600 mt-0.5">
                              {metadata}
                            </div>
                          );
                        })()}


                        {/* NOTES */}
                        {(() => {
                          const info = trackingCache[item.rawHorseName?.toLowerCase()];
                          if (!info || !info._showNotes || !info.note) return null;
                          return (
                            <div className="ml-4 mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                              {info.note}
                            </div>
                          );
                        })()}

                        {/* RACE INFO INLINE */}
                        <div className="ml-4 mt-1 text-[13px] text-black flex flex-wrap gap-x-4 gap-y-1 items-center font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-300" />
                            {toTitleCase(item.raceTrack)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-300" />
                            {item.raceTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flag className="w-4 h-4 text-gray-300" />
                            <Link
                              to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                              className="text-indigo-700 hover:underline"
                            >
                              {item.raceTitle}
                            </Link>
                          </span>
                        </div>

                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ));
        })()}
      </div>
    );
  };


  const hasAny = Object.values(groupedNotifications).some(g => g.today.length || g.upcoming.length);
  const hasResults = resultsData.length > 0;
  // Extract unique sire/dam/owner names from trackingCache
  const sireNames = [...new Set(Object.values(trackingCache).map(info => info?.sireName).filter(Boolean))];
  const damNames = [...new Set(Object.values(trackingCache).map(info => info?.damName).filter(Boolean))];
  const ownerNames = [...new Set(Object.values(trackingCache).map(info => info?.ownerFullName).filter(Boolean))];

  // Convert time like "4.45pm" → "16:45"
  function convertTo24Hour(timeStr) {
    if (!timeStr) return "12:00";
    const [time, meridian] = timeStr.toLowerCase().split(/(am|pm)/).filter(Boolean);
    let [hours, minutes] = time.replace(/\s/g, "").split(".").map(Number);
    if (meridian === "pm" && hours !== 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}`;
  }

  // Clean date string like "Saturday 27th July" to "Saturday, 27 July"
  function cleanDateString(dateStr, timeStr) {
    if (!dateStr) return null;

    let cleaned = dateStr
      .replace(/(\d{1,2})(st|nd|rd|th)/g, "$1") // Remove suffixes
      .replace(/^(\w+)\s+(\d{1,2})\s+/, "$1, $2 "); // Add comma after weekday

    const time24 = convertTo24Hour(timeStr || "12:00pm");
    const fullStr = `${cleaned} ${time24}`;
    const parsed = new Date(fullStr);
    return isNaN(parsed) ? null : parsed;
  }

  // 🔁 Reusable for sire, dam, owner
  function groupHorseUpdatesByDate(updates) {
    const grouped = { today: [], upcoming: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    updates.forEach((entry) => {
      const raceDate = cleanDateString(entry.dateRaw, entry.timeRaw);
      if (!raceDate || isNaN(raceDate)) return;

      const raceDateOnly = new Date(raceDate);
      raceDateOnly.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((raceDateOnly - today) / (1000 * 60 * 60 * 24));

      const rawHorseName = entry.horseName;
      const raceTitle = entry.title || "-";
      const raceTrack = entry.track || "-";
      const raceTime = entry.timeRaw || "-";

      const encodedHorseName = encodeURIComponent(rawHorseName.trim());
      const encodedRaceTitle = encodeURIComponent(raceTitle.trim());
      const encodedUrl = encodeURIComponent(`https://horseracesbackend-production.up.railway.app/api/${entry.source}`);
      const raceKey = `${rawHorseName}-${raceTitle}-${entry.dateRaw}`;

      const formatted = {
        rawHorseName,
        encodedHorseName,
        raceTrack,
        raceTime,
        raceTitle,
        encodedUrl,
        encodedRaceTitle,
        dayDiff,
        raceKey,
        sireName: entry.sireName || "", // ✅ Fix for Sire Updates
        damName: entry.damName || "",   // (optional: for dam tracking)
        ownerName: entry.ownerName || "", // (optional: for owner tracking)
      };

      if (dayDiff === 0) {
        grouped.today.push(formatted);
      } else if (dayDiff > 0) {
        grouped.upcoming.push(formatted);
      }
    });

    return grouped;
  }

  // ✅ Apply to both sire and dam updates
  const groupedSireUpdates = groupHorseUpdatesByDate(sireUpdates);
  const availableSires = [...new Set(sireUpdates.map(e => e.sireName).filter(Boolean))].sort();
  const groupedDamUpdates = groupHorseUpdatesByDate(damUpdates);
  const groupedOwnerUpdates = groupHorseUpdatesByDate(ownerUpdates);


  // Optional debug
  console.log("✅ Final Grouped Sire Updates:", groupedSireUpdates);
  console.log("✅ Final Grouped Dam Updates:", groupedDamUpdates);

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:px-8">
    <div className="bg-yellow-100 text-yellow-800 text-sm font-medium px-4 py-2 rounded-md border border-yellow-300 mb-6 shadow-sm">
      This website is currently under development.
    </div>
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

      {/* Modern Tab Bar */}
      <div className="flex space-x-4 border-b mb-6">
        {[
          { key: "results", label: "Results" },
          { key: "declarations", label: "Declarations & Entries" },
          { key: "closings", label: "Early Closing Entries" },
          { key: "sire", label: "Sire Updates" },
          { key: "dam", label: "Mare Updates" },
          { key: "owner", label: "Owner Updates" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`px-4 py-2 font-semibold text-sm tracking-tight border-b-2 transition-all duration-150 ${
              activeSection === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      

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
            <div className="space-y-6">
              {/* 🔥 Results Tab */}
              {activeSection === "results" && hasResults && (
              <ul className="space-y-4 mt-2 text-sm leading-snug">
                {Object.entries(
                  [...resultsData]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .reduce((groups, item) => {
                      const d = new Date(item.date);
                      const key = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(item);
                      return groups;
                    }, {})
                ).map(([date, group]) => (
                  <li key={date}>
                    <div className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-gray-400" />
                      {date}
                    </div>

                    <ul className="space-y-2">
                      {group.map((res) => {
                        const encodedRaceTitle = encodeURIComponent(res.raceTitle?.trim());
                        const encodedDate = encodeURIComponent(res.date);
                        const encodedUrl = encodeURIComponent("https://horseracesbackend-production.up.railway.app/api/APIData_Table2");

                        return (
                          <li
                            key={res.reviewKey}
                            className={`pl-2 text-sm leading-snug flex justify-between items-start ${
                              reviewed_results.has(res.reviewKey)
                                ? "border-l-4 border-gray-300 text-gray-400 opacity-60"
                                : "border-l-4 border-blue-300 text-gray-800"
                            }`}
                          >
                            <div className="flex-1">
                              {/* Horse Name */}
                              <div className="font-bold text-black uppercase">
                                <Link
                                  to={`/dashboard/horse/${encodeURIComponent(res.horseName)}`}
                                  className={`hover:underline ${reviewed_results.has(res.reviewKey) ? "text-gray-400" : "text-black"}`}
                                >
                                  {res.horseName}
                                </Link>

                                {/* Superscript */}
                                {(() => {
                                  const info = trackingCache[res.horseName?.toLowerCase()];
                                  if (!info) return null;
                                  return (
                                    <sup className="ml-1 text-xs text-gray-500">
                                      {info.TrackingType && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-px rounded mr-1 tracking-tight">
                                          {info.TrackingType}
                                        </span>
                                      )}
                                      {info.note && (
                                        <button
                                          onClick={() =>
                                            setTrackingCache((prev) => ({
                                              ...prev,
                                              [res.horseName?.toLowerCase()]: {
                                                ...info,
                                                _showNotes: !info._showNotes,
                                              },
                                            }))
                                          }
                                          className="text-blue-500 underline hover:text-blue-700 ml-1"
                                        >
                                          [notes]
                                        </button>
                                      )}
                                    </sup>
                                  );
                                })()}
                              </div>

                              {/* Metadata */}
                              {(() => {
                                const info = trackingCache[res.horseName?.toLowerCase()];
                                if (!info) return null;
                                return (
                                  <div className="ml-4 text-xs text-gray-600 mt-0.5">
                                    {[
                                      info.sireName && `${toTitleCase(info.sireName)} (S)`,
                                      info.damName && `${toTitleCase(info.damName)} (D)`,
                                      info.ownerFullName && `${toTitleCase(info.ownerFullName)} (O)`,
                                      info.trainerFullName && `${toTitleCase(info.trainerFullName)} (T)`
                                    ]
                                      .filter(Boolean)
                                      .join(" | ")}
                                  </div>
                                );
                              })()}

                              
                              {/* Notes display */}
                              {(() => {
                                const info = trackingCache[res.horseName?.toLowerCase()];
                                if (!info || !info._showNotes || !info.note) return null;
                                return (
                                  <div className="ml-4 mt-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                                    {info.note}
                                  </div>
                                );
                              })()}

                              {/* Race Info Inline */}
                              <div className="ml-4 mt-1 text-[13px] text-black flex flex-wrap gap-x-4 gap-y-1 items-center font-medium">
                                <span className="flex items-center gap-1 text-black font-bold">
                                  <CheckCircle className="w-4 h-4 text-gray-300" />
                                  FP: {res.position}
                                  {res.numberOfRunners && (
                                    <span className="font-normal text-gray-600"> / {res.numberOfRunners}</span>
                                  )}

                                {res.time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-gray-300" />
                                    {res.time}
                                  </span>
                                )}

                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 text-gray-300" />
                                  {toTitleCase(res.track)}
                                </span>


                                <span className="flex items-center gap-1">
                                  <Flag className="w-4 h-4 text-gray-300" />
                                  <Link
                                    to={`/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}&meetingDate=${encodedDate}`}
                                    className="text-indigo-700 hover:underline max-w-[320px] truncate inline-block align-middle"
                                    title={res.raceTitle}
                                  >
                                    {res.raceTitle}
                                  </Link>

                                </span>


                                </span>

                              </div>
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
                  </li>
                ))}
              </ul>)}




              {/* Declarations & Entries */}
              {activeSection === "declarations" && groupedNotifications["RaceUpdates"] && (
                renderGroupCard(
                  "",
                  groupedNotifications["RaceUpdates"].today,
                  groupedNotifications["RaceUpdates"].upcoming
                )
              )}

              {/* Early Closings */}
              {activeSection === "closings" && groupedNotifications["ClosingEntries"] && (
                renderGroupCard(
                  "",
                  groupedNotifications["ClosingEntries"].today,
                  groupedNotifications["ClosingEntries"].upcoming
                )
              )}

              {activeSection === "sire" && (() => {
                const filteredSireEntries = selectedSire
                  ? sireUpdates.filter(e => e.sireName === selectedSire)
                  : sireUpdates;

                const groupedFiltered = groupHorseUpdatesByDate(filteredSireEntries);

                return (
                  <>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mr-2">Filter by Sire:</label>
                      <select
                        value={selectedSire}
                        onChange={(e) => setSelectedSire(e.target.value)}
                        className="text-sm border rounded px-2 py-1 bg-white"
                      >
                        <option value="">All Sires</option>
                        {availableSires.map((sire) => (
                          <option key={sire} value={sire}>{sire}</option>
                        ))}
                      </select>
                    </div>

                    {renderGroupCard(
                      selectedSire ? `Sire Updates: ${selectedSire}` : "Sire Updates",
                      groupedFiltered.today,
                      groupedFiltered.upcoming
                    )}
                  </>
                );
              })()}

              {activeSection === "dam" && (() => {
                const filteredDamEntries = selectedDam
                  ? damUpdates.filter(e => e.damName === selectedDam)
                  : damUpdates;

                const groupedFiltered = groupHorseUpdatesByDate(filteredDamEntries);

                const availableDams = [...new Set(damUpdates.map(e => e.damName).filter(Boolean))].sort();

                return (
                  <>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mr-2">Filter by Mare:</label>
                      <select
                        value={selectedDam}
                        onChange={(e) => setSelectedDam(e.target.value)}
                        className="text-sm border rounded px-2 py-1 bg-white"
                      >
                        <option value="">All Mares</option>
                        {availableDams.map((dam) => (
                          <option key={dam} value={dam}>{dam}</option>
                        ))}
                      </select>
                    </div>

                    {renderGroupCard(
                      selectedDam ? `Mare Updates: ${selectedDam}` : "Mare Updates",
                      groupedFiltered.today,
                      groupedFiltered.upcoming
                    )}
                  </>
                );
              })()}


              {activeSection === "owner" && (() => {
                  const filteredOwnerEntries = selectedOwner
                    ? ownerUpdates.filter(e => e.ownerName === selectedOwner)
                    : ownerUpdates;

                  const groupedFiltered = groupHorseUpdatesByDate(filteredOwnerEntries);

                  const availableOwners = [...new Set(ownerUpdates.map(e => e.ownerName).filter(Boolean))].sort();

                  return (
                    <>
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 mr-2">Filter by Owner:</label>
                        <select
                          value={selectedOwner}
                          onChange={(e) => setSelectedOwner(e.target.value)}
                          className="text-sm border rounded px-2 py-1 bg-white"
                        >
                          <option value="">All Owners</option>
                          {availableOwners.map((owner) => (
                            <option key={owner} value={owner}>{owner}</option>
                          ))}
                        </select>
                      </div>

                      {renderGroupCard(
                        selectedOwner ? `Owner Updates: ${selectedOwner}` : "Owner Updates",
                        groupedFiltered.today,
                        groupedFiltered.upcoming
                      )}
                    </>
                  );
                })()}

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
