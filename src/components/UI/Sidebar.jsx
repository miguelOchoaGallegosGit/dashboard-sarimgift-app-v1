import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, FileText, Package, X } from 'lucide-react';

const navItems = [
    { path: '/', label: 'Tablero', icon: LayoutDashboard, matchPaths: ['/', '/dashboard'] },
    { path: '/bandeja', label: 'Bandeja', icon: Inbox, matchPaths: ['/bandeja'] },
    { path: '/cotizaciones', label: 'Cotizaciones', icon: FileText, matchPaths: ['/cotizaciones'] },
    { path: '/inventario', label: 'Inventario', icon: Package, matchPaths: ['/inventario'] },
];

export const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    const isActive = (matchPaths) => matchPaths.includes(location.pathname);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
                {/* Logo Section */}
                <div className="sidebar-header">
                    <img src="/logo.png" alt="SarimGift" className="sidebar-logo" />
                    <button className="sidebar-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-label">MENÚ PRINCIPAL</div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.matchPaths);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
                                onClick={onClose}
                            >
                                <div className="sidebar-link-icon">
                                    <Icon size={20} />
                                </div>
                                <span className="sidebar-link-text">{item.label}</span>
                                {active && <div className="sidebar-link-indicator" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-footer-info">
                        <span className="sidebar-footer-brand">SarimGift</span>
                        <span className="sidebar-footer-version">Dashboard v1.0</span>
                    </div>
                </div>
            </aside>
        </>
    );
};
