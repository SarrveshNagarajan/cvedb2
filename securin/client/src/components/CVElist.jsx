import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CVElist = () => {
    const [cves, setCves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        year: '',
        baseScore: '',
        lastModifiedDays: ''
    });
    const [activeFilters, setActiveFilters] = useState({});
    const navigate = useNavigate();

    const fetchCVEs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:3000/cves/list`, {
                params: { page, limit, search, ...activeFilters },
            });
            setCves(response.data.data);
            setTotalRecords(response.data.totalRecords);
            setLoading(false);
        } catch (err) {
            setError(err);
            setLoading(false);
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => {
        fetchCVEs();
    }, [page, limit, search, activeFilters]);

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            year: '',
            baseScore: '',
            lastModifiedDays: ''
        });
        setActiveFilters({});
        setPage(1);
    };

    const handleFilterSubmit = () => {
        const nonEmptyFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});
    
        setActiveFilters(nonEmptyFilters); // Triggers fetchCVEs due to dependency in useEffect
        setPage(1); // Reset to the first page after applying filters
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setPage(1);
        await fetchCVEs();
        setFilters({cveId: '',
            year: '',
            baseScore: '',
            lastModifiedDays: ''
        });
        setRefreshing(false);
    };

    const handleLimitChange = (event) => {
        const newLimit = parseInt(event.target.value, 10);
        setLimit(newLimit);
        setPage(1);
    };

    const totalPages = Math.ceil(totalRecords / limit);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'analyzed':
                return 'bg-blue-100 text-blue-800';
            case 'modified':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleRowClick = (cveId) => {
        navigate(`/cves/${cveId}`);
    };

    const renderActiveFilters = () => {
        const filterLabels = {
            year: 'Year',
            baseScore: 'Base Score',
            lastModifiedDays: 'Last Modified Days'
        };

        return Object.entries(activeFilters).length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active Filters:</span>
                {Object.entries(activeFilters).map(([key, value]) => (
                    <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                        {filterLabels[key]}: {value}
                    </span>
                ))}
                <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-800 ml-2"
                >
                    Clear All
                </button>
            </div>
        ) : null;
    };

    const renderFilters = () => (
        <div className="my-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                        type="number"
                        name="year"
                        value={filters.year}
                        onChange={handleFilterChange}
                        min="1999"
                        max={new Date().getFullYear()}
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Base Score</label>
                    <input
                        type="number"
                        name="baseScore"
                        value={filters.baseScore}
                        onChange={handleFilterChange}
                        min="0"
                        max="10"
                        step="0.1"
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Modified in Last N Days</label>
                    <input
                        type="number"
                        name="lastModifiedDays"
                        value={filters.lastModifiedDays}
                        onChange={handleFilterChange}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    
                    />
                </div>

                <div className="flex justify-end space-x-3">
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Clear
                </button>
                <button
                    onClick={handleFilterSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    Apply Filters
                </button>
                </div>
            </div>

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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">CVE Database</h1>
                    <button 
                        onClick={handleRefresh}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                        <Search className="w-5 h-5 text-gray-400 mr-2" />
                        <input 
                            type="search" 
                            placeholder="Search CVEs..."
                            value={search}
                            onChange={handleSearchChange}
                            className="border border -gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="text-gray-600">
                        Total Records: <span className="font-semibold">{totalRecords.toLocaleString()}</span>
                    </div>
                </div>
                {renderFilters()}
                {renderActiveFilters()}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading CVE data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-fixed">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">CVE ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Identifier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Published Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Last Modified</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {cves.map((cve, index) => (
                                    <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(cve.id)}>
                                        <td className="px-6 py-4 text-sm font-medium text-blue-600 truncate">{cve.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 truncate">{cve.sourceIdentifier}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(cve.published).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(cve.lastModified).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cve.vulnStatus)}`}>
                                                {cve.vulnStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Results per page:</label>
                            <select
                                value={limit}
                                onChange={handleLimitChange}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="10">10</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                {`${((page - 1) * limit) + 1} - ${Math.min(page * limit, totalRecords)} of ${totalRecords} records`}
                            </span>

                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1; //near the beginning
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i; //near the end
                                    } else {
                                        pageNum = page - 2 + i; //in the middle
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`px-3 py-1 rounded text-sm font-medium
                                                ${page === pageNum 
                                                    ? 'bg-blue-500 text-white' 
                                                    : 'text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVElist;