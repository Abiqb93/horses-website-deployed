import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import RadarChart from 'react-d3-radar';
import { sireReportTable, sireReportTableThree, sireReportTableOne } from "@/data";

const normalize = (value, min, max) => {
  if (max - min === 0) return 0;
  return (value - min) / (max - min);
};

const D3RadarChart = ({ entry1Data, entry2Data }) => {
  const minValues = { WTR: 0, SWTR: 0, GWTR: 0, G1WTR: 0, WIV: 0, WOE: 0, WAX: 0, RB2: 0 };
  const maxValues = { WTR: 100, SWTR: 100, GWTR: 100, G1WTR: 1, WIV: 100, WOE: 1, WAX: 1, RB2: 100 };

  const chartData = {
    variables: [
      { key: "WTR", label: "WTR" },
      { key: "SWTR", label: "SWTR" },
      { key: "GWTR", label: "GWTR" },
      { key: "G1WTR", label: "G1WTR" },
      { key: "WIV", label: "WIV" },
      { key: "WOE", label: "WOE" },
      { key: "WAX", label: "WAX" },
      { key: "RB2", label: "RB2" }
    ],
    sets: [
      {
        key: "entry1",
        label: entry1Data ? entry1Data.sire : "Entry 1",
        values: {
          WTR: normalize(entry1Data?.WTR || 0, minValues.WTR, maxValues.WTR),
          SWTR: normalize(entry1Data?.SWTR || 0, minValues.SWTR, maxValues.SWTR),
          GWTR: normalize(entry1Data?.GWTR || 0, minValues.GWTR, maxValues.GWTR),
          G1WTR: normalize(entry1Data?.G1WTR || 0, minValues.G1WTR, maxValues.G1WTR),
          WIV: normalize(entry1Data?.WIV || 0, minValues.WIV, maxValues.WIV),
          WOE: normalize(entry1Data?.WOE || 0, minValues.WOE, maxValues.WOE),
          WAX: normalize(entry1Data?.WAX || 0, minValues.WAX, maxValues.WAX),
          RB2: normalize(entry1Data?.RB2 || 0, minValues.RB2, maxValues.RB2)
        }
      },
      {
        key: "entry2",
        label: entry2Data ? entry2Data.sire : "Entry 2",
        values: {
          WTR: normalize(entry2Data?.WTR || 0, minValues.WTR, maxValues.WTR),
          SWTR: normalize(entry2Data?.SWTR || 0, minValues.SWTR, maxValues.SWTR),
          GWTR: normalize(entry2Data?.GWTR || 0, minValues.GWTR, maxValues.GWTR),
          G1WTR: normalize(entry2Data?.G1WTR || 0, minValues.G1WTR, maxValues.G1WTR),
          WIV: normalize(entry2Data?.WIV || 0, minValues.WIV, maxValues.WIV),
          WOE: normalize(entry2Data?.WOE || 0, minValues.WOE, maxValues.WOE),
          WAX: normalize(entry2Data?.WAX || 0, minValues.WAX, maxValues.WAX),
          RB2: normalize(entry2Data?.RB2 || 0, minValues.RB2, maxValues.RB2)
        }
      }
    ]
  };

  return (
    <div className="w-1/2">
      <RadarChart
        width={500}
        height={500}
        padding={70}
        domainMax={1}
        data={chartData}
      />
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
      <D3RadarChart entry1Data={entry1Data} entry2Data={entry2Data} />
      <Card className="w-1/2">
        <CardHeader variant="gradient" color="gray" className="mb-4 p-4">
          <Typography variant="h6" color="white">Profiles Comparison</Typography>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full table-auto text-xs">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-50 py-2 px-4 text-left">Field</th>
                <th className="border-b border-blue-gray-50 py-2 px-4 text-left">{entry1}</th>
                <th className="border-b border-blue-gray-50 py-2 px-4 text-left">{entry2}</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={index}>
                  <td className="border-b border-blue-gray-50 py-2 px-4">{field}</td>
                  <td className="border-b border-blue-gray-50 py-2 px-4">{entry1Data ? entry1Data[field] || "-" : "-"}</td>
                  <td className="border-b border-blue-gray-50 py-2 px-4">{entry2Data ? entry2Data[field] || "-" : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};

export function SireRadar() {
  const [selectedPeriod, setSelectedPeriod] = useState("original");
  const [selectedEntry1, setSelectedEntry1] = useState("");
  const [selectedEntry2, setSelectedEntry2] = useState("");

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    setSelectedEntry1("");
    setSelectedEntry2("");
  };

  const handleEntry1Change = (e) => setSelectedEntry1(e.target.value);
  const handleEntry2Change = (e) => setSelectedEntry2(e.target.value);

  const data = {
    original: sireReportTable,
    lastThree: sireReportTableThree,
    lastOne: sireReportTableOne
  };

  const firstColumn = "sire";
  const options = [...new Set(data[selectedPeriod].map(item => item[firstColumn]))];

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
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

export default SireRadar;