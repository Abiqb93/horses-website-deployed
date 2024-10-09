import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { authorsTableData, projectsTableData } from "@/data";

const ROWS_PER_PAGE = 10; // Display 10 rows per page

export function Tables() {
  const [currentPageAuthors, setCurrentPageAuthors] = useState(1); // Pagination for Authors table
  const [currentPageProjects, setCurrentPageProjects] = useState(1); // Pagination for Projects table
  const [currentPageGroup, setCurrentPageGroup] = useState(1); // Track current group of pages

  // Get data for current page for Authors table
  const authorsData = authorsTableData.slice(
    (currentPageAuthors - 1) * ROWS_PER_PAGE,
    currentPageAuthors * ROWS_PER_PAGE
  );

  // Get data for current page for Projects table
  const projectsData = projectsTableData.slice(
    (currentPageProjects - 1) * ROWS_PER_PAGE,
    currentPageProjects * ROWS_PER_PAGE
  );

  const totalPagesAuthors = Math.ceil(authorsTableData.length / ROWS_PER_PAGE);
  const totalPagesProjects = Math.ceil(projectsTableData.length / ROWS_PER_PAGE);

  // Calculate the start and end page numbers for pagination
  const startPage = (currentPageGroup - 1) * 10 + 1;
  const endPage = Math.min(startPage + 9, totalPagesAuthors); // Change this line for Projects table

  // Function to handle page change
  const handlePageChange = (setPageFunc, pageNumber) => {
    setPageFunc(pageNumber);
  };

  const handleNextGroup = () => {
    if (endPage < totalPagesAuthors) { // Change this line for Projects table
      setCurrentPageGroup((prev) => prev + 1);
      setCurrentPageAuthors(startPage + 10 > totalPagesAuthors ? totalPagesAuthors : startPage + 10); // Move to the next page
    }
  };

  const handlePreviousGroup = () => {
    if (startPage > 1) {
      setCurrentPageGroup((prev) => prev - 1);
      setCurrentPageAuthors(startPage - 10 <= 0 ? 1 : startPage - 10); // Move to the previous page
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
            key={startPage + index} // Ensure unique keys
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
      {/* RaceNet Table */}
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
                <tr key={index}> {/* Use index as key for the row */}
                  {["raceTitle", "raceType", "purse", "purseCurrency", "country", "name", "age", "gender", "sire", "dam", "owner", "finalPosition", "Date", "jockey_name", "trainer_name", "Runs", "NumberofRunners", "Win", "Stakes_Win", "Group_Win", "Group1_Win", "xWR", "Odds_winprob", "xWM", "%RB2"].map((column) => (
                    <td key={column} className={`py-3 px-5 ${index === authorsData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {author[column] || "-"} {/* Simplified retrieval of data */}
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

      {/* TimeAPI Table */}
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
                <tr key={index}> {/* Use index as key for the row */}
                  {["courseName", "horseName", "horseAge", "horseGender", "positionOfficial", "draw", "jockeyName", "trainerName", "ispFractional", "distanceBeaten", "distanceCumulative", "preRaceAdjustedRating", "preRaceMasterRating", "ownerFullName", "meetingDate", "courseId", "raceNumber", "horseCode", "courseAbbrev", "raceSurfaceChar", "raceSurfaceName", "raceType", "distance", "going", "goingAbbrev", "numberOfRunners", "raceClass", "horseColour", "damName", "sireName", "sirePedigreeCode", "damSireName", "damPedigreeCode", "trainerFullName", "countryCode", "courseType", "idRace", "Runs", "Stakes", "Group", "Group1", "Win", "Stakes_Win", "Group_Win", "Group1_Win", "xWR", "odds_prc", "Odds_winprob", "xWM", "RB", "RB2", "FSARB2", "Date", "Year", "country", "age"].map((column) => (
                    <td key={column} className={`py-3 px-5 ${index === projectsData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {project[column] || "-"} {/* Simplified retrieval of data */}
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
    </div>
  );
}

export default Tables;

