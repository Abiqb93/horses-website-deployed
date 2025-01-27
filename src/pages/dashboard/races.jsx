import React, { useState, useEffect } from "react";
import { Card, Typography, Input, Select, Option, Button } from "@material-tailwind/react";

// RaceTile Component
const RaceTile = ({ race, onClick }) => {
  return (
    <Card
      className="p-4 m-2 shadow-md cursor-pointer hover:shadow-lg"
      onClick={() => onClick(race)}
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
  const sortedData = tableData.sort((a, b) => a.positionOfficial - b.positionOfficial);

  const getCupIcon = (position) => {
    if (position === 1) return <span style={{ fontSize: "1.5rem" }}>🏆</span>; // Gold Trophy
    if (position === 2) return <span style={{ fontSize: "1.5rem" }}>🥈</span>; // Silver Trophy
    if (position === 3) return <span style={{ fontSize: "1.5rem" }}>🥉</span>; // Bronze Trophy
    return null;
  };

  return (
    <Card className="bg-white text-black mt-6">
      {/* <Typography variant="h6" className="p-4 text-blue-gray-700 font-bold">
        Detailed Records
      </Typography> */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {[
                "positionOfficial",
                "horseName",
                "countryCode",
                "sireName",
                "damName",
                ...Object.keys(tableData[0] || {}).filter(
                  (key) => !["positionOfficial", "horseName", "countryCode", "sireName", "damName"].includes(key)
                ),
              ].map((columnName) => (
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
            {sortedData.map((item, index) => (
              <tr key={index}>
                {[
                  "positionOfficial",
                  "horseName",
                  "countryCode",
                  "sireName",
                  "damName",
                  ...Object.keys(item).filter(
                    (key) => !["positionOfficial", "horseName", "countryCode", "sireName", "damName"].includes(key)
                  ),
                ].map((key, i) => (
                  <td key={i} className="py-2 px-4 border-b border-gray-300">
                    <Typography className="text-[10px] font-medium text-blue-gray-600">
                      {/* {key === "positionOfficial" && index < 3 ? (
                        <span className="mr-2">{getCupIcon(item[key])}</span>
                      ) : null} */}
                      {item[key] !== null && item[key] !== undefined ? item[key] : "-"}
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
  const [meetingDate, setMeetingDate] = useState("");
  const [racesData, setRacesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedRaceRecords, setSelectedRaceRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const fetchRacesData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        meetingDate,
      }).toString();

      const response = await fetch(
        `https://horseracesbackend-production.up.railway.app/api/APIData_Table2?${queryParams}`
      );
      const data = await response.json();
      
      const races = Object.values(
        data.data.reduce((acc, record) => {
          if (!acc[record.raceTitle]) {
            acc[record.raceTitle] = {
              raceTitle: record.raceTitle,
              countryCode: record.countryCode,
              courseName: record.courseName,
              courseId: record.courseId, // Add courseId here
              raceNumber: record.raceNumber, // Add raceNumber here
              raceSurfaceName: record.raceSurfaceName,
              numberOfRunners: record.numberOfRunners,
              prizeFund: record.prizeFund,
              topHorses: { 1: null, 2: null, 3: null },
              allHorses: [], // New column for all horses
              records: [],
            };
          }
      
          // Add the horse to the `allHorses` array
          acc[record.raceTitle].allHorses.push({
            horseName: record.horseName,
            positionOfficial: record.positionOfficial,
            sireName: record.sireName,
            damName: record.damName,
            // Add any other necessary fields here
          });
      
          // Assign the horse to `topHorses` if it is in the top 3
          if (record.positionOfficial === 1 && !acc[record.raceTitle].topHorses[1]) {
            acc[record.raceTitle].topHorses[1] = {
              horseName: record.horseName,
              positionOfficial: record.positionOfficial,
            };
          }
          if (record.positionOfficial === 2 && !acc[record.raceTitle].topHorses[2]) {
            acc[record.raceTitle].topHorses[2] = {
              horseName: record.horseName,
              positionOfficial: record.positionOfficial,
            };
          }
          if (record.positionOfficial === 3 && !acc[record.raceTitle].topHorses[3]) {
            acc[record.raceTitle].topHorses[3] = {
              horseName: record.horseName,
              positionOfficial: record.positionOfficial,
            };
          }
      
          acc[record.raceTitle].records.push(record);
          return acc;
        }, {})
      );
      
      // Sort allHorses by positionOfficial
      races.forEach((race) => {
        race.allHorses.sort((a, b) => a.positionOfficial - b.positionOfficial);
      });
      

      races.forEach((race) => {
        race.topHorses = Object.values(race.topHorses).filter((horse) => horse !== null);
      });

      setRacesData(races);
      setCountryOptions([...new Set(races.map((race) => race.countryCode))]);
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

  useEffect(() => {
    if (selectedCountry) {
      const courses = racesData
        .filter((race) => race.countryCode === selectedCountry)
        .map((race) => race.courseName);
      setCourseOptions([...new Set(courses)]);
      setSelectedCourse("");
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedCourse) {
      setFilteredData(
        racesData.filter(
          (race) =>
            race.countryCode === selectedCountry &&
            race.courseName === selectedCourse
        )
      );
    }
  }, [selectedCountry, selectedCourse]);

  const handleTileClick = async (race) => {
    setSelectedRaceRecords(race.records);
    setLogs((prevLogs) => [
      ...prevLogs,
      { date: meetingDate, raceTitle: race.raceTitle },
    ]);
    setShowTable(true);
  
    // Data to be saved in the database
    const raceData = {
      meetingDate,
      raceTitle: race.raceTitle,
      countryCode: race.countryCode,
      courseName: race.courseName,
      courseId: race.courseId, // Add courseId here
      raceNumber: race.raceNumber, // Add raceNumber here
      raceSurfaceName: race.raceSurfaceName,
      numberOfRunners: race.numberOfRunners,
      prizeFund: race.prizeFund,
      allHorses: race.allHorses, // Include all horses
      user: "Tom", // Replace with dynamic user if applicable
    };
  
    console.log("Payload being sent to backend:", raceData);
  
    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/save-race", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(raceData),
      });
  
      if (response.ok) {
        console.log("Race selection saved successfully!");
      } else {
        const errorText = await response.text();
        console.error("Failed to save race selection:", errorText);
      }
    } catch (error) {
      console.error("Error saving race selection:", error);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-4">
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

      {showTable ? (
        <>
          <Button
            onClick={() => setShowTable(false)}
            className="mb-4 bg-blue-500 hover:bg-blue-700 text-white"
          >
            See Races
          </Button>
          <ReportTable tableData={selectedRaceRecords} />
        </>
      ) : (
        <>
          {loading && (
            <Typography
              variant="small"
              className="text-center text-blue-gray-600 mt-6"
            >
              Loading data...
            </Typography>
          )}

          {countryOptions.length > 0 && (
            <Select
              label="Select Country"
              value={selectedCountry}
              onChange={(value) => setSelectedCountry(value)}
              className="max-w-sm"
            >
              {countryOptions.map((country, index) => (
                <Option key={index} value={country}>
                  {country}
                </Option>
              ))}
            </Select>
          )}

          {selectedCountry && courseOptions.length > 0 && (
            <Select
              label="Select Course"
              value={selectedCourse}
              onChange={(value) => setSelectedCourse(value)}
              className="max-w-sm"
            >
              {courseOptions.map((course, index) => (
                <Option key={index} value={course}>
                  {course}
                </Option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((race, index) => (
              <RaceTile key={index} race={race} onClick={handleTileClick} />
            ))}
          </div>

          {logs.length > 0 && <Logs logs={logs} />}
        </>
      )}
    </div>
  );
}

export default Races;
