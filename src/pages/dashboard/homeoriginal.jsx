import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";

export function Home() {
  // Updated statistics data with direct navigation paths
  const statistics = {
    Sires: {
      total: 19019,
      metrics: {
        "Winners (%)": 21.22,
        "Win (%)": 7.39,
        "Stake Wins (%)": 1.36,
        "Group Wins (%)": 0.67,
        "Group 1 Wins (%)": 0.18,
        WTR: 32.83,
        "%RB2": 52.70,
      },
      path: "/dashboard/profile", // Direct URL for Sire Profiles
    },
    Dams: {
      total: 280668,
      metrics: {
        "Winners (%)": 50.2,
        "Win (%)": 10.74,
        "Stake Wins (%)": 0.47,
        "Group Wins (%)": 0.23,
        "Group 1 Wins (%)": 0.06,
        WTR: 44.93,
        "%RB2": 46.18,
      },
      path: "/dashboard/damprofile", // Direct URL for Dam Profiles
    },
    Owners: {
      total: 368996,
      metrics: {
        "Winners (%)": 39.59,
        "Win (%)": 10.72,
        "Stake Wins (%)": 0.5,
        "Group Wins (%)": 0.24,
        "Group 1 Wins (%)": 0.06,
        WTR: 37.21,
        "%RB2": 23.64,
      },
      path: "/dashboard/ownerprofile", // Direct URL for Owner Profiles
    },
    Trainers: {
      total: 43704,
      metrics: {
        "Winners (%)": 35.44,
        "Win (%)": 10.74,
        "Stake Wins (%)": 0.47,
        "Group Wins (%)": 0.23,
        "Group 1 Wins (%)": 0.06,
        WTR: 22.61,
        "%RB2": 330.84,
      },
      path: "/dashboard/trainerprofile", // Direct URL for Trainer Profiles
    },
    Jockeys: {
      total: 26435,
      metrics: {
        "Winners (%)": 16.49,
        "Win (%)": 10.74,
        "Stake Wins (%)": 0.47,
        "Group Wins (%)": 0.23,
        "Group 1 Wins (%)": 0.06,
        WTR: 9.77,
        "%RB2": 356.1,
      },
      path: "/dashboard/jockeyprofile", // Direct URL for Jockey Profiles
    },
    Horses: {
      total: 711172,
      metrics: {
        "Winners (%)": 52.55,
        "Win (%)": 10.73,
        "Stake Wins (%)": 0.47,
        "Group Wins (%)": 0.23,
        "Group 1 Wins (%)": 0.06,
        WTR: 52.55,
        "%RB2": 41.07,
      },
      path: "#", // Placeholder URL for Horses
    },
  };

  return (
    <div className="mt-12">
      {/* Statistics Cards */}
      <div className="grid gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(statistics).map(([key, value]) => (
          <Card key={key} className="bg-white text-black">
            <CardHeader className="p-4 border-b border-gray-200">
              <Typography variant="h5" className="font-bold text-center">
                {/* Add Link with black text styling */}
                <Link to={value.path} className="text-black hover:underline">
                  {key}
                </Link>
              </Typography>
            </CardHeader>
            <CardBody>
              <Typography className="font-bold text-lg mb-4">
                Total {key}: {value.total.toLocaleString()}
              </Typography>
              <div className="space-y-2">
                {Object.entries(value.metrics).map(([metric, metricValue]) => (
                  <Typography key={metric} className="text-sm">
                    <span className="font-semibold">{metric}:</span> {metricValue}
                  </Typography>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Home;
