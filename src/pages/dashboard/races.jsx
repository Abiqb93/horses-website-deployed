import React, { useState, useEffect } from "react";
import { Card, Typography, Input } from "@material-tailwind/react";

// RaceTile Component
const RaceTile = ({ race, onClick }) => {
  return (
    <Card
      className="p-4 m-2 shadow-md cursor-pointer hover:shadow-lg"
      onClick={() => onClick(race.raceTitle)}
    >
      <Typography variant="h6" className="text-blue-gray-700 font-bold">
        {race.raceTitle}
      </Typography>
      <Typography variant="small" className="text-blue-gray-600 mt-2">
        <strong>Country:</strong> {race.countryCode}
      </Typography>
      <Typography variant="small" className="text-blue-gray-600">
        <strong>Surface:</strong> {race.raceSurfaceName}
      </Typography>
      <Typography variant="small" className="text-blue-gray-600">
        <strong>Runners:</strong> {race.numberOfRunners}
      </Typography>
      <Typography variant="small" className="text-blue-gray-600">
        <strong>Prize Fund:</strong> {race.prizeFund}
      </Typography>
      <Typography variant="small" className="text-blue-gray-600 mt-2">
        <strong>Top Horses:</strong>
      </Typography>
      <ul className="list-disc list-inside">
        {race.topHorses.map((horse, index) => (
          <li key={index} className="text-blue-gray-600">
            {horse.horseName} (Position: {horse.positionOfficial})
          </li>
        ))}
      </ul>
    </Card>
  );
};

// ReportTable Component
const ReportTable = ({ tableData }) => {
  return (
    <Card className="bg-white text-black mt-6">
      <Typography variant="h6" className="p-4 text-blue-gray-700 font-bold">
        Detailed Records
      </Typography>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {Object.keys(tableData[0] || {}).map((columnName) => (
                <th
                  key={columnName}
                  className="border-b border-gray-300 py-2 px-4 text-left"
                >
                  <Typography
                    variant="small"
                    className="text-[10px] font-bold uppercase text-blue-gray-600"
                  >
                    {columnName}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                {Object.entries(item).map(([key, value], i) => (
                  <td key={i} className="py-2 px-4 border-b border-gray-300">
                    <Typography className="text-[10px] font-medium text-blue-gray-600">
                      {value !== null && value !== undefined ? value : "-"}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// Logs Component
const Logs = ({ logs }) => {
  return (
    <div className="mt-6">
      <Typography variant="h6" className="text-blue-gray-700 font-bold mb-4">
        Viewed Races
      </Typography>
      <ul className="list-disc list-inside text-blue-gray-600">
        {logs.map((log, index) => (
          <li key={index}>
            {log.date} - {log.raceTitle}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Races Component
export function Races() {
  const [meetingDate, setMeetingDate] = useState(""); // Selected date
  const [racesData, setRacesData] = useState([]); // All races data
  const [loading, setLoading] = useState(false);
  const [selectedRaceRecords, setSelectedRaceRecords] = useState([]); // Records for the selected raceTitle
  const [logs, setLogs] = useState([]); // Logs of clicked tiles

  // Fetch races data for the selected date
  const fetchRacesData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        meetingDate,
      }).toString();

      const response = await fetch(
        `https://horseracesbackend-production.up.railway.app/api/api_races?${queryParams}`
      );
      const data = await response.json();

      // Group races by raceTitle
      const races = data.data.reduce((acc, record) => {
        if (!acc[record.raceTitle]) {
          acc[record.raceTitle] = {
            raceTitle: record.raceTitle,
            countryCode: record.countryCode,
            raceSurfaceName: record.raceSurfaceName,
            numberOfRunners: record.numberOfRunners,
            prizeFund: record.prizeFund,
            topHorses: [],
            records: [], // Store all records for this raceTitle
          };
        }

        // Add top 3 horses by positionOfficial
        if (record.positionOfficial && record.positionOfficial <= 3) {
          acc[record.raceTitle].topHorses.push({
            horseName: record.horseName,
            positionOfficial: record.positionOfficial,
          });
        }

        // Add the record to the full records list
        acc[record.raceTitle].records.push(record);

        return acc;
      }, {});

      setRacesData(Object.values(races));
    } catch (error) {
      console.error("Error fetching races data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (meetingDate) {
      fetchRacesData();
    }
  }, [meetingDate]);

  // Handle tile click
  const handleTileClick = (raceTitle) => {
    const race = racesData.find((race) => race.raceTitle === raceTitle);
    setSelectedRaceRecords(race.records);

    // Add to logs
    setLogs((prevLogs) => [
      ...prevLogs,
      { date: meetingDate, raceTitle },
    ]);
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-4">
      {/* Welcome Message */}
      {!meetingDate && (
        <Typography
          variant="h5"
          className="text-center text-blue-gray-700 font-bold mb-4"
        >
          Welcome! Please select a date to start exploring races.
        </Typography>
      )}

      {/* Date Picker */}
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6" className="text-black">
          Select Date
        </Typography>
        <Input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Loading or Tiles */}
      {loading ? (
        <Typography
          variant="small"
          className="text-center text-blue-gray-600 mt-6"
        >
          Loading data...
        </Typography>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {racesData.map((race, index) => (
            <RaceTile key={index} race={race} onClick={handleTileClick} />
          ))}
        </div>
      )}

      {/* Detailed View Below Tiles */}
      {selectedRaceRecords.length > 0 && (
        <ReportTable tableData={selectedRaceRecords} />
      )}

      {/* Logs */}
      {logs.length > 0 && <Logs logs={logs} />}
    </div>
  );
}

export default Races;
