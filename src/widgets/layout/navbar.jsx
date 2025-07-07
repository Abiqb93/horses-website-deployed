import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import {
  Navbar as MTNavbar,
  Collapse,
  Typography,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import UserContext from "@/context/UserContext";

export function Navbar({ brandName, routes }) {
  const [openNav, setOpenNav] = React.useState(false);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  // ✅ Debug log for current user context
  console.log("🧠 Navbar user context:", user);

  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false)
    );
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth/sign-in");
  };

  const navList = (
    <ul className="mb-4 mt-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {routes.map(({ name, path, icon }) => (
        <Typography
          key={name}
          as="li"
          variant="small"
          color="blue-gray"
          className="capitalize"
        >
          <Link to={path} className="flex items-center gap-1 p-1 font-normal">
            {icon &&
              React.createElement(icon, {
                className: "w-[18px] h-[18px] opacity-50 mr-1",
              })}
            {name}
          </Link>
        </Typography>
      ))}
    </ul>
  );

  const userSection = user ? (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Hi, {user.name}</span>
      <Button
        variant="text"
        size="sm"
        color="red"
        onClick={handleLogout}
      >
        Logout
      </Button>
    </div>
  ) : (
    <Link to="/auth/sign-in">
      <Button variant="gradient" size="sm">
        Sign In
      </Button>
    </Link>
  );

  return (
    <MTNavbar className="p-3">
      <div className="container mx-auto flex items-center justify-between text-blue-gray-900">
        <Link to="/">
          <Typography
            variant="small"
            className="mr-4 ml-2 cursor-pointer py-1.5 font-bold"
          >
            {brandName}
          </Typography>
        </Link>
        <div className="hidden lg:block">{navList}</div>
        <div className="hidden lg:flex items-center gap-4">
          {userSection}
        </div>
        <IconButton
          variant="text"
          size="sm"
          className="ml-auto text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <XMarkIcon strokeWidth={2} className="h-6 w-6" />
          ) : (
            <Bars3Icon strokeWidth={2} className="h-6 w-6" />
          )}
        </IconButton>
      </div>
      <Collapse open={openNav}>
        <div className="container mx-auto">
          {navList}
          <div className="mt-4">{userSection}</div>
        </div>
      </Collapse>
    </MTNavbar>
  );
}

Navbar.defaultProps = {
  brandName: "Material Tailwind React",
};

Navbar.propTypes = {
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Navbar.displayName = "/src/widgets/layout/navbar.jsx";

export default Navbar;
