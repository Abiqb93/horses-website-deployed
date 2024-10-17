import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { authorsTableData, projectsTableData } from "@/data";

const ROWS_PER_PAGE = 10; // Display 10 rows per page

export function Tables() {
  const [selectedTable, setSelectedTable] = useState("RaceNet"); // State to track the selected table
  const [currentPageAuthors, setCurrentPageAuthors] = useState(1); // Pagination for Authors table
  const [currentPageProjects, setCurrentPageProjects] = useState(1); // Pagination for Projects table
  const [currentPageGroup, setCurrentPageGroup] = useState(1); // Track current group of pages
  const [countryFilter, setCountryFilter] = useState(""); // State for the country filter
  const [ageRange, setAgeRange] = useState([0, 10]); // State for the age range filter
  const [startDate, setStartDate] = useState(""); // State for the start date filter
  const [endDate, setEndDate] = useState(""); // State for the end date filter

  // Get unique countries for the dropdown based on the selected table
  const uniqueCountries = selectedTable === "RaceNet" 
    ? [...new Set(authorsTableData.map(item => item.country))] 
    : [...new Set(projectsTableData.map(item => item.countryCode))];

  // Filter data based on selected filters for RaceNet (Authors Table)
  const filteredAuthorsData = authorsTableData.filter((item) => {
    const withinCountry = !countryFilter || item.country === countryFilter;
    const withinAge = item.age >= ageRange[0] && item.age <= ageRange[1];
    const withinDate =
      (!startDate || new Date(item.Date) >= new Date(startDate)) &&
      (!endDate || new Date(item.Date) <= new Date(endDate));
    return withinCountry && withinAge && withinDate;
  });
  const authorsData = filteredAuthorsData.slice(
    (currentPageAuthors - 1) * ROWS_PER_PAGE,
    currentPageAuthors * ROWS_PER_PAGE
  );

  // Filter data based on selected filters for TimeAPI (Projects Table)
  const filteredProjectsData = projectsTableData.filter((item) => {
    const withinCountry = !countryFilter || item.countryCode === countryFilter;
    const withinAge = item.horseAge >= ageRange[0] && item.horseAge <= ageRange[1];
    const withinDate =
      (!startDate || new Date(item.meetingDate) >= new Date(startDate)) &&
      (!endDate || new Date(item.meetingDate) <= new Date(endDate));
    return withinCountry && withinAge && withinDate;
  });
  const projectsData = filteredProjectsData.slice(
    (currentPageProjects - 1) * ROWS_PER_PAGE,
    currentPageProjects * ROWS_PER_PAGE
  );

  const totalPagesAuthors = Math.ceil(filteredAuthorsData.length / ROWS_PER_PAGE);
  const totalPagesProjects = Math.ceil(filteredProjectsData.length / ROWS_PER_PAGE);

  // Calculate the start and end page numbers for pagination
  const startPage = (currentPageGroup - 1) * 10 + 1;
  const endPage = Math.min(startPage + 9, selectedTable === "RaceNet" ? totalPagesAuthors : totalPagesProjects);

  // Function to handle page change
  const handlePageChange = (setPageFunc, pageNumber) => {
    setPageFunc(pageNumber);
  };

  const handleNextGroup = () => {
    if (endPage < (selectedTable === "RaceNet" ? totalPagesAuthors : totalPagesProjects)) {
      setCurrentPageGroup((prev) => prev + 1);
      setPageFunc(startPage + 10 > endPage ? endPage : startPage + 10);
    }
  };

  const handlePreviousGroup = () => {
    if (startPage > 1) {
      setCurrentPageGroup((prev) => prev - 1);
      setPageFunc(startPage - 10 <= 0 ? 1 : startPage - 10);
    }
  };

  const Pagination = ({ currentPage, totalPages, setPage }) => {
    return (
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={handlePreviousGroup}
          disabled={startPage === 1}
          className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(10, totalPages - (startPage - 1)) }, (_, index) => (
          <button
            key={startPage + index}
            onClick={() => handlePageChange(setPage, startPage + index)}
            className={`px-2 py-1 mx-1 text-sm border ${currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {startPage + index}
          </button>
        ))}
        <button
          onClick={handleNextGroup}
          disabled={endPage === totalPages}
          className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      {/* Table Selector */}
      <div className="mb-4 border border-gray-300 rounded-lg p-4 w-full max-w-md">
        <Typography variant="h6" className="mb-4">Table Selector</Typography>
        <div className="flex items-center gap-8">
          <label className="flex items-center">
            <img src="/horses-website-deployed/img/RaceNet.jpg" alt="RaceNet Logo" className="w-20 h-20 mr-2" />
            <input
              type="radio"
              value="RaceNet"
              checked={selectedTable === "RaceNet"}
              onChange={() => setSelectedTable("RaceNet")}
              className="mr-2"
            />
            RaceNet Table
          </label>
          <label className="flex items-center">
            <img src="/horses-website-deployed/img/TimeAPI.jpg" alt="TimeAPI Logo" className="w-20 h-20 mr-2" />
            <input
              type="radio"
              value="TimeAPI"
              checked={selectedTable === "TimeAPI"}
              onChange={() => setSelectedTable("TimeAPI")}
              className="mr-2"
            />
            TimeAPI Table
          </label>
        </div>
      </div>

      {/* Data Filters */}
      <div className="mb-4 border border-gray-300 rounded-lg p-4 bg-black text-white w-full">
        <Typography variant="h6" className="mb-4">Data Filters</Typography>
        <div className="flex gap-4">
          {/* Country Filter */}
          <div className="flex-1">
            <label htmlFor="countryFilter" className="block mb-2 font-semibold">Country Filter:</label>
            <select
              id="countryFilter"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full text-black"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          {/* Age Filter */}
          <div className="flex-1">
            <label htmlFor="ageRange" className="block mb-2 font-semibold">Age Range:</label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="10"
                value={ageRange[0]}
                onChange={(e) => setAgeRange([+e.target.value, ageRange[1]])}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="10"
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], +e.target.value])}
                className="w-full ml-2"
              />
            </div>
            <div className="text-sm mt-2">
              Age Range: {ageRange[0]} - {ageRange[1]}
            </div>
          </div>
          {/* Date Filter */}
          <div className="flex-1">
            <label htmlFor="startDate" className="block mb-2 font-semibold">Date Range:</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-black"
              />
              <span className="mx-2">to</span>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-black"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conditionally Render the Selected Table */}
      {selectedTable === "RaceNet" ? (
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <Typography variant="h6" color="white">RaceNet Table</Typography>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["raceTitle", "raceType", "purse", "purseCurrency", "country", "name", "age", "gender", "sire", "dam", "owner", "finalPosition", "Date", "jockey_name", "trainer_name", "Runs", "NumberofRunners", "Win", "Stakes_Win", "Group_Win", "Group1_Win", "xWR", "Odds_winprob", "xWM", "%RB2"].map((el) => (
                    <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {authorsData.map((author, index) => (
                  <tr key={index}>
                    {["raceTitle", "raceType", "purse", "purseCurrency", "country", "name", "age", "gender", "sire", "dam", "owner", "finalPosition", "Date", "jockey_name", "trainer_name", "Runs", "NumberofRunners", "Win", "Stakes_Win", "Group_Win", "Group1_Win", "xWR", "Odds_winprob", "xWM", "%RB2"].map((column) => (
                      <td key={column} className={`py-3 px-5 ${index === authorsData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {author[column] || "-"}
                        </Typography>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={currentPageAuthors} totalPages={totalPagesAuthors} setPage={setCurrentPageAuthors} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <Typography variant="h6" color="white">TimeAPI Table</Typography>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["courseName", "horseName", "horseAge", "horseGender", "positionOfficial", "draw", "jockeyName", "trainerName", "ispFractional", "distanceBeaten", "distanceCumulative", "preRaceAdjustedRating", "preRaceMasterRating", "ownerFullName", "meetingDate", "courseId", "raceNumber", "horseCode", "courseAbbrev", "raceSurfaceChar", "raceSurfaceName", "raceType", "distance", "going", "goingAbbrev", "numberOfRunners", "raceClass", "horseColour", "damName", "sireName", "sirePedigreeCode", "damSireName", "damPedigreeCode", "trainerFullName", "countryCode", "courseType", "idRace", "Runs", "Stakes", "Group", "Group1", "Win", "Stakes_Win", "Group_Win", "Group1_Win", "xWR", "odds_prc", "Odds_winprob", "xWM", "RB", "RB2", "FSARB2", "Date", "Year", "country", "age"].map((el) => (
                    <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectsData.map((project, index) => (
                  <tr key={index}>
                    {["courseName", "horseName", "horseAge", "horseGender", "positionOfficial", "draw", "jockeyName", "trainerName", "ispFractional", "distanceBeaten", "distanceCumulative", "preRaceAdjustedRating", "preRaceMasterRating", "ownerFullName", "meetingDate", "courseId", "raceNumber", "horseCode", "courseAbbrev", "raceSurfaceChar", "raceSurfaceName", "raceType", "distance", "going", "goingAbbrev", "numberOfRunners", "raceClass", "horseColour", "damName", "sireName", "sirePedigreeCode", "damSireName", "damPedigreeCode", "trainerFullName", "countryCode", "courseType", "idRace", "Runs", "Stakes", "Group", "Group1", "Win", "Stakes_Win", "Group_Win", "Group1_Win", "xWR", "odds_prc", "Odds_winprob", "xWM", "RB", "RB2", "FSARB2", "Date", "Year", "country", "age"].map((column) => (
                      <td key={column} className={`py-3 px-5 ${index === projectsData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {project[column] || "-"}
                        </Typography>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={currentPageProjects} totalPages={totalPagesProjects} setPage={setCurrentPageProjects} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Tables;