import React from "react";
import { NavLink } from "react-router-dom";
import {
  Camera,
  LayoutDashboard,
  User,
  PieChart,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { label } from "framer-motion/client";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navItems = [
    { to: "/", icon: Camera, label: "Analysis" },
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/visualizations", icon: PieChart, label: "Visualizations" },
    { to: "./chatbot", icon: MessageCircle, label: "chatbot" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <Camera className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-semibold">HealthMate</span>
            </motion.div>
            <div className="flex items-center space-x-4">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isActive ? { y: [0, -2, 0] } : {}}
                    >
                      <Icon className="h-5 w-5 mr-2" />
                      {label}
                    </motion.div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
