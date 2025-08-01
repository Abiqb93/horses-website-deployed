import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const [openSubMenu, setOpenSubMenu] = useState(null); // ❗ Changed to allow only one open submenu
  const sidenavRef = useRef(null);

  const toggleSubMenu = (name) => {
    setOpenSubMenu((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openSidenav &&
        sidenavRef.current &&
        !sidenavRef.current.contains(event.target)
      ) {
        setOpenSidenav(dispatch, false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSidenav, dispatch]);

  return (
    <aside
      ref={sidenavRef}
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100`}
    >
      <div className="relative">
        <Link to="/" className="py-6 px-8 text-center">
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
            {brandName}
          </Typography>
        </Link>
        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className="absolute right-0 top-0 grid rounded-br-none rounded-tl-none xl:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
        </IconButton>
      </div>
      <div className="m-4">
        {routes.map(({ layout, title, pages }, key) => (
          <ul key={key} className="mb-4 flex flex-col gap-1">
            {title && (
              <li className="mx-3.5 mt-4 mb-2">
                <Typography
                  variant="small"
                  color={sidenavType === "dark" ? "white" : "blue-gray"}
                  className="font-black uppercase opacity-75"
                >
                  {title}
                </Typography>
              </li>
            )}
            {pages.map(({ icon, name, path, children }) => (
              <li key={name}>
                {children ? (
                  <>
                    <Button
                      variant="text"
                      color="blue-gray"
                      onClick={() => toggleSubMenu(name)}
                      className="flex items-center gap-4 px-4 capitalize text-sm"
                      fullWidth
                    >
                      {icon}
                      <Typography color="inherit" className="font-medium text-sm">
                        {name}
                      </Typography>
                      {openSubMenu === name ? (
                        <ChevronDownIcon className="w-4 h-4 ml-auto" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 ml-auto" />
                      )}
                    </Button>
                    {openSubMenu === name && (
                      <ul className="ml-6">
                        {children.map((child) => (
                          <li key={child.name}>
                            <NavLink to={`/${layout}${child.path}`}>
                              <Button
                                variant="text"
                                color="blue-gray"
                                className="flex items-center gap-4 px-4 capitalize text-xs"
                                fullWidth
                              >
                                <Typography color="inherit" className="font-medium text-xs">
                                  {child.name}
                                </Typography>
                              </Button>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink to={`/${layout}${path}`}>
                    <Button
                      variant="text"
                      color="blue-gray"
                      className="flex items-center gap-4 px-4 capitalize text-sm"
                      fullWidth
                    >
                      {icon}
                      <Typography color="inherit" className="font-medium text-sm">
                        {name}
                      </Typography>
                    </Button>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/logo-ct.png",
  brandName: "Blandford Bloodstock",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;
