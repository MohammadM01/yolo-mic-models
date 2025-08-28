import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InterviewAnalysis from './components/InterviewAnalysis';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InterviewAnalysis />} />
          <Route path="/interview" element={<InterviewAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;