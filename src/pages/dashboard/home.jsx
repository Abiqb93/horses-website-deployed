import {
  Typography,
  Card,
  CardHeader,
  CardBody,
} from "@material-tailwind/react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { authorsTableData } from "@/data";

// Data for charts
const raceDistributionByCountry = [
  { name: 'AE', value: 1670 }, { name: 'AR', value: 19944 }, { name: 'AU', value: 120467 },
  { name: 'BE', value: 941 }, { name: 'BH', value: 1039 }, { name: 'BR', value: 11492 },
  { name: 'CA', value: 12194 }, { name: 'CL', value: 36015 }, { name: 'CZ', value: 1962 },
  { name: 'DE', value: 5711 }, { name: 'FR', value: 45592 }, { name: 'UK', value: 64923 },
  { name: 'US', value: 200594 }, { name: 'ZA', value: 21962 }
];

const mostExpensiveRacesByCountry = [
  { name: 'AE', value: 12000000 }, { name: 'AU', value: 3200000 }, { name: 'UK', value: 1898320 },
  { name: 'US', value: 5000000 }, { name: 'FR', value: 1575000 }, { name: 'JP', value: 4095308 },
  { name: 'SA', value: 17761761 }
];

const raceDistributionByTrack = [
  { name: 'G', value: 688181 }, { name: 'J', value: 36024 }, { name: 'G,J', value: 13558 }
];

const racesDistributionByYear = [
  { year: 2015, value: 1049131 }, { year: 2016, value: 1035202 }, { year: 2017, value: 1006942 },
  { year: 2018, value: 1000066 }, { year: 2019, value: 960752 }, { year: 2020, value: 887765 },
  { year: 2021, value: 797819 }, { year: 2022, value: 994142 }, { year: 2023, value: 965188 }, { year: 2024, value: 738053 }
];

