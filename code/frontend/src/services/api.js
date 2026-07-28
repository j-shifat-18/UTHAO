const API_BASE_URL = 'http://localhost:5000/api/v1';

// Helper to get auth token
const getToken = () => localStorage.getItem('uthao_access_token');

export const api = {
  // Health check
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (err) {
      console.warn('Backend server disconnected or starting up:', err.message);
      return { status: 'offline' };
    }
  },

  // Auth endpoints
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (data.data?.access_token) {
      localStorage.setItem('uthao_access_token', data.data.access_token);
      localStorage.setItem('uthao_user', JSON.stringify(data.data.user));
    }
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    if (data.data?.access_token) {
      localStorage.setItem('uthao_access_token', data.data.access_token);
      localStorage.setItem('uthao_user', JSON.stringify(data.data.user));
    }
    return data;
  },

  getProfile: async () => {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch (e) {
      return null;
    }
  },

  logout: async () => {
    const token = getToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('uthao_access_token');
    localStorage.removeItem('uthao_user');
  },

  // Parcel endpoints
  trackParcel: async (trackingNumber) => {
    const res = await fetch(`${API_BASE_URL}/parcels/track/${trackingNumber}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Parcel tracking failed');
    return data.data;
  },

  bookParcel: async (parcelData) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/parcels/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify(parcelData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Booking failed');
    return data.data;
  },

  estimatePrice: async (spec) => {
    const res = await fetch(`${API_BASE_URL}/parcels/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Calculation failed');
    return data.data;
  },

  getMyParcels: async () => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE_URL}/parcels/my-parcels`, { headers });
      if (!res.ok) throw new Error('Failed to fetch shipments');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      return [];
    }
  },

  updateStatus: async (trackingNumber, status, location, notes) => {
    const res = await fetch(`${API_BASE_URL}/parcels/update-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber, status, location, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Status update failed');
    return data.data;
  },

  getBranches: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/parcels/branches`);
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      return [];
    }
  }
};
