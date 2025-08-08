const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const ROWS_PER_PAGE = 10;
const PAGINATION_RANGE = 10;
const REQUIRED_COLUMNS = [
  "horseName",
  "sireName",
  "damName",
  "ownerFullName",
  "max_performanceRating_Target_Variable",
  "avg_performanceRating_Target_Variable",
];

const SearchBox = ({ setSearchQuery }) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative mb-4 max-w-lg">
      <Typography variant="small" className="text-sm font-bold text-blue-gray-600">
        
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [horseSearchQuery, setHorseSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(""); // Sorting column
  const [order, setOrder] = useState("asc"); // Sorting order

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, horseSearchQuery, sortBy, order]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ROWS_PER_PAGE);

    if (horseSearchQuery.trim()) {
      params.append("horseName", horseSearchQuery);
    }

    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    return params.toString();
  };

  const fetchFilteredData = async () => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/dampedigree_ratings?${queryParams}`);
      const data = await response.json();

      const filteredData = data.data.map((entry) =>
        Object.fromEntries(REQUIRED_COLUMNS.map((col) => [col, entry[col] ?? "-"]))
      );

      setTableData(filteredData);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-3">
      <SearchBox setSearchQuery={setHorseSearchQuery} />

      {/* Sorting Section */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <label htmlFor="sortBy" className="text-xs font-semibold">Sort By:</label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-1 text-xs border border-gray-300 rounded-md"
        >
          <option value="">Select Column</option>
          {[
            { value: "horseName", label: "Horse Name" },
            { value: "sireName", label: "Sire Name" },
            { value: "damName", label: "Dam Name" },
            { value: "ownerFullName", label: "Owner" },
            { value: "max_performanceRating_Target_Variable", label: "Max Performance Rating" },
            { value: "avg_performanceRating_Target_Variable", label: "Avg Performance Rating" }
          ].map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <button
          className={`p-1 text-xs rounded ${order === "asc" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setOrder("asc")}
        >
          <FaArrowUp size={12} />
        </button>

        <button
          className={`p-1 text-xs rounded ${order === "desc" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setOrder("desc")}
        >
          <FaArrowDown size={12} />
        </button>
      </div>

      <ReportTable 
        tableData={tableData} 
        headers={REQUIRED_COLUMNS} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        totalPages={totalPages} 
      />
    </div>
  );
}

export default Broodmare;
