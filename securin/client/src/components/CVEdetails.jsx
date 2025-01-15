import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CVEdetails = () => {
    const { id } = useParams();
    const [cve, setCve] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCVE = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/cves/${id}`);
                setCve(response.data);
                setLoading(false);
            } catch (err) {
                setError(err);
                setLoading(false);
            }
        };
        fetchCVE();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Error Loading Data</h3>
                <p>{error.message}</p>
            </div>
        </div>
    );

    const metrics = cve?.metrics;
    const selectedMetric = metrics?.cvssMetricV40?.[0] || metrics?.cvssMetricV31?.[0] || metrics?.cvssMetricV30?.[0] || metrics?.cvssMetricV2?.[0];
    const cvssData = selectedMetric?.cvssData;
    const configurations = cve?.configurations?.[0]?.nodes?.[0]?.cpeMatch || [];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">{cve.cveId}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        cve.vulnStatus === 'Modified' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {cve.vulnStatus}
                    </span>
                </div>
                <div className="flex space-x-4 text-sm text-gray-500 mt-2">
                    <span>Published: {new Date(cve.published).toLocaleDateString()}</span>
                    <span>Modified: {new Date(cve.lastModified).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6">
                {/* Description */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <div className="space-y-4">
                        {cve.descriptions?.map((desc, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded">
                                <div className="text-sm font-medium text-gray-500 mb-1">
                                    Language: {desc.lang.toUpperCase()}
                                </div>
                                <p className="text-gray-700">{desc.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CPE Match Data */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">CPE</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CPE Criteria
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vulnerability Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Match Criteria ID
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {configurations.map((match, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 text-sm font-mono">
                                            {match.criteria}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                match.vulnerable ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {match.vulnerable ? 'Vulnerable' : 'Not Vulnerable'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {match.matchCriteriaId}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CVSS Metrics */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">CVSS {cvssData?.version} Metrics</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Base Score: 
                            <span className="mx-2 px-3 py-1 rounded-full font-medium bg-gray-200">
                                {cvssData?.baseScore.toFixed(1)} 
                            </span>
                            </span>
                            <span className="font-medium">Base Severity: 
                            <span className="mx-2 px-3 py-1 rounded-full bg-gray-200 font-medium">{cvssData?.baseSeverity}</span>
                            </span>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="font-medium mb-2">Vector String:</p>
                            <code className="text-sm break-words">{cvssData?.vectorString}</code>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">Access Vector</p>
                                <p className="text-sm">{cvssData?.accessVector}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">Access Complexity</p>
                                <p className="text-sm">{cvssData?.accessComplexity}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">Authentication</p>
                                <p className="text-sm">{cvssData?.authentication}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <p className="font-medium mb-1">Confidentiality</p>
                                <p className="text-sm">{cvssData?.confidentialityImpact}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <p className="font-medium mb-1">Integrity</p>
                                <p className="text-sm">{cvssData?.integrityImpact}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <p className="font-medium mb-1">Availability</p>
                                <p className="text-sm">{cvssData?.availabilityImpact}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">Exploitability Score</p>
                                <p className="text-lg">{selectedMetric?.exploitabilityScore}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded">
                                <p className="font-medium">Impact Score</p>
                                <p className="text-lg">{selectedMetric?.impactScore}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVEdetails;