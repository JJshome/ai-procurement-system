import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import BidOpportunities from './pages/BidOpportunities';
import DocumentGenerator from './pages/DocumentGenerator';
import StrategyAnalysis from './pages/StrategyAnalysis';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import Collaboration from './pages/Collaboration';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Demo pages
import RfpUpload from './pages/demo/RfpUpload';
import RfpAnalysis from './pages/demo/RfpAnalysis';
import RequirementsReview from './pages/demo/RequirementsReview';
import DocumentGeneration from './pages/demo/DocumentGeneration';
import FinalReview from './pages/demo/FinalReview';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Demo routes */}
        <Route path="/demo" element={<MainLayout />}>
          <Route index element={<RfpUpload />} />
          <Route path="rfp-analysis" element={<RfpAnalysis />} />
          <Route path="requirements-review" element={<RequirementsReview />} />
          <Route path="document-generation" element={<DocumentGeneration />} />
          <Route path="final-review" element={<FinalReview />} />
        </Route>
        
        {/* Main application routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bid-opportunities" element={<BidOpportunities />} />
          <Route path="document-generator" element={<DocumentGenerator />} />
          <Route path="strategy-analysis" element={<StrategyAnalysis />} />
          <Route path="competitor-analysis" element={<CompetitorAnalysis />} />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;