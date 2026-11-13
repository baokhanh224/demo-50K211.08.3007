import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './globals.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './components/app.jsx';
createRoot(document.getElementById('app')).render(<App/>);
