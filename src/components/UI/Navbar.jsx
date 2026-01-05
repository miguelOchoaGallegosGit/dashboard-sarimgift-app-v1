import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle } from 'lucide-react';

export const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-panel navbar">
            <div className="navbar-brand">
                <img src="/logo.png" alt="SarimGift Logo" className="navbar-logo" />
                <span>Sarim<span style={{ color: 'var(--primary-color)' }}>Gift</span></span>
            </div>

            <div className="navbar-actions">
                <Link to="/" className={`btn ${isActive('/') ? 'btn-primary' : 'btn-secondary'}`}>
                    <PlusCircle size={18} />
                    <span>Nuevo Pedido</span>
                </Link>
                <Link to="/dashboard" className={`btn ${isActive('/dashboard') ? 'btn-primary' : 'btn-secondary'}`}>
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </Link>
            </div>
        </nav>
    );
};
