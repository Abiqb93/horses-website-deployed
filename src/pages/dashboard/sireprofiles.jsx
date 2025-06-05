import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import _ from "lodash";
import { ResponsiveRadar } from "@nivo/radar";

const metersToFurlongs = (meters) => (meters / 201.168).toFixed(1);

const fieldLimits = {
    WTR: { min: 0, max: 100 },
    SWTR: { min: 0, max: 16.67 },
    GWTR: { min: 0, max: 7.89 },
    G1WTR: { min: 0, max: 2.27 },
    WIV: { min: 0, max: 9 },
    WOE: { min: -17.91, max: 173.06 },
    WAX: { min: -5.26, max: 163.72 },
    RB2: { min: 0, max: 99.9 },
  };


const DistanceDPIRadarChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = data
    .filter(d => {
      const dpi = Number(d.DPI);
      return d.Distancecategory &&
             !d.Distancecategory.toLowerCase().includes("unknown") &&
             !isNaN(dpi) && isFinite(dpi);
    })
    .map(d => ({
      distance: d.Distancecategory.replace(" (meters)", "").trim(),
      DPI: Number(d.DPI),
    }));

  return (
    <div className="w-full h-[500px] mt-4">
      <Typography variant="h6" className="text-center mb-3 font-semibold text-gray-800">
        Distance Preference Index (DPI)
      </Typography>
      <ResponsiveRadar
        data={chartData}
        keys={["DPI"]}
        indexBy="distance"
        maxValue={40} // Fixed scale for clear grid levels
        valueFormat={v => `${v.toFixed(2)}`}
        margin={{ top: 50, right: 80, bottom: 60, left: 80 }}
        curve="linearClosed"
        borderWidth={3}
        borderColor="#f59e0b"
        gridLevels={4} // 10, 20, 30, 40
        gridShape="circular"
        gridLabelOffset={18}
        enableDots={true}
        dotSize={8}
        dotColor="#fff"
        dotBorderWidth={2}
        dotBorderColor="#f59e0b"
        colors={{ scheme: "nivo" }}
        fillOpacity={0.3}
        blendMode="multiply"
        isInteractive={true}
        legends={[
          {
            anchor: "top-left",
            direction: "column",
            translateX: -50,
            translateY: -40,
            itemWidth: 80,
            itemHeight: 20,
            itemTextColor: "#777",
            symbolSize: 12,
          }
        ]}
        customLayers={[
          // Add numeric labels on the concentric circles
          ({ centerX, centerY, radius, scale }) => {
            const ticks = [10, 20, 30, 40];
            return (
              <g>
                {ticks.map((tick) => {
                  const r = scale(tick);
                  return (
                    <text
                      key={tick}
                      x={centerX + 5}
                      y={centerY - r}
                      fontSize={10}
                      fill="#666"
                      dominantBaseline="central"
                    >
                      {tick}
                    </text>
                  );
                })}
              </g>
            );
          }
        ]}
      />
    </div>
  );
};  
const calculateDPI = (data) => {
  if (!data || data.length === 0) return [];

  const toNumber = (val) => Number(val) || 0;

  const runners = data.map(d => toNumber(d["Runners"]));
  const wins = data.map(d => toNumber(d["Wins"]));
  const winRates = runners.map((r, i) => r ? wins[i] / r : 0);

  const stakesWinners = data.map(d => {
    const str = String(d["SWs (GWs)"] || "");
    const match = str.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  });

  const groupWinners = data.map(d => {
    const str = String(d["SWs (GWs)"] || "");
    const match = str.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : 0;
  });

  const avgEarnings = data.map(d => toNumber(d["Average Earnings (£)"]));

  const normalize = (arr) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return arr.map(v => (max !== min ? ((v - min) / (max - min)) * 100 : 0));
  };

  const normRuns = normalize(runners);
  const normWins = normalize(wins);
  const normWinRate = normalize(winRates);
  const normSWs = normalize(stakesWinners);
  const normGWs = normalize(groupWinners);
  const normAvgEarnings = normalize(avgEarnings);

  return data.map((d, i) => ({
    ...d,
    DPI: (
      0.2 * normRuns[i] +
      0.1 * normWins[i] +
      0.15 * normWinRate[i] +
      0.2 * normSWs[i] +
      0.2 * normGWs[i] +
      0.15 * normAvgEarnings[i]
    ).toFixed(2)
  }));
};


  const sanitizeData = (key, value) => {
    if (typeof value === "string" && value.includes("%")) {
      return parseFloat(value.replace("%", ""));
    }
    return value !== null && value !== undefined ? parseFloat(value) : 0;
  };
  
  const normalize = (value, field) => {
    const fieldLimit = fieldLimits[field];
    const epsilon = 1e-6;
  
    if (!fieldLimit) return 0.5;
  
    let { min, max } = fieldLimit;
    if (field === "WOE" || field === "WAX") {
      const adjust = Math.abs(min);
      value += adjust;
      min += adjust;
      max += adjust;
    }
  
    value = Math.max(value, 0);
    const transformedValue = Math.log1p(value);
    const transformedMin = Math.log1p(Math.max(min, 0));
    const transformedMax = Math.log1p(Math.max(max, epsilon));
  
    if (transformedMax === transformedMin) return 0.5;
  
    const normalized = (transformedValue - transformedMin) / (transformedMax - transformedMin);
    return Math.min(Math.max(normalized, 0), 1);
  };
  

