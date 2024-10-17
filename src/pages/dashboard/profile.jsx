import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import {
  Radar
} from 'react-chartjs-2';
import {
  sireReportTable,
  sireReportTableThree,
  sireReportTableOne,
  damReportTable,
  damReportTableThree,
  damReportTableOne,
  ownerReportTable,
  ownerReportTableThree,
  ownerReportTableOne,
  jockeyReportTable,
  jockeyReportTableThree,
  jockeyReportTableOne,
  trainerReportTable,
  trainerReportTableThree,
  trainerReportTableOne
} from "@/data"; // Import all tables

const ROWS_PER_PAGE = 10;

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

const normalize = (value, min, max) => {
  if (max - min === 0) return 0; // Prevent division by zero
  return (value - min) / (max - min);
};

const RadarChart = ({ entry1Data, entry2Data }) => {
  // Define the min and max values for each field to normalize
  const minValues = {
    WTR: 0,
    SWTR: 0,
    GWTR: 0,
    G1WTR: 0,
    WIV: 0,
    WOE: 0,
    WAX: 0,
    RB2: 0,
  };

  const maxValues = {
    WTR: 100, // Replace with actual maximums based on your data if available
    SWTR: 100,
    GWTR: 100,
    G1WTR: 1,
    WIV: 100, // Adjust based on data
    WOE: 1, // Adjust based on data
    WAX: 1, // Adjust based on data
    RB2: 100,
  };

  const data = {
    labels: ["WTR", "SWTR", "GWTR", "G1WTR", "WIV", "WOE", "WAX", "RB2"],
    datasets: [
      {
        label: entry1Data ? entry1Data.sire : "Entry 1",
        data: [
          normalize(entry1Data?.WTR || 0, minValues.WTR, maxValues.WTR),
          normalize(entry1Data?.SWTR || 0, minValues.SWTR, maxValues.SWTR),
          normalize(entry1Data?.GWTR || 0, minValues.GWTR, maxValues.GWTR),
          normalize(entry1Data?.G1WTR || 0, minValues.G1WTR, maxValues.G1WTR),
          normalize((entry1Data?.WIV || 0), minValues.WIV, maxValues.WIV),
          normalize((entry1Data?.WOE || 0), minValues.WOE, maxValues.WOE),
          normalize((entry1Data?.WAX || 0), minValues.WAX, maxValues.WAX),
          normalize(entry1Data?.RB2 || 0, minValues.RB2, maxValues.RB2)
        ],
        fill: true,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        pointBackgroundColor: "rgba(54, 162, 235, 1)"
      },
      {
        label: entry2Data ? entry2Data.sire : "Entry 2",
        data: [
          normalize(entry2Data?.WTR || 0, minValues.WTR, maxValues.WTR),
          normalize(entry2Data?.SWTR || 0, minValues.SWTR, maxValues.SWTR),
          normalize(entry2Data?.GWTR || 0, minValues.GWTR, maxValues.GWTR),
          normalize(entry2Data?.G1WTR || 0, minValues.G1WTR, maxValues.G1WTR),
          normalize((entry2Data?.WIV || 0), minValues.WIV, maxValues.WIV),
          normalize((entry2Data?.WOE || 0), minValues.WOE, maxValues.WOE),
          normalize((entry2Data?.WAX || 0), minValues.WAX, maxValues.WAX),
          normalize(entry2Data?.RB2 || 0, minValues.RB2, maxValues.RB2)
        ],
        fill: true,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        pointBackgroundColor: "rgba(255, 99, 132, 1)"
      }
    ]
  };

  const options = {
    scale: {
      ticks: { beginAtZero: true },
    },
  };

  return (
    <div className="w-1/2">
      <Radar data={data} options={options} />
    </div>
  );
};

