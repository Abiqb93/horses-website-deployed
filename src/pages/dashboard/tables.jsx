import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";

const ROWS_PER_PAGE = 10;

const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

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
        <Typography variant="h6" className="text-black">Racenets Data</Typography>
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
                    {key === "country" && value ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={countryFlagURL(value)}
                          alt={value}
                          className="w-5 h-5"
                        />
                        <span>{value}</span>
                      </div>
                    ) : (
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {value !== null && value !== undefined ? value : "-"}
                      </Typography>
                    )}
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

export function Tables() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRacenetsData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/racenets?page=${currentPage}&limit=${ROWS_PER_PAGE}`);
      const data = await response.json();
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching racenets data:", error);
    }
  };

  useEffect(() => {
    fetchRacenetsData();
  }, [currentPage]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <ReportTable
        tableData={tableData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export default Tables;
