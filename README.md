# CVE DATABASE

This project is a web application designed to manage and display CVE (Common Vulnerabilities and Exposures) data efficiently. It allows users to browse, search, and view detailed CVE information with a dynamic and responsive interface.

## Features
- **Pagination**: Users can view CVE records with dynamic pagination (10, 50, or 100 records per page).
- **Search Functionality**: Search for CVE records by ID or other attributes.
- **Filtering**: Filter CVE records by cve id, publication year, base score and modified last 'N' days.
- **Detailed View**: View complete details of each CVE, including descriptions, severity, and configurations.
- **Dynamic Backend**: Fetch data dynamically from a MongoDB database using an Express.js backend.
- **Server Side Sorting**:Sorts the data in the server side automatically based on published date.
- **Scheduled Synchronization**: Synchronize data from the NVD (National Vulnerability Database) API at regular intervals (24hrs).

## Tech Stack
- **Frontend**:
  - React+Vite
  - Tailwind CSS
  - Axios for API requests
  - React Router for navigation
- **Backend**:
  - Node.js with Express.js
  - Postgres as the database
  - PostgresSQL for schema modeling
- **Database**:
  - Postgres


## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Postgres Database with the following relation schema.
```SQL
CREATE TABLE IF NOT EXISTS vulnerability (
    cve_id TEXT PRIMARY KEY,
    source_identifier TEXT,
    published DATE,
    vuln_status TEXT,
    descriptions JSONB,
    metrics JSONB,
    weakness JSONB,
    configurations JSONB,
    last_modified DATE
);

```

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SarrveshNagarajan/cvedb2.git
   cd cvedb2
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

4. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

5. Open the application in your browser:
   ```
   http://localhost:5173
   ```

## API Endpoints
- **Get CVE List**: `GET /cves/list?page=<page>&limit=<limit>&search=<search>&baseScore=<baseScore>&year=<year>&lastModified=<lastModified>`
- **Get CVE Details**: `GET /cves/:id`

 
