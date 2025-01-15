const { syncNVD } = require('./cron');
// Run sync every 24 hours
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

async function startSync() {
    while (true) {
        try {
            await syncNVD();
            // Wait 24 hours before next sync
            await new Promise(resolve => setTimeout(resolve, TWENTY_FOUR_HOURS));
        } catch (error) {
            console.error('Error in sync loop:', error);
            // Wait 5 minutes before retrying on error
            await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        }
    }
}

// Start the sync process
startSync();