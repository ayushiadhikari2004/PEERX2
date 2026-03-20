import React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import './Layout.css';

const Layout = ({ 
  children, 
  user, 
  isDark, 
  toggleTheme, 
  onLogout,
  onProfileClick,
  onSettingsClick,
  sidebarOpen,
  setSidebarOpen,
  view,
  setView,
  groups,
  peers,
  selectedGroup,
  selectGroup,
  activeTransfers = 0,
}) => {
  return (
    <div className="layout-wrapper">
      <Navbar
        user={user}
        isDark={isDark}
        toggleTheme={toggleTheme}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={onLogout}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
      />

      <div className="layout-body">
        <Sidebar 
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          view={view}
          setView={setView}
          peers={peers}
          activeTransfers={activeTransfers}
        />

        <div 
          className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