export function Home() {
  // Calculate number of races in Australia from authorsTableData
  const racesInAustralia = authorsTableData.filter(
    (author) => author.country.trim() === "AU" // Filter for Australia
  ).length;

  // Calculate total purse for unique race titles in Australia
  const uniqueRaceTitles = new Set();
  let totalPurse = 0;

  authorsTableData.forEach((author) => {
    if (author.country.trim() === "AU" && !uniqueRaceTitles.has(author.raceTitle)) {
      uniqueRaceTitles.add(author.raceTitle); // Add unique race titles
      totalPurse += parseFloat(author.purse); // Add the purse value
    }
  });

  // Count Stakes_Win in 2024
  const stakesWin2024 = authorsTableData.filter(
    (author) => author.Date.startsWith("2024") && author.Stakes_Win === "1" // Filter for Stakes_Win in 2024
  ).length;

  // Count Stakes_Win in 2023
  const stakesWin2023 = authorsTableData.filter(
    (author) => author.Date.startsWith("2023") && author.Stakes_Win === "1" // Filter for Stakes_Win in 2023
  ).length;

  // Calculate percentage change for Stakes_Win
  const stakesPercentageChange = ((stakesWin2024 - stakesWin2023) / (stakesWin2023 || 1)) * 100; // Avoid division by zero
  const stakesPercentageText = stakesPercentageChange.toFixed(2);
  const stakesPercentageColor = stakesPercentageChange > 0 ? "text-green-500" : "text-red-500"; // Green for increase, red for decrease

  // Count Group_Win in 2024
  const groupWin2024 = authorsTableData.filter(
    (author) => author.Date.startsWith("2024") && author.Group_Win === "1" // Filter for Group_Win in 2024
  ).length;

  // Count Group_Win in 2023
  const groupWin2023 = authorsTableData.filter(
    (author) => author.Date.startsWith("2023") && author.Group_Win === "1" // Filter for Group_Win in 2023
  ).length;

  // Calculate percentage change for Group_Win
  const groupPercentageChange = ((groupWin2024 - groupWin2023) / (groupWin2023 || 1)) * 100; // Avoid division by zero
  const groupPercentageText = groupPercentageChange.toFixed(2);
  const groupPercentageColor = groupPercentageChange > 0 ? "text-green-500" : "text-red-500"; // Green for increase, red for decrease

  // Count Group1_Win in 2024
  const group1Win2024 = authorsTableData.filter(
    (author) => author.Date.startsWith("2024") && author.Group1_Win === "1" // Filter for Group1_Win in 2024
  ).length;

  // Count Group1_Win in 2023
  const group1Win2023 = authorsTableData.filter(
    (author) => author.Date.startsWith("2023") && author.Group1_Win === "1" // Filter for Group1_Win in 2023
  ).length;

  // Calculate percentage change for Group1_Win
  const group1PercentageChange = ((group1Win2024 - group1Win2023) / (group1Win2023 || 1)) * 100; // Avoid division by zero
  const group1PercentageText = group1PercentageChange.toFixed(2);
  const group1PercentageColor = group1PercentageChange > 0 ? "text-green-500" : "text-red-500"; // Green for increase, red for decrease

  return (
    <div className="mt-12">
      {/* Updated Statistics Cards */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Number of Races and Total Purse in Australia */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Races in Australia</Typography>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="text-blue-gray-700 text-sm">
              🐎 {racesInAustralia} Races
            </Typography>
            <Typography variant="h5" className="text-blue-gray-700 text-sm">
              💰 ${totalPurse.toFixed(2)} AUD
            </Typography>
            <hr className="my-2" />
            <Typography className="font-normal text-blue-gray-600 text-xs">
              Total number of races held in Australia and total purse.
            </Typography>
          </CardBody>
        </Card>

        {/* Card 2: Consolidated Stakes Win Information */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Stakes Win Comparison</Typography>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="text-blue-gray-700 text-sm">
              🏆 {stakesWin2024} Wins in 2024
            </Typography>
            <Typography variant="h5" className="text-blue-gray-700 text-sm">
              🏅 {stakesWin2023} Wins in 2023
            </Typography>
            <Typography variant="h4" className={stakesPercentageColor + " text-sm"}>
              {stakesPercentageChange > 0 ? `+${stakesPercentageText}%` : `${stakesPercentageText}%`}
            </Typography>
            <hr className="my-2" />
            <Typography className="font-normal text-blue-gray-600 text-xs">
              Comparison of Stakes Wins between 2023 and 2024.
            </Typography>
          </CardBody>
        </Card>

        {/* Card 3: Group Win Comparison */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Group Win Comparison</Typography>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="text-blue-gray-700 text-sm">
              🏆 {groupWin2024} Wins in 2024
            </Typography>
            <Typography variant="h5" className="text-blue-gray-700 text-sm">
              🏅 {groupWin2023} Wins in 2023
            </Typography>
            <Typography variant="h4" className={groupPercentageColor + " text-sm"}>
              {groupPercentageChange > 0 ? `+${groupPercentageText}%` : `${groupPercentageText}%`}
            </Typography>
            <hr className="my-2" />
            <Typography className="font-normal text-blue-gray-600 text-xs">
              Comparison of Group Wins between 2023 and 2024.
            </Typography>
          </CardBody>
        </Card>

        {/* Card 4: Group1 Win Comparison */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Group1 Win Comparison</Typography>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="text-blue-gray-700 text-sm">
              🏆 {group1Win2024} Wins in 2024
            </Typography>
            <Typography variant="h5" className="text-blue-gray-700 text-sm">
              🏅 {group1Win2023} Wins in 2023
            </Typography>
            <Typography variant="h4" className={group1PercentageColor + " text-sm"}>
              {group1PercentageChange > 0 ? `+${group1PercentageText}%` : `${group1PercentageText}%`}
            </Typography>
            <hr className="my-2" />
            <Typography className="font-normal text-blue-gray-600 text-xs">
              Comparison of Group1 Wins between 2023 and 2024.
            </Typography>
          </CardBody>
        </Card>
      </div>

      {/* Graph Section */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-2">
        {/* Graph 1: Race Distribution by Country */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Race Distribution by Country (2024)</Typography>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={raceDistributionByCountry} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                  {raceDistributionByCountry.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 60%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Graph 2: Most Expensive Races by Country */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Most Expensive Races by Country (2024)</Typography>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostExpensiveRacesByCountry}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Graph 3: Race Distribution by Track */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Race Distribution by Track</Typography>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={raceDistributionByTrack} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                  {raceDistributionByTrack.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 40}, 70%, 60%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Graph 4: Races Distribution by Year */}
        <Card>
          <CardHeader className="p-4 bg-black text-white">
            <Typography variant="h6">Races Distribution by Year</Typography>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={racesDistributionByYear}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Home;