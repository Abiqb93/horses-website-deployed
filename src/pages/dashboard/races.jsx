import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";

const ROWS_PER_PAGE = 10;

// ReportTable Component
const ReportTable = ({ tableData, currentPage, setCurrentPage, totalPages }) => {
  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  const Pagination = () => (
    <div className="flex justify-center items-center mt-4">
      <button
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
      >
        Previous
      </button>
      {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
        <button
          key={index}
          onClick={() => setCurrentPage(startPage + index)}
          className={`px-2 py-1 mx-1 text-sm border ${
            currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {startPage + index}
        </button>
      ))}
      <button
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  return (
    <Card className="bg-white text-black">
      <CardHeader className="mb-8 p-6">
        <Typography variant="h6" className="text-black">Races Data</Typography>
      </CardHeader>
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {Object.keys(tableData[0] || {}).map((columnName) => (
                <th key={columnName} className="border-b border-gray-300 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-600">
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
                  <td key={i} className={`py-3 px-5 border-b border-gray-300`}>
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                      {value !== null && value !== undefined ? value : "-"}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination />
      </CardBody>
    </Card>
  );
};

// Races Component
export function Races() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDate, setSelectedDate] = useState(""); // Date selector state
  const [accessedDates, setAccessedDates] = useState([]); // Stores accessed dates and races

  const fetchRacesData = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: ROWS_PER_PAGE,
        ...(selectedDate && { date: selectedDate }), // Include date if selected
      }).toString();

      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/api_races?${queryParams}`);
      const data = await response.json();

      // Update table data
      setTableData(data.data || []);
      setTotalPages(Math.ceil((data.totalRows || 0) / ROWS_PER_PAGE));

      // Update accessed dates with fetched races if filtering by date
      if (selectedDate) {
        setAccessedDates((prevAccessedDates) => [
          ...prevAccessedDates,
          { date: selectedDate, races: data.data || [] },
        ]);
      }
    } catch (error) {
      console.error("Error fetching races data:", error);
    }
  };

  useEffect(() => {
    fetchRacesData();
  }, [currentPage, selectedDate]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-4">
      {/* Date Selector */}
      <div className="flex gap-4 mb-4">
        <input
          type="date"
          className="border px-3 py-2 rounded"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value); // Use the input value directly
            setCurrentPage(1); // Reset to the first page on date change
          }}
        />
      </div>

      {/* Table */}
      {tableData.length > 0 ? (
        <ReportTable
          tableData={tableData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      ) : (
        <div>No records found for the selected date.</div>
      )}

      {/* Accessed Dates */}
      {accessedDates.length > 0 && (
        <div className="mt-8">
          <Typography variant="h6" className="text-black mb-4">
            Accessed Races by Date
          </Typography>
          {accessedDates.map((entry, index) => (
            <div key={index} className="mb-4">
              <Typography variant="small" className="text-blue-gray-600">
                Date: <strong>{entry.date}</strong>
              </Typography>
              <ul className="list-disc pl-5">
                {entry.races.map((race, idx) => (
                  <li key={idx} className="text-xs text-blue-gray-600">
                    {race.horseName || "Unnamed Race"} - {race.courseName || "Unknown Course"}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Races;
