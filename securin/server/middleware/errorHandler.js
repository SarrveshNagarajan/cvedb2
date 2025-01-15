const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    if (err.type === 'not_found') {
        return res.status(404).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;