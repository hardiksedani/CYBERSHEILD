import React from 'react';
import { Shield } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ onNavigate, onLogin, onLogout, license }) {
    return (
        <nav className="top-navbar">
            <div className="navbar-left" onClick={() => onNavigate('dashboard')}>
                <Shield size={28} className="navbar-logo" />
                <span className="navbar-brand">CyberShield Security Scanner</span>
            </div>

            <div className="navbar-center">
                <button className="nav-link" onClick={() => onNavigate('network')}>Network Scan</button>
                <button className="nav-link" onClick={() => onNavigate('history')}>History</button>
            </div>

            <div className="navbar-right">
                {license && license.email ? (
                    <div className="navbar-user">
                        <span className="navbar-email">{license.email}</span>
                        <button className="btn-logout" onClick={onLogout}>Logout</button>
                    </div>
                ) : (
                    <>
                        <button className="btn-login" onClick={() => onLogin('login')}>Login</button>
                        <button className="btn-get-started" onClick={() => onLogin('register')}>Register</button>
                    </>
                )}
            </div>
        </nav>
    );
}
