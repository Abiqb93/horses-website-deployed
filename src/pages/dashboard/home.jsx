import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
        for (const sire of sires) {
          const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/sire?sireName=${encodeURIComponent(sire.sireName)}`);
          const json = await res.json();
          const horses = json.data || [];
          horses.forEach(h => {
            if (h.horseName) allHorseNames.add(h.horseName.toLowerCase().trim());
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
        for (const dam of dams) {
          const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/dam?damName=${encodeURIComponent(dam.damName)}`);
          const json = await res.json();
          (json.data || []).forEach(h => h.horseName && allHorseNames.add(h.horseName.toLowerCase().trim()));
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

            matched.push({ source: key, title, track, time, horseName, dateRaw, timeRaw: time });
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
        for (const owner of owners) {
          const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/owner?ownerFullName=${encodeURIComponent(owner.ownerName)}`);
          const json = await res.json();
          (json.data || []).forEach(h => h.horseName && allHorseNames.add(h.horseName.toLowerCase().trim()));
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

            matched.push({ source: key, title, track, time, horseName, dateRaw, timeRaw: time });
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

            const raceTrack = label === "FranceRaceRecords"
              ? entry.Racecourse || "-"
              : entry.FixtureTrack || entry.Track || entry.Course || entry.Racecourse || entry.track || "-";
            let raceTime = entry.RaceTime || entry.Time || entry.time || "-";

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
                    {item.rawHorseName
                      ?.toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase())}
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
  const groupedDamUpdates = groupHorseUpdatesByDate(damUpdates);

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
          { key: "dam", label: "Dam Updates" },
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
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3 w-full">
                  <h2 className="text-lg font-semibold text-gray-800 border-b pb-1">Results (Last 3 Days)</h2>
                  <ul className="space-y-1 mt-1 text-sm leading-snug">
                    {[...resultsData]
                      .sort((a, b) => new Date(`${a.date} ${a.time || '00:00'}`) - new Date(`${b.date} ${b.time || '00:00'}`))
                      .map((res) => {
                        const normalizedRaceTitle = res.raceTitle?.toLowerCase().replace(/\s+/g, " ").trim();
                        const encodedRaceTitle = encodeURIComponent(normalizedRaceTitle);
                        const encodedDate = encodeURIComponent(res.date);
                        const encodedUrl = encodeURIComponent("https://horseracesbackend-production.up.railway.app/api/APIData_Table2");
                        const titleCase = (str) => str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

                        return (
                          <li
                            key={res.reviewKey}
                            className={`pl-2 text-sm leading-snug flex justify-between items-start
                              ${reviewed_results.has(res.reviewKey)
                                ? "border-l-4 border-gray-300 text-gray-400 opacity-60"
                                : "border-l-4 border-blue-300 text-gray-800"}`}
                          >
                            <div className="flex-1">
                              📅{" "}
                              <Link to={`/dashboard/horse/${encodeURIComponent(res.horseName)}`}
                                    className={`font-medium hover:underline ${reviewed_results.has(res.reviewKey) ? "text-gray-400" : "text-blue-700"}`}>
                                {titleCase(res.horseName)}
                              </Link>{" "}
                              finished <strong>{res.position}</strong> in{" "}
                              <Link to={`/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}&meetingDate=${encodedDate}`}
                                    className={`font-medium hover:underline ${reviewed_results.has(res.reviewKey) ? "text-gray-400" : "text-indigo-700"}`}>
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
              )}

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

              {activeSection === "sire" &&
                renderGroupCard("Sire Updates", groupedSireUpdates.today, groupedSireUpdates.upcoming)}

              {activeSection === "dam" &&
                renderGroupCard("Dam Updates", groupedDamUpdates.today, groupedDamUpdates.upcoming)}
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
