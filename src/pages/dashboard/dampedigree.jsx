const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";

const ROWS_PER_PAGE = 10;
const PAGINATION_RANGE = 10;

const SearchBox = ({ setSearchQuery }) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative mb-4 max-w-lg">
      <Typography variant="small" className="text-sm font-bold text-blue-gray-600">
        Search by Horse Name
      </Typography>
      <div className="flex items-center rounded-full shadow-md border border-gray-300 bg-white overflow-hidden focus-within:ring focus-within:ring-blue-300">
        <input
          type="text"
          placeholder="Search by Horse Name..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
};

const ReportTable = ({ tableData, headers, currentPage, setCurrentPage, totalPages }) => {
  const startPage = Math.floor((currentPage - 1) / PAGINATION_RANGE) * PAGINATION_RANGE + 1;
  const endPage = Math.min(startPage + PAGINATION_RANGE - 1, totalPages);

  return (
    <Card className="bg-white text-black">
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                    {header.replace(/_/g, " ")}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                {headers.map((header, i) => (
                  <td key={i} className={`py-3 px-5 ${index === tableData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                      {item[header] !== null && item[header] !== undefined ? item[header] : "-"}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center items-center mt-4">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - PAGINATION_RANGE))} 
            disabled={currentPage === 1} 
            className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50">
            Previous
          </button>
          {[...Array(endPage - startPage + 1)].map((_, index) => (
            <button 
              key={index} 
              onClick={() => setCurrentPage(startPage + index)} 
              className={`px-2 py-1 mx-1 text-sm border ${currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
              {startPage + index}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + PAGINATION_RANGE))} 
            className="px-2 py-1 mx-1 text-sm border bg-gray-200">
            Next
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export function Broodmare() {
  const [tableData, setTableData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [horseSearchQuery, setHorseSearchQuery] = useState("");

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, horseSearchQuery]);

  const fetchFilteredData = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: ROWS_PER_PAGE,
      });

      if (horseSearchQuery.trim()) {
        queryParams.append("horseName", horseSearchQuery);
      }

      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/dampedigree_ratings?${queryParams.toString()}`);
      const data = await response.json();

      setTableData(data.data);
      setTotalPages(data.totalPages);
      if (data.data.length > 0) {
        setHeaders(Object.keys(data.data[0])); // Dynamically get all column names
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <SearchBox setSearchQuery={setHorseSearchQuery} />
      <ReportTable 
        tableData={tableData} 
        headers={headers} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        totalPages={totalPages} 
      />
    </div>
  );
}

export default Broodmare;
