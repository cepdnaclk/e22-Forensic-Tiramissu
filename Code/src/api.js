// src/api.js
const API_URL = 'http://localhost:3000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('fmdbs_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('fmdbs_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('fmdbs_token');
  }

  isLoggedIn() {
    return !!(this.token || localStorage.getItem('fmdbs_token'));
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          // Do not call window.location.reload() to prevent infinite loop
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data.data.user;
  }

  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getClinicalCases(params = {}) {
    const query = new URLSearchParams({ limit: 1000, ...params }).toString();
    return this.request(`/clinical-cases?${query}`);
  }

  async getAutopsyCases(params = {}) {
    const query = new URLSearchParams({ limit: 1000, ...params }).toString();
    return this.request(`/autopsy-cases?${query}`);
  }

  async createPatient(patientData) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async createClinicalCase(caseData) {
    return this.request('/clinical-cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  async getCourtRecords() {
    return this.request('/court-records');
  }

  async createCourtRecord(courtData) {
    return this.request('/court-records', {
      method: 'POST',
      body: JSON.stringify(courtData),
    });
  }

  async createAutopsyCase(caseData) {
    return this.request('/autopsy-cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }
}

export const api = new ApiClient();