const countryFlagURL = (countryCode) => {
  const correctedCode =
    countryCode === "UK" ? "GB" :
    countryCode === "IRE" ? "IE" :
    countryCode;
    
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

const HorseProfile = ({ setSearchQuery }) => {
  const debouncedSearch = _.debounce((query) => {
    setSearchQuery(query);
  }, 300);

  return (
    <div className="relative mb-4 max-w-lg">
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
          className="flex-grow p-3 text-sm text-gray-700 bg-transparent focus:outline-none"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>
    </div>
  );
};

const ROWS_PER_PAGE = 7;

const ReportTable = ({
  tableData,
  onSireClick,
  hideSireColumn = false,
  forceCountryFirst = false,
  forceGenderFirst = false,
  forceYearFirst = false
}) => {
    if (!tableData || tableData.length === 0) {
      return <Typography className="text-sm px-4">No data available.</Typography>;
    }
  
    let columns = Object.keys(tableData[0]);
  
    if (columns.includes("Distancecategory")) {
      tableData = calculateDPI(tableData);
      if (!columns.includes("DPI")) {
        columns.push("DPI");
      }
    }
    if (hideSireColumn) {
      columns = columns.filter((col) => col !== "Sire");
    }

    if (forceCountryFirst && columns.includes("Country")) {
      columns = ["Country", ...columns.filter((col) => col !== "Country")];
    }  

    if (forceGenderFirst && columns.includes("Gender")) {
      columns = ["Gender", ...columns.filter((col) => col !== "Gender")];
    }

    if (forceYearFirst && columns.includes("Year")) {
      columns = ["Year", ...columns.filter((col) => col !== "Year")];
    }
    return (
      <Card className="bg-white text-black">
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                  >
                    <Typography variant="small" className="text-[11px] font-bold uppercase">
                      {col.replace(/_/g, ' ')}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => {
                    // Clickable Sire (only if not hidden and handler is passed)
                    if (col === "Sire" && onSireClick) {
                      return (
                        <td key={colIndex} className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography
                            className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline"
                            onClick={() => onSireClick(item[col])}
                          >
                            {item[col]}
                          </Typography>
                        </td>
                      );
                    }
  
                    // Country flag
                    if (col === "Country" && item[col]) {
                      return (
                        <td key={colIndex} className="py-3 px-5 border-b border-blue-gray-50">
                          <div className="flex items-center gap-2">
                            <img
                              src={countryFlagURL(item[col])}
                              alt={item[col]}
                              className="w-5 h-5"
                            />
                            <span className="text-xs font-semibold text-blue-gray-600">
                              {item[col]}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (col === "Distancecategory" && typeof item[col] === "string") {
                      const distanceText = item[col].trim();

                      let furlongText = "";

                      if (distanceText.includes("-")) {
                        // ✅ Range like 1001 - 1200
                        const [startM, endM] = distanceText.split("-").map(v => parseInt(v.trim()));
                        if (!isNaN(startM) && !isNaN(endM)) {
                          const startF = metersToFurlongs(startM);
                          const endF = metersToFurlongs(endM);
                          furlongText = `${startF} - ${endF} (furlongs)`;
                        }
                      } else {
                        // ✅ Single bound like <1001m or >2400
                        const numberMatch = distanceText.match(/\d+/);
                        if (numberMatch) {
                          const meters = parseInt(numberMatch[0]);
                          const furlongs = metersToFurlongs(meters);
                          if (distanceText.includes("<")) {
                            furlongText = `<${furlongs} (furlongs)`;
                          } else if (distanceText.includes(">")) {
                            furlongText = `>${furlongs} (furlongs)`;
                          } else {
                            furlongText = `${furlongs} (furlongs)`;
                          }
                        }
                      }

                      return (
                        <td key={colIndex} className="py-3 px-5 border-b border-blue-gray-50">
                          <Typography className="text-xs font-semibold text-blue-gray-600 leading-tight">
                            {`${distanceText} (meters)`}<br />
                            {furlongText}
                          </Typography>
                        </td>
                      );
                    }


  
                    return (
                      <td key={colIndex} className="py-3 px-5 border-b border-blue-gray-50">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {item[col] !== null && item[col] !== undefined ? item[col] : "-"}
                        </Typography>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    );
  };
  

const fetchReportData = async (tableName, setterFn, sireName) => {
try {
    const response = await fetch(
    `https://horseracesbackend-production.up.railway.app/api/${tableName}?sire=${encodeURIComponent(sireName)}`
    );
    const data = await response.json();
    setterFn(data.data || []);
} catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
}
};

const SireRadarChart = ({ sireData }) => {
    const fields = Object.keys(fieldLimits);
    const chartData = fields.map((field) => ({
      field,
      [sireData?.Sire || "Sire"]: normalize(
        sanitizeData(field, field === "RB2" ? sireData?.Percent_RB2 : sireData?.[field]),
        field
      ),
    }));
  
    const maxValue = Math.max(...chartData.map((d) => d[sireData?.Sire || "Sire"] || 0));
  
    return (
      <div className="w-full h-[400px] mt-4">
        <ResponsiveRadar
          data={chartData}
          keys={[sireData?.Sire || "Sire"]}
          indexBy="field"
          maxValue={maxValue}
          margin={{ top: 50, right: 80, bottom: 40, left: 80 }}
          curve="linearClosed"
          borderWidth={2}
          dotSize={6}
          dotColor={{ theme: 'background' }}
          dotBorderWidth={2}
          colors={{ scheme: 'nivo' }}
          animate={true}
          isInteractive={true}
        />
      </div>
    );
  };


const DistancePreferenceRadar = ({ data }) => {
    if (!data || data.length === 0) return null;
  
    // Transform data for radar chart
    const chartData = data.map((item) => ({
      distance: item.Distancecategory,
      preference: item.Runners && item.Winners ? item.Winners / item.Runners : 0,
    }));
  
    return (
      <div className="w-full h-[400px]">
        <ResponsiveRadar
          data={chartData}
          keys={["preference"]}
          indexBy="distance"
          maxValue="auto"
          margin={{ top: 50, right: 80, bottom: 40, left: 80 }}
          curve="linearClosed"
          borderWidth={2}
          borderColor="#f59e0b"
          gridLevels={5}
          gridShape="circular"
          dotSize={8}
          dotColor={{ theme: "background" }}
          dotBorderWidth={2}
          colors={{ scheme: "category10" }}
          fillOpacity={0.3}
          blendMode="multiply"
          animate={true}
          isInteractive={true}
        />
      </div>
    );
  };
  
export function SireProfiles() {
    const [tableData, setTableData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSire, setSelectedSire] = useState(null);
    const [ageReportData, setAgeReportData] = useState([]);
    const [birthyearReportData, setBirthyearReportData] = useState([]);
    const [countryReportData, setCountryReportData] = useState([]);
    const [sexReportData, setSexReportData] = useState([]);
    const [worldwideReportData, setWorldwideReportData] = useState([]);
    const [cropReportData, setCropReportData] = useState([]);
    const [distanceReportData, setDistanceReportData] = useState([]);


    const fetchReportData = async (tableName, setterFn, sireName) => {
        try {
          const response = await fetch(
            `https://horseracesbackend-production.up.railway.app/api/${tableName}?sire=${encodeURIComponent(sireName)}`
          );
          const data = await response.json();
          setterFn(data.data || []);
        } catch (error) {
          console.error(`Error fetching data from ${tableName}:`, error);
        }
      };

    const buildQueryParams = () => {
      const params = new URLSearchParams();
      params.append("page", 1);
      params.append("limit", ROWS_PER_PAGE);
      if (searchQuery) params.append("sire", searchQuery);

      // Always sort by Runners in descending order
      params.append("sortBy", "Runners");
      params.append("order", "desc");

      return params.toString();
    };

  
    const fetchFilteredData = async () => {
      try {
        const queryParams = buildQueryParams();
        const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/sire_profile?${queryParams}`);
        const data = await response.json();
        setTableData(data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    const fetchAgeReportData = async (sireName) => {
      try {
        const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/sire_age_reports?sire=${encodeURIComponent(sireName)}`);
        const data = await response.json();
        setAgeReportData(data.data);
      } catch (error) {
        console.error("Error fetching age analysis data:", error);
      }
    };
  
    const handleSireClick = (sireName) => {
      setSelectedSire(sireName);
    
      fetchReportData("sire_age_reports", setAgeReportData, sireName);
      fetchReportData("sire_birthyear_reports", setBirthyearReportData, sireName);
      fetchReportData("sire_country_reports", setCountryReportData, sireName);
      fetchReportData("sire_sex_reports", setSexReportData, sireName);
      fetchReportData("sire_worldwide_reports", setWorldwideReportData, sireName);
      fetchReportData("sire_crop_reports", setCropReportData, sireName);
      fetchReportData("sire_distance_reports", (data) => {
        const withDPI = calculateDPI(data);
        setDistanceReportData(withDPI);
      }, sireName);
    };
  
    useEffect(() => {
      fetchFilteredData();
    }, [searchQuery]);
  
    return (
        <div className="mt-12 mb-8 flex flex-col gap-6">
          <HorseProfile setSearchQuery={setSearchQuery} />
      
          {/* Main Sire Table */}
          <ReportTable tableData={tableData} onSireClick={handleSireClick} />
      
          {selectedSire && tableData.length > 0 && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <Typography variant="small" className="text-center mb-0 font-semibold text-gray-700">
                  Performance Metrics Radar
                </Typography>
                <SireRadarChart sireData={tableData.find((item) => item.Sire === selectedSire)} />
              </div>
              <div className="w-full md:w-1/2">
                <Typography variant="small" className="text-center mb-6 font-semibold text-gray-700">
                  Distance Preference Radar
                </Typography>
                <DistancePreferenceRadar data={distanceReportData} />
              </div>
            </div>
          )}


          {/* === Step 4: Dynamic Tables for Selected Sire === */}
          {selectedSire && (
            <div className="mt-6 flex flex-col gap-8">
              {ageReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Analysis by Age: {selectedSire}</Typography>
                  <ReportTable tableData={ageReportData} hideSireColumn={true} />
                </div>
              )}
              {birthyearReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Analysis by Birth Year: {selectedSire}</Typography>
                  <ReportTable tableData={birthyearReportData} hideSireColumn={true} />
                </div>
              )}
              {countryReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Analysis by Country: {selectedSire}</Typography>
                  <ReportTable tableData={countryReportData} hideSireColumn={true} forceCountryFirst={true} />
                </div>
              )}
              {sexReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Analysis by Sex: {selectedSire}</Typography>
                  <ReportTable
                    tableData={sexReportData}
                    hideSireColumn={true}
                    forceGenderFirst={true}
                  />
                </div>
              )}
              {worldwideReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Worldwide Analysis: {selectedSire}</Typography>
                  <ReportTable
                    tableData={worldwideReportData}
                    hideSireColumn={true}
                    forceYearFirst={true}
                  />

                </div>
              )}
              {cropReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Analysis by Crop: {selectedSire}</Typography>
                  <ReportTable tableData={cropReportData} hideSireColumn={true} />
                </div>
              )}
              {distanceReportData.length > 0 && (
                <div>
                  <Typography variant="h6" className="mb-2">Analysis by Distance: {selectedSire}</Typography>
                  <ReportTable tableData={distanceReportData} hideSireColumn={true} />
                  <DistanceDPIRadarChart data={distanceReportData} />
                </div>
              )}


            </div>
          )}
        </div>
      );
      
  }
  

export default SireProfiles;
