import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { sireReportTable, damReportTable, ownerReportTable, jockeyReportTable, trainerReportTable } from "@/data"; // Import all tables

const ROWS_PER_PAGE = 10; // Display 10 rows per page

// Reusable table component for rendering any table
const ReportTable = ({ tableData, title, currentPage, setCurrentPage, totalPages, firstColumn }) => {
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
          className={`px-2 py-1 mx-1 text-sm border ${currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}
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

  const dataForCurrentPage = tableData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <Card>
      <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
        <Typography variant="h6" color="white">{title}</Typography>
      </CardHeader>
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {[firstColumn, "Runners", "Runs", "Winners", "Wins", "Win_Percent", "Stake_Winner", "Stake_Win", "Group_Winner", "Group_Win", "WTR", "SWTR", "GWTR", "Group1_Winners", "Group1_Win", "G1WTR", "WIV", "WOE", "WAX", "RB2"].map((el) => (
                <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataForCurrentPage.map((item, index) => (
              <tr key={index}>
                {[firstColumn, "Runners", "Runs", "Winners", "Wins", "Win_Percent", "Stake_Winner", "Stake_Win", "Group_Winner", "Group_Win", "WTR", "SWTR", "GWTR", "Group1_Winners", "Group1_Win", "G1WTR", "WIV", "WOE", "WAX", "RB2"].map((column) => (
                  <td key={column} className={`py-3 px-5 ${index === dataForCurrentPage.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                      {item[column] || "-"}
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

export function Profile() {
  const [currentPageSire, setCurrentPageSire] = useState(1);
  const [currentPageDam, setCurrentPageDam] = useState(1);
  const [currentPageOwner, setCurrentPageOwner] = useState(1);
  const [currentPageJockey, setCurrentPageJockey] = useState(1);
  const [currentPageTrainer, setCurrentPageTrainer] = useState(1);

  const totalPagesSire = Math.ceil(sireReportTable.length / ROWS_PER_PAGE);
  const totalPagesDam = Math.ceil(damReportTable.length / ROWS_PER_PAGE);
  const totalPagesOwner = Math.ceil(ownerReportTable.length / ROWS_PER_PAGE);
  const totalPagesJockey = Math.ceil(jockeyReportTable.length / ROWS_PER_PAGE);
  const totalPagesTrainer = Math.ceil(trainerReportTable.length / ROWS_PER_PAGE);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <ReportTable
        tableData={sireReportTable}
        title="Sire Report Table"
        currentPage={currentPageSire}
        setCurrentPage={setCurrentPageSire}
        totalPages={totalPagesSire}
        firstColumn="sire"
      />
      <ReportTable
        tableData={damReportTable}
        title="Dam Report Table"
        currentPage={currentPageDam}
        setCurrentPage={setCurrentPageDam}
        totalPages={totalPagesDam}
        firstColumn="dam"
      />
      <ReportTable
        tableData={ownerReportTable}
        title="Owner Report Table"
        currentPage={currentPageOwner}
        setCurrentPage={setCurrentPageOwner}
        totalPages={totalPagesOwner}
        firstColumn="owner"
      />
      <ReportTable
        tableData={jockeyReportTable}
        title="Jockey Report Table"
        currentPage={currentPageJockey}
        setCurrentPage={setCurrentPageJockey}
        totalPages={totalPagesJockey}
        firstColumn="jockey_name"
      />
      <ReportTable
        tableData={trainerReportTable}
        title="Trainer Report Table"
        currentPage={currentPageTrainer}
        setCurrentPage={setCurrentPageTrainer}
        totalPages={totalPagesTrainer}
        firstColumn="trainer_name"
      />
    </div>
  );
}

export default Profile;