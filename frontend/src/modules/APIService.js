// API Service for communication with Laravel backend
export class APIService {
    constructor(baseURL) {
        this.baseURL = baseURL || 'http://localhost:3003/api';
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'offline', error: error.message };
        }
    }

    async saveProject(projectData) {
        try {
            const response = await fetch(`${this.baseURL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error saving project:', error);
            return { success: false, error: error.message };
        }
    }

    async loadProject(projectId) {
        try {
            const response = await fetch(`${this.baseURL}/projects/${projectId}`);
            return await response.json();
        } catch (error) {
            console.error('Error loading project:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadPDF(file) {
        try {
            const formData = new FormData();
            formData.append('pdf', file);

            const response = await fetch(`${this.baseURL}/upload-pdf`, {
                method: 'POST',
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Error uploading PDF:', error);
            return { success: false, error: error.message };
        }
    }

    async exportModel(modelData) {
        try {
            const response = await fetch(`${this.baseURL}/export-model`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(modelData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error exporting model:', error);
            return { success: false, error: error.message };
        }
    }
}
