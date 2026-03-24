import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/system-settings`);
                setSettings(response.data);
                applySettings(response.data);
            } catch (error) {
                console.error('Error fetching system settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const applySettings = (data) => {
        if (!data) return;
        
        // Apply colors as CSS variables
        const root = document.documentElement;
        if (data.primaryColor) root.style.setProperty('--accent', data.primaryColor);
        if (data.secondaryColor) root.style.setProperty('--accent-secondary', data.secondaryColor);
        if (data.backgroundColor) root.style.setProperty('--bg', data.backgroundColor);
        if (data.textColor) root.style.setProperty('--text', data.textColor);
        if (data.fontFamily) root.style.setProperty('--sans', data.fontFamily);
    };

    return (
        <SystemContext.Provider value={{ settings, loading }}>
            {!loading && children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => useContext(SystemContext);
