const CVEService = require('../services/cveServices');

class CVEController {
    async getCVEsList(req, res) {
        try {
            // Input validation
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const year = req.query.year ? parseInt(req.query.year) : '';
            const lastModifiedDays = req.query.lastModifiedDays ? parseInt(req.query.lastModifiedDays) : '';
            const baseScore = req.query.baseScore ? parseFloat(req.query.baseScore) : '';

            // Validate inputs
            if (page < 1) {
                return res.status(400).json({ error: 'Page number must be positive' });
            }
            if (limit < 1 || limit > 100) {
                return res.status(400).json({ error: 'Limit must be between 1 and 100' });
            }
            if (year && (year < 1999 || year > 2099)) {
                return res.status(400).json({ error: 'Year must be between 1999 and 2099' });
            }
            if (lastModifiedDays && lastModifiedDays < 1) {
                return res.status(400).json({ error: 'Last modified days must be positive' });
            }

            const filters = {
                page,
                limit,
                search: req.query.search,
                year,
                baseScore,
                lastModifiedDays
            };
            
            const result = await CVEService.getCVEsList(filters);
            res.json(result);
        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch CVE list',
                details: error.message 
            });
        }
    }

    async getCVEById(req, res) {
        try {
            const cve = await CVEService.getCVEById(req.params.id);
            if (!cve) {
                return res.status(404).json({ error: 'CVE not found' });
            }
            res.json(cve);
        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new CVEController();