const ComparisonTable = ({ entry1, entry2, data, firstColumn }) => {
  const fields = [
    "Runners", "Runs", "Winners", "Wins", "Win_Percent", "Stake_Winner",
    "Stake_Win", "Group_Winner", "Group_Win", "WTR", "SWTR", "GWTR",
    "Group1_Winners", "Group1_Win", "G1WTR", "WIV", "WOE", "WAX", "RB2"
  ];

  const entry1Data = data.find(item => item[firstColumn] === entry1);
  const entry2Data = data.find(item => item[firstColumn] === entry2);

  return (
    <div className="flex">
      <RadarChart entry1Data={entry1Data} entry2Data={entry2Data} />
      <Card className="w-1/2">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-4">
          <Typography variant="h6" color="white">Profiles Comparison</Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-left">Field</th>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-left">{entry1}</th>
                <th className="border-b border-blue-gray-50 py-3 px-5 text-left">{entry2}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={index}>
                  <td className="border-b border-blue-gray-50 py-3 px-5">{field}</td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">{entry1Data ? entry1Data[field] || "-" : "-"}</td>
                  <td className="border-b border-blue-gray-50 py-3 px-5">{entry2Data ? entry2Data[field] || "-" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};

export function Profile() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState("Sire");
  const [selectedPeriod, setSelectedPeriod] = useState("original");
  const [winPercentRange, setWinPercentRange] = useState([0, 100]);
  const [rb2Range, setRb2Range] = useState([0, 100]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedEntry1, setSelectedEntry1] = useState("");
  const [selectedEntry2, setSelectedEntry2] = useState("");

  const handleProfileChange = (e) => {
    setSelectedProfile(e.target.value);
    setCurrentPage(1);
    setSelectedEntry1("");
    setSelectedEntry2("");
  };

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    setCurrentPage(1);
    setSelectedEntry1("");
    setSelectedEntry2("");
  };

  const handleEntry1Change = (e) => setSelectedEntry1(e.target.value);
  const handleEntry2Change = (e) => setSelectedEntry2(e.target.value);

  const handleWinPercentChange = (e) => {
    setWinPercentRange([0, Number(e.target.value)]);
  };

  const handleRb2Change = (e) => {
    setRb2Range([0, Number(e.target.value)]);
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
  };

  const profileDataMap = {
    Sire: {
      data: {
        original: sireReportTable,
        lastThree: sireReportTableThree,
        lastOne: sireReportTableOne
      },
      title: "Sire Report Table",
      firstColumn: "sire"
    },
    Dam: {
      data: {
        original: damReportTable,
        lastThree: damReportTableThree,
        lastOne: damReportTableOne
      },
      title: "Dam Report Table",
      firstColumn: "dam"
    },
    Owner: {
      data: {
        original: ownerReportTable,
        lastThree: ownerReportTableThree,
        lastOne: ownerReportTableOne
      },
      title: "Owner Report Table",
      firstColumn: "owner"
    },
    Jockey: {
      data: {
        original: jockeyReportTable,
        lastThree: jockeyReportTableThree,
        lastOne: jockeyReportTableOne
      },
      title: "Jockey Report Table",
      firstColumn: "jockey_name"
    },
    Trainer: {
      data: {
        original: trainerReportTable,
        lastThree: trainerReportTableThree,
        lastOne: trainerReportTableOne
      },
      title: "Trainer Report Table",
      firstColumn: "trainer_name"
    }
  };

  const { data, title, firstColumn } = profileDataMap[selectedProfile];

  const options = [...new Set(data[selectedPeriod].map(item => item[firstColumn]))];

  const tableData = data[selectedPeriod].filter((row) => {
    const winPercent = parseFloat(row.Win_Percent) || 0;
    const rb2 = parseFloat(row.RB2) || 0;
    return (
      winPercent >= winPercentRange[0] &&
      winPercent <= winPercentRange[1] &&
      rb2 >= rb2Range[0] &&
      rb2 <= rb2Range[1]
    );
  });

  const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <div className="p-4 border rounded-lg mb-4">
        <Typography variant="h5" className="mb-2">Table Selection</Typography>
        <div className="flex flex-wrap space-x-4">
          <label className="flex items-center space-x-2">
            <img src="/img/Sire.jpg" alt="Sire" className="w-16 h-16" />
            <input
              type="radio"
              value="Sire"
              checked={selectedProfile === "Sire"}
              onChange={handleProfileChange}
              className="form-radio"
            />
            <span>Sire</span>
          </label>
          <label className="flex items-center space-x-2">
            <img src="/img/Dam.jpg" alt="Dam" className="w-16 h-16" />
            <input
              type="radio"
              value="Dam"
              checked={selectedProfile === "Dam"}
              onChange={handleProfileChange}
              className="form-radio"
            />
            <span>Dam</span>
          </label>
          <label className="flex items-center space-x-2">
            <img src="/img/Owner.jpg" alt="Owner" className="w-16 h-16" />
            <input
              type="radio"
              value="Owner"
              checked={selectedProfile === "Owner"}
              onChange={handleProfileChange}
              className="form-radio"
            />
            <span>Owner</span>
          </label>
          <label className="flex items-center space-x-2">
            <img src="/img/Jockey.jpg" alt="Jockey" className="w-16 h-16" />
            <input
              type="radio"
              value="Jockey"
              checked={selectedProfile === "Jockey"}
              onChange={handleProfileChange}
              className="form-radio"
            />
            <span>Jockey</span>
          </label>
          <label className="flex items-center space-x-2">
            <img src="/img/Trainer.jpg" alt="Trainer" className="w-16 h-16" />
            <input
              type="radio"
              value="Trainer"
              checked={selectedProfile === "Trainer"}
              onChange={handleProfileChange}
              className="form-radio"
            />
            <span>Trainer</span>
          </label>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-black text-white mb-4">
        <Typography variant="h5" className="mb-2 font-bold">Data Selection</Typography>
        <div className="flex flex-wrap space-x-4">
          <label className="text-white">
            <input
              type="radio"
              value="original"
              checked={selectedPeriod === "original"}
              onChange={handlePeriodChange}
            />
            <span className="ml-2">Original</span>
          </label>
          <label className="text-white">
            <input
              type="radio"
              value="lastThree"
              checked={selectedPeriod === "lastThree"}
              onChange={handlePeriodChange}
            />
            <span className="ml-2">Last 03 Years</span>
          </label>
          <label className="text-white">
            <input
              type="radio"
              value="lastOne"
              checked={selectedPeriod === "lastOne"}
              onChange={handlePeriodChange}
            />
            <span className="ml-2">Last 01 Year</span>
          </label>
        </div>

        <div className="flex flex-wrap space-x-4 mt-4">
          <div className="flex items-center">
            <label htmlFor="country-filter" className="mr-2">Country:</label>
            <select
              id="country-filter"
              value={selectedCountry}
              onChange={handleCountryChange}
              className="p-2 rounded-md text-black"
            >
              <option value="">Select Country</option>
              <option value="UK">UK</option>
              <option value="USA">USA</option>
              <option value="IRE">IRE</option>
              <option value="FR">FR</option>
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="win-percent" className="mr-2">Win Percent:</label>
            <input
              id="win-percent"
              type="range"
              min="0"
              max="100"
              value={winPercentRange[1]}
              onChange={handleWinPercentChange}
              className="slider"
            />
            <span className="ml-2">{winPercentRange[1]}</span>
          </div>

          <div className="flex items-center">
            <label htmlFor="rb2" className="mr-2">RB2:</label>
            <input
              id="rb2"
              type="range"
              min="0"
              max="100"
              value={rb2Range[1]}
              onChange={handleRb2Change}
              className="slider"
            />
            <span className="ml-2">{rb2Range[1]}</span>
          </div>
        </div>
      </div>

      <ReportTable
        tableData={tableData}
        title={title}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        firstColumn={firstColumn}
      />

      <div className="p-4 border rounded-lg bg-gray-100">
        <Typography variant="h5" className="mb-2">Profiles Comparison Tool</Typography>
        <div className="flex space-x-4">
          <div>
            <label htmlFor="entry1" className="block mb-1">Select Entry 1</label>
            <select
              id="entry1"
              value={selectedEntry1}
              onChange={handleEntry1Change}
              className="p-2 border rounded w-full"
            >
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="entry2" className="block mb-1">Select Entry 2</label>
            <select
              id="entry2"
              value={selectedEntry2}
              onChange={handleEntry2Change}
              className="p-2 border rounded w-full"
            >
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Render the Comparison Table if both entries are selected */}
      {selectedEntry1 && selectedEntry2 && (
        <ComparisonTable
          entry1={selectedEntry1}
          entry2={selectedEntry2}
          data={data[selectedPeriod]}
          firstColumn={firstColumn}
        />
      )}
    </div>
  );
}

export default Profile;