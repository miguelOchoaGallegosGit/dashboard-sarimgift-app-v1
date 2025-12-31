import React from 'react';
import { Navbar } from '../UI/Navbar';

export const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main className="container fade-in">
                {children}
            </main>
        </>
    );
};
