import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import _ from "lodash";

const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

const HorseProfile = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState("");

  const debouncedSearch = _.debounce((value) => {
    onSearch(value);
  }, 300);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  return (
    <div className="relative mb-0 max-w-lg">
      <div className="flex items-center rounded-full shadow-md border border-gray-300 bg-white overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-gray-500 ml-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-5.197-5.197M16.804 10.804a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search Sire..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none bg-transparent"
          value={inputValue}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

const ROWS_PER_PAGE = 10;

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

  if (!tableData || tableData.length === 0) {
    return <Typography className="text-sm px-4">No data available.</Typography>;
  }

  return (
    <Card className="bg-white text-black">
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {Object.keys(tableData[0] || {}).map((col) => (
                <th
                  key={col}
                  className="border-b border-blue-gray-50 py-3 px-5 text-left"
                >
                  <Typography variant="small" className="text-[11px] font-bold uppercase">
                    {col.replace(/_/g, " ")}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                {Object.keys(item).map((key, i) => (
                  <td
                    key={i}
                    className={`py-3 px-5 ${index === tableData.length - 1 ? "" : "border-b border-blue-gray-50"}`}
                  >
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                      {item[key] !== null && item[key] !== undefined ? item[key] : "-"}
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

export function SireGoing() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGoing, setSelectedGoing] = useState("sire_going_firm");
  const [searchQuery, setSearchQuery] = useState("");

  const goingOptions = [
    { label: "Unknown", value: "sire_going_unknown" },
    { label: "Firm", value: "sire_going_firm" },
    { label: "Good/Firm", value: "sire_going_good_firm" },
    { label: "Good", value: "sire_going_good" },
    { label: "Heavy", value: "sire_going_heavy" },
    { label: "Soft", value: "sire_going_soft" },
  ];

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ROWS_PER_PAGE);
    if (searchQuery) params.append("sire", searchQuery);
    return params.toString();
  };

  const fetchData = async () => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/going/${selectedGoing}?${queryParams}`);
      const data = await response.json();
      setTableData(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedGoing, searchQuery]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-6">
      <div className="flex items-center mb-0 gap-4">
        <label htmlFor="going-select" className="text-sm">Select Going:</label>
        <select
          id="going-select"
          value={selectedGoing}
          onChange={(e) => {
            setSelectedGoing(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 text-sm border rounded-md border-gray-300"
        >
          {goingOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <HorseProfile onSearch={(query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to page 1 when searching
      }} />

      <ReportTable
        tableData={tableData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export default SireGoing;
