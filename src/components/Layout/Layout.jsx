import React, { useState } from 'react';
import { Sidebar } from '../UI/Sidebar';
import { Topbar } from '../UI/Topbar';

export const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            <div className="app-main">
                <Topbar onToggleSidebar={toggleSidebar} />
                <main className="app-content">
                    {children}
                </main>
            </div>
        </div>
    );
};
