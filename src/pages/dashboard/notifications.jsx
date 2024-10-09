import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Slider,
  Select,
  Option,
  Checkbox,
  Button,
  Input,
} from "@material-tailwind/react";

export function Notifications() {
  const [selectedTable, setSelectedTable] = useState("RaceNet Data");
  const [ageRange, setAgeRange] = useState([3, 10]); // Default age range
  const [startDate, setStartDate] = useState(""); // Start date input (dd-mm-yyyy)
  const [endDate, setEndDate] = useState(""); // End date input (dd-mm-yyyy)
  const [selectedCountry, setSelectedCountry] = useState("USA");
  const [selectedProfileType, setSelectedProfileType] = useState("Sire");
  const [winPercentage, setWinPercentage] = useState([0, 100]); // Win percentage range
  const [stakeWinners, setStakeWinners] = useState(false);
  const [groupWinners, setGroupWinners] = useState(false);
  const [group1Winners, setGroup1Winners] = useState(false);

  // Handle table selection
  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      {/* Table Selection */}
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Select Table to Filter
          </Typography>
        </CardHeader>
        <CardBody>
          <Select label="Select Table" value={selectedTable} onChange={handleTableChange}>
            <Option value="RaceNet Data">RaceNet Data</Option>
            <Option value="Times API Data">Times API Data</Option>
            <Option value="Profiles">Profiles</Option>
          </Select>
        </CardBody>
      </Card>

      {/* Filters for RaceNet Data and Times API Data */}
      {(selectedTable === "RaceNet Data" || selectedTable === "Times API Data") && (
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <Typography variant="h6" color="white">
              Apply Filters
            </Typography>
          </CardHeader>
          <CardBody>
            <Typography>Age Range</Typography>
            <Slider
              value={ageRange}
              onChange={(e, newValue) => setAgeRange(newValue)}
              valueLabelDisplay="auto"
              aria-labelledby="age-slider"
              min={2}
              max={12}
            />

            <Typography>Country</Typography>
            <Select
              label="Select Country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <Option value="USA">USA</Option>
              <Option value="UK">UK</Option>
              <Option value="AU">AU</Option>
              <Option value="IRE">IRE</Option>
            </Select>

            <Typography>Select Date Range</Typography>
            <Input
              label="Start Date (dd-mm-yyyy)"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="dd-mm-yyyy"
            />
            <Input
              label="End Date (dd-mm-yyyy)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="dd-mm-yyyy"
              className="mt-4"
            />
          </CardBody>
        </Card>
      )}

      {/* Filters for Profiles */}
      {selectedTable === "Profiles" && (
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <Typography variant="h6" color="white">
              Apply Filters
            </Typography>
          </CardHeader>
          <CardBody>
            <Typography>Type</Typography>
            <Select
              label="Select Type"
              value={selectedProfileType}
              onChange={(e) => setSelectedProfileType(e.target.value)}
            >
              <Option value="Sire">Sire</Option>
              <Option value="Dam">Dam</Option>
              <Option value="Owner">Owner</Option>
              <Option value="Jockey">Jockey</Option>
              <Option value="Trainer">Trainer</Option>
            </Select>

            <Typography>Win Percentage Range</Typography>
            <Slider
              value={winPercentage}
              onChange={(e, newValue) => setWinPercentage(newValue)}
              valueLabelDisplay="auto"
              aria-labelledby="win-percentage-slider"
              min={0}
              max={100}
            />

            <div className="flex items-center gap-4">
              <Checkbox
                label="Stake Winners"
                checked={stakeWinners}
                onChange={() => setStakeWinners(!stakeWinners)}
              />
              <Checkbox
                label="Group Winners"
                checked={groupWinners}
                onChange={() => setGroupWinners(!groupWinners)}
              />
              <Checkbox
                label="Group 1 Winners"
                checked={group1Winners}
                onChange={() => setGroup1Winners(!group1Winners)}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Save Data Button (Pseudo) */}
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Save Data
          </Typography>
        </CardHeader>
        <CardBody>
          <Button className="mt-4">
            Save Data (Pseudo Button)
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export default Notifications;