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
import { Search, Tv } from "lucide-react";

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
  ReviewListPage,
  RacingPost,

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
        icon: <Tv className="w-[20px] h-[16px] text-black" />,
        name: "Daily Watch List",
        path: "/WatchList",
        element: <DailyWatchList />,
      },
      {
        icon: <Search size={16} color="black" style={iconStyle} />,
        name: "Review List",
        path: "/ReviewList",
        element: <ReviewListPage />,
      },
      {
        icon: <img src={TablesIcon} alt="Horse" style={iconStyle} />,
        name: "Races",
        children: [
          { name: "Race Results", path: "/races", element: <Races /> },
          { name: "My Races", path: "/myRaces", element: <MyRace /> },
          { name: "Racecards & Entries", path: "/RacesAndEntries", element: <RacesAndEntries /> },
          { name: "RacingPost", path: "/RacingPost", element: <RacingPost /> },
          { name: "Declarations Tracking", path: "/DeclarationsTracking", element: <DeclarationsTracking /> },
          { name: "Entries Tracking", path: "/EntiresTracking", element: <EntriesTracking /> },
          { name: "Early Closing Entries", path: "/ClosingEntries", element: <ClosingEntries /> },
          { name: "Ireland Race Records", path: "/IrelandRaceRecords", element: <IrelandRaceRecords /> },
          { name: "France Race Records", path: "/FranceRaceRecords", element: <FranceRaceRecords /> },
          
        ],
      },
      {
        icon: <img src={HorseIcon} alt="Horse" style={iconStyle} />,
        name: "Horse",
        children: [
          { name: "Horse Profile", path: "/HorseProfile", element: <HorseProfiles /> },
          { name: "Horse Radar", path: "/HorseRadar", element: <HorseRadar /> },
          { name: "My Horses", path: "/MyHorses", element: <MyHorses /> },
        ],
      },
      {
        icon: <img src={SireIcon} alt="Horse" style={iconStyle} />,
        name: "Sire",
        children: [
          { name: "Sire Table", path: "/Profile", element: <Profile /> },
          { name: "Sire Profiles", path: "/SireProfiles", element: <SireProfiles /> },
          { name: "Tracked Sires", path: "/MyTrackedSires", element: <MySires /> },
          { name: "Sire Radar", path: "/SireRadar", element: <SireRadar /> },
          { name: "Mare Upgrade Analysis", path: "/MareAnalysis", element: <MareUpLift /> },
          { name: "Going Reports", path: "/SireGoingAnalysis", element: <SireGoing /> },

        ],
      },
      {
        icon: <img src={DamIcon} alt="Horse" style={iconStyle} />,
        name: "Dam",
        children: [
          { name: "Dam Profile", path: "/DamProfile", element: <DamProfiles /> },
          { name: "Tracked Dams", path: "/TrackedDam", element: <MyDams /> },
          { name: "Dam Radar", path: "/DamRadar", element: <DamRadar /> },
          { name: "Broodmare", path: "/BroodMare", element: <Broodmare /> },
        ],
      },
      {
        icon: <img src={OwnerIcon} alt="Horse" style={iconStyle} />,
        name: "Owner",
        children: [
          { name: "Owner Profile", path: "/OwnerProfile", element: <OwnerProfiles /> },
          { name: "Tracked Owners", path: "/TrackedOwners", element: <MyOwners /> },
          { name: "Owner Radar", path: "/OwnerRadar", element: <OwnerRadar /> },
        ],
      },
      {
        icon: <img src={TrainerIcon} alt="Horse" style={iconStyle} />,
        name: "Trainer",
        children: [
          { name: "Trainer Profile", path: "/TrainerProfile", element: <TrainerProfiles /> },
          { name: "Trainer Radar", path: "/TrainerRadar", element: <TrainerRadar /> },
        ],
      },
      {
        icon: <img src={JockeyIcon} alt="Horse" style={iconStyle} />,
        name: "Jockey",
        children: [
          { name: "Jockey Profile", path: "/JockeyProfile", element: <JockeyProfiles /> },
          { name: "Jockey Radar", path: "/JockeyRadar", element: <JockeyRadar /> },
        ],
      },
    ],
    // ⬇️ Hidden route so it doesn't appear in sidebar
    hiddenRoutes: [
      {
        path: "/horse/:horseName",
        element: <HorseProfilePage />,
      },
      { name: "Race Details Page", path: "/RaceDetails", element: <RaceDetailPage /> },
      {
        name: "User Profile",
        path: "/UserProfile",
        element: <ProfilePage />, // ✅ Add this line
      },

        {
          name: "Change Password",         // ✅ Add this block
          path: "/change-Password",
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
