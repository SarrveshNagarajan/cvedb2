const db = require('../config/db');

class CVEService {
    async getCVEsList(filters) {
        const {
            page = 1,
            limit = 10,
            search = '',
            year = '',
            baseScore = '',
            lastModifiedDays = '',
        } = filters;

        const offset = (page - 1) * limit;
        const params = [];
        let paramIndex = 1;
        
        // Building the WHERE clause dynamically
        let whereConditions = [];
        
        // Basic search condition with improved pattern matching
        if (search) {
            params.push(`%${search}%`);
            whereConditions.push(`(
                cve_id ILIKE $${paramIndex} OR
                source_identifier ILIKE $${paramIndex} OR
                descriptions::text ILIKE $${paramIndex}
            )`);
            paramIndex++;
        }

        
        if (year) {
            
            params.push(year);
            whereConditions.push(`EXTRACT(YEAR FROM published)=$${paramIndex}`);
            paramIndex++;
        }

        // Last Modified Days filter
        if (lastModifiedDays) {
            params.push(parseInt(lastModifiedDays));
            whereConditions.push(`
                last_modified >= NOW() - INTERVAL '1 day' * $${paramIndex}
            `);
            paramIndex++;
        }

        // CVSS Score filter with improved score extraction
        if (baseScore) {
            const scoreExpr = `
                COALESCE(
                    (metrics->'cvssMetricV40'->0->'cvssData'->>'baseScore')::numeric,
                    (metrics->'cvssMetricV31'->0->'cvssData'->>'baseScore')::numeric,
                    (metrics->'cvssMetricV30'->0->'cvssData'->>'baseScore')::numeric,
                    (metrics->'cvssMetricV2'->0->'cvssData'->>'baseScore')::numeric
                )
            `;
            params.push(parseFloat(baseScore));
            whereConditions.push(`${scoreExpr} = $${paramIndex}`);
            paramIndex++;
        }
        

        // Combine all conditions
        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Debug log
        console.log('Constructed WHERE clause:', whereClause);
        console.log('Parameters:', params);

        const query = `
            WITH filtered_cves AS (
                SELECT 
                    cve_id as id,
                    source_identifier as "sourceIdentifier",
                    published,
                    last_modified as "lastModified",
                    vuln_status as "vulnStatus",
                    metrics,
                    COALESCE(
                        (metrics->'cvssMetricV31'->0->'baseScore')::numeric,
                        (metrics->'cvssMetricV2'->0->'baseScore')::numeric,
                        0
                    ) as base_score,
                    COUNT(*) OVER() as total_count
                FROM vulnerability
                ${whereClause}
            )
            SELECT *
            FROM filtered_cves
            ORDER BY "lastModified" DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
    
        params.push(limit, offset);
    

        try {
            // Debug log the final query
            console.log('Executing query:', query);
            console.log('With parameters:', params);

            const result = await db.query(query, params);
            
            const totalRecords = result.rows[0]?.total_count || 0;
            const data = result.rows.map(row => ({
                ...row,
                total_count: undefined,
                cvssScore: row.max_cvss_score,
                metrics: typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics
            }));

            // Debug log the results
            console.log(`Found ${data.length} records out of ${totalRecords} total`);

            return {
                data,
                totalRecords: parseInt(totalRecords),
                currentPage: parseInt(page),
                limit: parseInt(limit),
                appliedFilters: {
                    search,
                    year,
                    baseScore,
                    lastModifiedDays
                }
            };
        } catch (error) {
            console.error('Database query error:', error);
            console.error('Failed query:', query);
            console.error('Failed parameters:', params);
            throw new Error(`Failed to fetch CVEs: ${error.message}`);
        }
    }

    async getCVEById(id) {
        const query = `
            SELECT 
                cve_id as "cveId",
                source_identifier as "sourceIdentifier",
                published,
                last_modified as "lastModified",
                vuln_status as "vulnStatus",
                descriptions,
                metrics,
                weakness,
                configurations
            FROM vulnerability
            WHERE cve_id = $1
        `;

        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return null;
        }

        const cve = result.rows[0];
        
        // Parse JSON fields if stored as strings
        ['descriptions', 'metrics', 'weakness', 'configurations'].forEach(field => {
            if (typeof cve[field] === 'string') {
                cve[field] = JSON.parse(cve[field]);
            }
        });

        return cve;
    }
}

module.exports = new CVEService();