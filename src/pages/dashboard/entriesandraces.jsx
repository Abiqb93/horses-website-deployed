import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";

export function RacesAndEntries() {
  const [RacesAndEntries, setRacesAndEntries] = useState([]);
  const [expandedKey, setExpandedKey] = useState(null);
  const [expandedRaceId, setExpandedRaceId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/RacesAndEntries");
      const data = await response.json();
      setRacesAndEntries(data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const normalizeDateString = (str) => str.replace(/\s{2,}/g, " ").trim();

  const groupByDateWithUniqueRaces = (data) => {
    const grouped = {};
    const seen = new Set();

    data.forEach((item) => {
      const rawDate = item.FixtureDate;
      const date = normalizeDateString(rawDate);
      const key = `${item.FixtureTrack}-${date}-${item.Session}-${item.RaceType}`;
      if (!seen.has(key)) {
        seen.add(key);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({
          track: item.FixtureTrack,
          date,
          race_type: item.RaceType,
          session: item.Session,
        });
      }
    });

    return grouped;
  };

  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return "";
    const cleaned = normalizeDateString(dateStr);
    const dateObj = new Date(cleaned);
    if (isNaN(dateObj)) return cleaned;
    return dateObj.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const toggleExpanded = (track, date) => {
    const normalizedDate = normalizeDateString(date);
    const key = `${track}-${normalizedDate}`;
    setExpandedKey((prev) => (prev === key ? null : key));
    setExpandedRaceId(null);
  };

  const toggleRaceTable = (raceID) => {
    setExpandedRaceId((prev) => (prev === raceID ? null : raceID));
  };

  const getUniqueRacesForTrackDate = (track, date) => {
    const seen = new Set();
    const normalizedDate = normalizeDateString(date);
    return RacesAndEntries.filter((entry) => {
      const match = entry.FixtureTrack === track && normalizeDateString(entry.FixtureDate) === normalizedDate;
      const id = entry.RaceID;
      if (match && !seen.has(id)) {
        seen.add(id);
        return true;
      }
      return false;
    });
  };

  const getRaceEntries = (raceID) =>
    RacesAndEntries.filter((entry) => entry.RaceID === raceID);

  const groupedByDate = groupByDateWithUniqueRaces(RacesAndEntries);

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      {Object.entries(groupedByDate).map(([date, races]) => (
        <div key={date}>
          <Typography variant="h6" className="text-gray-800 font-medium mb-2">
            Racing on {formatDate(date)}
          </Typography>

          {races.map((race, index) => {
            const cardKey = `${race.track}-${normalizeDateString(race.date)}`;
            const isExpanded = expandedKey === cardKey;

            return (
              <div key={index}>
                <Card
                  className="shadow-sm border border-gray-200 mb-1 px-4 py-2 cursor-pointer"
                  onClick={() => toggleExpanded(race.track, race.date)}
                >
                  <CardBody className="p-0 flex items-center justify-between text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700 font-bold uppercase">{race.track}</span>
                      <span>/ {formatDate(race.date)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>{race.race_type}</span>
                      <span>{race.session}</span>
                    </div>
                  </CardBody>
                </Card>

                {isExpanded && (
                  <div className="ml-4 mt-2 mb-4 space-y-2">
                    {getUniqueRacesForTrackDate(race.track, race.date).map((entry, i) => (
                      <div key={i}>
                        <div
                          onClick={() => toggleRaceTable(entry.RaceID)}
                          className="flex justify-between items-start bg-white border border-gray-200 px-4 py-3 rounded-md text-sm shadow-sm hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 max-w-[60%]">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded">
                                {entry.RaceID}
                              </span>
                              <span className="font-medium">{entry.RaceTime}</span>
                              <span className="font-normal text-gray-700">{entry.RaceTitle}</span>
                            </div>
                            <span className="text-gray-500">{entry.Status}</span>
                          </div>
                          <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-gray-700 text-right">
                            <div><strong>{entry.Distance}</strong></div>
                            <div><strong>{entry.AgeGroup}</strong></div>
                            <div><strong>{entry.Prize}</strong></div>
                            <div><strong>{entry.SF_MF}</strong></div>
                            <div><strong>{entry.FSL}</strong></div>
                            <div><strong>{entry.seq}</strong></div>
                            <div><strong>{entry.Entries}</strong></div>
                          </div>
                        </div>

                        {expandedRaceId === entry.RaceID && (
                          <Card className="bg-white text-black mt-2">
                            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                              <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                  <tr>
                                    {[
                                      "No.",
                                      "No_Draw",
                                      "Horse",
                                      "Rider",
                                      "Age",
                                      "Sex",
                                      "Rating",
                                      "Weight",
                                      "Trainer",
                                      "Owner",
                                    ].map((col) => (
                                      <th
                                        key={col}
                                        className="border-b border-blue-gray-50 py-3 px-5 text-left bg-gray-100"
                                      >
                                        <Typography variant="small" className="text-[11px] font-bold uppercase">
                                          {col}
                                        </Typography>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {getRaceEntries(entry.RaceID).map((record, idx) => (
                                    <tr key={idx}>
                                      {[
                                        record["No."],
                                        record.No_Draw,
                                        record.Horse,
                                        record.Rider,
                                        record.Age,
                                        record.Sex,
                                        record.Rating,
                                        record.Weight,
                                        record.Trainer,
                                        record.Owner,
                                      ].map((value, i) => (
                                        <td key={i} className="py-3 px-5 border-b border-blue-gray-50">
                                          <Typography className="text-xs font-semibold text-blue-gray-600">
                                            {value !== null && value !== undefined ? value : "-"}
                                          </Typography>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default RacesAndEntries;
