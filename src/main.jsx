import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/css/index.css';
import RouterConfig from './config/routerConfig'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterConfig /> 
  </StrictMode>
);