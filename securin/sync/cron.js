// Required dependencies
const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const winston = require('winston');
require('winston-daily-rotate-file');

// Load environment variables
dotenv.config();

// Enhanced logging configuration for production
// Modify the logger configuration to use console for Render
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
});

// Add console logging if not in production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Database configuration with connection retry logic
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Health check for database connection
async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// API configuration with retry logic
const NVD_API_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const RESULTS_PER_PAGE = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function fetchWithRetry(url, params, retries = MAX_RETRIES) {
  try {
    const response = await axios.get(url, {
      params,
      timeout: 30000,
      headers: {
        'User-Agent': 'NVD-Sync-Bot/1.0 (Corporate Security Team)',
        'apiKey': process.env.NVD_API_KEY // Optional: If you have an API key
      }
    });
    return response;
  } catch (error) {
    if (error.response?.status === 429) {
      logger.warn('Rate limited, waiting 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      return fetchWithRetry(url, params, retries);
    }
    
    if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      logger.warn(`Request failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, params, retries - 1);
    }
    
    throw error;
  }
}

async function fetchVulnerabilities(params) {
  const vulnerabilities = new Set();
  let startIndex = 0;
  
  while (true) {
    try {
      const response = await fetchWithRetry(NVD_API_URL, {
        ...params,
        startIndex,
        resultsPerPage: RESULTS_PER_PAGE
      });

      const data = response.data;
      if (!data.vulnerabilities?.length) break;

      data.vulnerabilities.forEach(vuln => vulnerabilities.add(vuln.cve.id));
      
      if (data.vulnerabilities.length < RESULTS_PER_PAGE) break;
      startIndex += RESULTS_PER_PAGE;

    } catch (error) {
      logger.error('Error fetching vulnerabilities:', {
        error: error.message,
        params,
        startIndex
      });
      break;
    }
  }

  return vulnerabilities;
}

async function updateCVE(client, cveId) {
  try {
    const response = await fetchWithRetry(NVD_API_URL, { cveId });
    const vuln = response.data.vulnerabilities?.[0];
    if (!vuln) return;

    const cve = vuln.cve;
    await client.query(`
      INSERT INTO vulnerability (
        cve_id, source_identifier, published, vuln_status,
        descriptions, metrics, weakness, configurations, last_modified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (cve_id) DO UPDATE SET
        source_identifier = EXCLUDED.source_identifier,
        published = EXCLUDED.published,
        vuln_status = EXCLUDED.vuln_status,
        descriptions = EXCLUDED.descriptions,
        metrics = EXCLUDED.metrics,
        weakness = EXCLUDED.weakness,
        configurations = EXCLUDED.configurations,
        last_modified = EXCLUDED.last_modified;
    `, [
      cve.id,
      cve.sourceIdentifier,
      cve.published,
      cve.vulnStatus,
      JSON.stringify(cve.descriptions || []),
      JSON.stringify(vuln.metrics || {}),
      JSON.stringify(cve.weaknesses || []),
      JSON.stringify(cve.configurations || []),
      cve.lastModified
    ]);

    logger.info(`Updated CVE: ${cveId}`);
  } catch (error) {
    logger.error(`Error updating ${cveId}:`, {
      error: error.message,
      stack: error.stack
    });
  }
}

async function syncNVD() {
  const startTime = Date.now();
  logger.info('Starting NVD sync');

  // Check database connection before starting
  if (!await checkDatabaseConnection()) {
    logger.error('Database check failed, aborting sync');
    return;
  }

  const client = await pool.connect();
  try {
    const endDate = new Date();
    const startDate = new Date(endDate - 24 * 60 * 60 * 1000);

    const [modifiedCVEs, publishedCVEs] = await Promise.all([
      fetchVulnerabilities({
        lastModStartDate: startDate.toISOString(),
        lastModEndDate: endDate.toISOString()
      }),
      fetchVulnerabilities({
        pubStartDate: startDate.toISOString(),
        pubEndDate: endDate.toISOString()
      })
    ]);

    const cveIds = new Set([...modifiedCVEs, ...publishedCVEs]);
    logger.info(`Found ${cveIds.size} CVEs to process`);

    // Process CVEs in batches to avoid memory issues
    const batchSize = 50;
    const cveArray = Array.from(cveIds);
    
    for (let i = 0; i < cveArray.length; i += batchSize) {
      const batch = cveArray.slice(i, i + batchSize);
      await Promise.all(batch.map(cveId => updateCVE(client, cveId)));
      logger.info(`Processed batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(cveArray.length/batchSize)}`);
    }

    const duration = (Date.now() - startTime) / 1000;
    logger.info(`Sync completed successfully in ${duration} seconds`);

  } catch (error) {
    logger.error('Sync error:', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    client.release();
  }
}

// If running as a script
if (require.main === module) {
  // Run sync and exit
  syncNVD()
    .then(() => {
      logger.info('Sync process completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Fatal error during sync:', error);
      process.exit(1);
    });
}

// Export for testing or importing
module.exports = { syncNVD, checkDatabaseConnection };