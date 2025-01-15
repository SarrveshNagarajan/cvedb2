import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import CVElist from './components/CVElist';
import CVEdetails from './components/CVEdetails';
import { Navigate } from 'react-router-dom';



const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/cves/list" element={<CVElist />}></Route>
                <Route path="/cves/:id" element={<CVEdetails />}></Route>
                <Route path="/" element={<Navigate to="/cves/list" />} />
            </Routes>
        </Router>
    );
};

export default App;
