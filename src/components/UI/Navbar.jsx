import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Inbox, Sun, Moon, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <img src="/logo.png" alt="SarimGift" className="navbar-logo" />
            </div>

            <div className="navbar-links">
                <Link to="/" className={`navbar-link ${(isActive('/') || isActive('/dashboard')) ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Tablero</span>
                </Link>
                <Link to="/bandeja" className={`navbar-link ${isActive('/bandeja') ? 'active' : ''}`}>
                    <Inbox size={20} />
                    <span>Bandeja</span>
                </Link>
                <Link to="/cotizaciones" className={`navbar-link ${isActive('/cotizaciones') ? 'active' : ''}`}>
                    <FileText size={20} />
                    <span>Cotizaciones</span>
                </Link>
                <Link to="/inventario" className={`navbar-link ${isActive('/inventario') ? 'active' : ''}`}>
                    <Package size={20} />
                    <span>Inventario</span>
                </Link>
            </div>

            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </nav>
    );
};
