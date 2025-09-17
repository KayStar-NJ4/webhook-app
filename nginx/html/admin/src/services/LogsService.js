// Logs Service
window.LogsService = {
    // Get logs list with pagination
    async getList(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            level: params.level || '',
            search: params.search || ''
        });
        
        return await window.BaseService.get(`/api/logs?${queryParams}`);
    },

    // Get log by ID
    async getById(id) {
        return await window.BaseService.get(`/api/logs/${id}`);
    },

    // Delete log
    async delete(id) {
        return await window.BaseService.delete(`/api/logs/${id}`);
    },

    // Clear all logs
    async clear() {
        return await window.BaseService.delete('/api/logs/clear');
    },

    // Get log statistics
    async getStats() {
        return await window.BaseService.get('/api/logs/stats');
    }
};
