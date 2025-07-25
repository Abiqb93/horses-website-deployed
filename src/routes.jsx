import HorseIcon from "@/assets/icons/Horse.png";
import SireIcon from "@/assets/icons/Sire.png";
import DamIcon from "@/assets/icons/Dam.png";
import OwnerIcon from "@/assets/icons/Owner.png";
import TrainerIcon from "@/assets/icons/Trainer.png";
import JockeyIcon from "@/assets/icons/Jockey.png";
import DashboardIcon from "@/assets/icons/Home.png";
import SigninIcon from "@/assets/icons/Signin.png";
import SignupIcon from "@/assets/icons/Signup.png";
import TablesIcon from "@/assets/icons/Tables.png";

import ChangePassword from "@/pages/dashboard/ChangePassword";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import {
  Home,
  Profile,
  Tables,
  DamProfiles,
  JockeyProfiles,
  OwnerProfiles,
  TrainerProfiles,
  SireRadar,
  DamRadar,
  OwnerRadar,
  JockeyRadar,
  TrainerRadar,
  Races,
  HorseProfiles,
  HorseRadar,
  MyHorses,
  MyRace,
  MareUpLift,
  Broodmare,
  SireProfiles,
  SireGoing,
  ClosingEntries,
  RacesAndEntries,
  EntriesTracking,
  DeclarationsTracking,
  IrelandRaceRecords,
  FranceRaceRecords,
  HorseProfilePage,
  RaceDetailPage,
  ProfilePage,
  DailyWatchList,
  MySires,
  MyOwners,
  MyDams,

} from "@/pages/dashboard";

import { SignIn, SignUp} from "@/pages/auth";

const iconStyle = {
  width: "20px",
  height: "16px",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <img src={DashboardIcon} alt="Horse" style={iconStyle} />,
        name: "Dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <img src={DashboardIcon} alt="Horse" style={iconStyle} />,
        name: "Watch List",
        path: "/watchlist",
        element: <DailyWatchList />,
      },
      {
        icon: <img src={TablesIcon} alt="Horse" style={iconStyle} />,
        name: "Races",
        children: [
          { name: "Race Results", path: "/races", element: <Races /> },
          { name: "My Races", path: "/myraces", element: <MyRace /> },
          { name: "Racecards & Entries", path: "/entiresandraces", element: <RacesAndEntries /> },
          { name: "Declarations Tracking", path: "/declarationstracking", element: <DeclarationsTracking /> },
          { name: "Entries Tracking", path: "/entirestracking", element: <EntriesTracking /> },
          { name: "Early Closing Entries", path: "/closingentries", element: <ClosingEntries /> },
          { name: "Ireland Race Records", path: "/irelandracerecords", element: <IrelandRaceRecords /> },
          { name: "France Race Records", path: "/franceracerecords", element: <FranceRaceRecords /> },
          
        ],
      },
      {
        icon: <img src={HorseIcon} alt="Horse" style={iconStyle} />,
        name: "Horse",
        children: [
          { name: "Horse Profile", path: "/horseprofile", element: <HorseProfiles /> },
          { name: "Horse Radar", path: "/horseradar", element: <HorseRadar /> },
          { name: "My Horses", path: "/myhorses", element: <MyHorses /> },
        ],
      },
      {
        icon: <img src={SireIcon} alt="Horse" style={iconStyle} />,
        name: "Sire",
        children: [
          { name: "Sire Table", path: "/profile", element: <Profile /> },
          { name: "Sire Profiles", path: "/sireprofiles", element: <SireProfiles /> },
          { name: "Tracked Sires", path: "/mytrackedsires", element: <MySires /> },
          { name: "Sire Radar", path: "/sireradar", element: <SireRadar /> },
          { name: "Mare Upgrade Analysis", path: "/mareanalysis", element: <MareUpLift /> },
          { name: "Going Reports", path: "/siregoinganalysis", element: <SireGoing /> },

        ],
      },
      {
        icon: <img src={DamIcon} alt="Horse" style={iconStyle} />,
        name: "Dam",
        children: [
          { name: "Dam Profile", path: "/damprofile", element: <DamProfiles /> },
          { name: "Tracked Dams", path: "/trackeddam", element: <MyDams /> },
          { name: "Dam Radar", path: "/damradar", element: <DamRadar /> },
          { name: "Broodmare", path: "/broodmare", element: <Broodmare /> },
        ],
      },
      {
        icon: <img src={OwnerIcon} alt="Horse" style={iconStyle} />,
        name: "Owner",
        children: [
          { name: "Owner Profile", path: "/ownerprofile", element: <OwnerProfiles /> },
          { name: "Tracked Owners", path: "/trackedowners", element: <MyOwners /> },
          { name: "Owner Radar", path: "/ownerradar", element: <OwnerRadar /> },
        ],
      },
      {
        icon: <img src={TrainerIcon} alt="Horse" style={iconStyle} />,
        name: "Trainer",
        children: [
          { name: "Trainer Profile", path: "/trainerprofile", element: <TrainerProfiles /> },
          { name: "Trainer Radar", path: "/trainerradar", element: <TrainerRadar /> },
        ],
      },
      {
        icon: <img src={JockeyIcon} alt="Horse" style={iconStyle} />,
        name: "Jockey",
        children: [
          { name: "Jockey Profile", path: "/jockeyprofile", element: <JockeyProfiles /> },
          { name: "Jockey Radar", path: "/jockeyradar", element: <JockeyRadar /> },
        ],
      },
    ],
    // ⬇️ Hidden route so it doesn't appear in sidebar
    hiddenRoutes: [
      {
        path: "/horse/:horseName",
        element: <HorseProfilePage />,
      },
      { name: "Race Details Page", path: "/racedetails", element: <RaceDetailPage /> },
      {
        name: "User Profile",
        path: "/userprofile",
        element: <ProfilePage />, // ✅ Add this line
      },

        {
          name: "Change Password",         // ✅ Add this block
          path: "/change-password",
          element: <ChangePassword />,
        },
    ],
  },
  {
    title: "",
    layout: "auth",
    pages: [],
    hiddenRoutes: [
      { name: "Sign In", path: "/sign-in", element: <SignIn /> },
      { name: "Sign Up", path: "/sign-up", element: <SignUp /> },
      { name: "Forgot Password", path: "/forgot-password", element: <ForgotPassword /> },
    ],
    //   {
    //     icon: <img src={SigninIcon} alt="Horse" style={iconStyle} />,
    //     name: "Sign In",
    //     path: "/sign-in",
    //     element: <SignIn />,
    //   },
    //   {
    //     icon: <img src={SignupIcon} alt="Horse" style={iconStyle} />,
    //     name: "Sign Up",
    //     path: "/sign-up",
    //     element: <SignUp />,
    //   },

    //   {
    //       name: "Forgot Password",
    //       path: "/forgot-password",
    //       element: <ForgotPassword />,
    //     },
    // ],
  },
];

export default routes;
