import '@testing-library/jest-dom';

process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
process.env.REACT_APP_SOCKET_URL = 'http://localhost:5000';

global.IntersectionObserver = class {
  constructor() { this.observe = jest.fn(); this.unobserve = jest.fn(); this.disconnect = jest.fn(); }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

window.scrollTo = jest.fn();

