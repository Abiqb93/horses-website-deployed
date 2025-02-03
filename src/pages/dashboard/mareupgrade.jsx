const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import _ from "lodash";

const ROWS_PER_PAGE = 10;

const SearchBox = ({ setSearchQuery }) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative mb-4 max-w-lg">
      <Typography variant="small" className="text-sm font-bold text-blue-gray-600">Search by Sire Name</Typography>
      <div className="flex items-center rounded-full shadow-md border border-gray-300 bg-white overflow-hidden focus-within:ring focus-within:ring-blue-300">
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
          placeholder="Search by Sire Name..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
};

const ReportTable = ({ tableData, currentPage, setCurrentPage, totalPages }) => {
  return (
    <Card className="bg-white text-black">
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {["Sire Name", "Dam Name", "Unique Horse Count", "Sire Performance Ratings", "Dam Racing Timeform Rating", "First Runner"].map((el) => (
                <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                {[item.sireName, item.damName, item.Unique_Horse_Count, item.Sire_Performance_Ratings, item.Dam_Racing_Timeform_Rating, item.First_Runner].map((value, i) => (
                  <td key={i} className={`py-3 px-5 ${index === tableData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                      {value !== null && value !== undefined ? value : "-"}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center items-center mt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 10))}
            disabled={currentPage === 1}
            className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(10)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(currentPage + index)}
              className={`px-2 py-1 mx-1 text-sm border ${currentPage === currentPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              {currentPage + index}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 10)}
            className="px-2 py-1 mx-1 text-sm border bg-gray-200"
          >
            Next
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export function MareUpLift() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sireSearchQuery, setSireSearchQuery] = useState("");

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, sireSearchQuery]);  // ✅ Ensure API is triggered when search query changes

  const fetchFilteredData = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: ROWS_PER_PAGE,
      });

      if (sireSearchQuery.trim()) {
        queryParams.append("sireName", sireSearchQuery);
      }

      console.log("Fetching data from:", `https://horseracesbackend-production.up.railway.app/api/mareupdates?${queryParams.toString()}`);

      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/mareupdates?${queryParams.toString()}`);
      const data = await response.json();
      
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <SearchBox setSearchQuery={setSireSearchQuery} />
      <ReportTable 
        tableData={tableData} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        totalPages={totalPages} 
      />
    </div>
  );
}

export default MareUpLift;
