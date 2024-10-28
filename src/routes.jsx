import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";
import {
  Home,
  Profile,
  Tables,
  Notifications,
  DamProfiles,
  JockeyProfiles,
  OwnerProfiles,
  TrainerProfiles,
  SireRadar,
} from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "Dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Sire",
        children: [
          {
            name: "Sire Profile",
            path: "/profile",
            element: <Profile />,
          },
          {
            name: "Sire Radar",
            path: "/sireradar",
            element: <SireRadar />,
          },
        ],
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Dam",
        children: [
          {
            name: "Dam Profile",
            path: "/damprofile",
            element: <DamProfiles />,
          },
        ],
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Owner",
        children: [
          {
            name: "Owner Profile",
            path: "/ownerprofile",
            element: <OwnerProfiles />,
          },
        ],
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Trainer",
        children: [
          {
            name: "Trainer Profile",
            path: "/trainerprofile",
            element: <TrainerProfiles />,
          },
        ],
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "Jockey",
        children: [
          {
            name: "Jockey Profile",
            path: "/jockeyprofile",
            element: <JockeyProfiles />,
          },
        ],
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Tables",
        path: "/tables",
        element: <Tables />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "Filtering and Download",
        path: "/notifications",
        element: <Notifications />,
      },
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "Sign In",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "Sign Up",
        path: "/sign-up",
        element: <SignUp />,
      },
    ],
  },
];

export default routes;