import React from "react";
import "./Sidebar.css";

const Sidebar = ({
  isOpen,
  setIsOpen,
  view,
  setView,
  peers,
  activeTransfers = 0,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "peers", label: "Peers", icon: "💻", count: peers?.length || 0 },
    { id: "upload", label: "Upload to Peer", icon: "📤" },
    { id: "transfers", label: "Transfers", icon: "🔄", count: activeTransfers },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "files", label: "Received Files", icon: "📁" },
  ];

  return (
    <aside className={`sidebar clay-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-logo">PeerX</div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${view === item.id ? "active" : ""}`}
            onClick={() => {
              setView(item.id);
              setIsOpen(false);
            }}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            {item.count > 0 && (
              <span className="count-badge">{item.count}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
