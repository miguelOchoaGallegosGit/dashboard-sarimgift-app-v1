import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const pageTitles = {
    '/': 'Tablero de Pedidos',
    '/dashboard': 'Tablero de Pedidos',
    '/bandeja': 'Bandeja de Pedidos',
    '/cotizaciones': 'Cotizaciones',
    '/inventario': 'Inventario',
};

export const Topbar = ({ onToggleSidebar }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const pageTitle = pageTitles[location.pathname] || 'Dashboard';

    const formattedDate = currentDate.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button
                    className="topbar-menu-btn"
                    onClick={onToggleSidebar}
                    aria-label="Abrir menú"
                >
                    <Menu size={22} />
                </button>
                <div className="topbar-title-section">
                    <h1 className="topbar-title">{pageTitle}</h1>
                </div>
            </div>

            <div className="topbar-right">
                <div className="topbar-date">
                    <Calendar size={16} />
                    <span>{formattedDate}</span>
                </div>

                <button
                    onClick={toggleTheme}
                    className="topbar-theme-toggle"
                    aria-label="Cambiar tema"
                    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
};
