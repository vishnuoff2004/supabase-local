const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models', () => {
  let notificationStore = [];
  let nextId = 1;

  const MockNotification = {
    create: jest.fn((data) => {
      const notif = { id: nextId++, ...data, isRead: false, createdAt: new Date(), save: jest.fn().mockResolvedValue(true) };
      notificationStore.push(notif);
      return Promise.resolve(notif);
    }),
    findAndCountAll: jest.fn(({ where, order, offset, limit }) => {
      const filtered = notificationStore.filter(n => {
        if (where.userId) return n.userId === where.userId;
        return true;
      });
      const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const rows = sorted.slice(offset || 0, (offset || 0) + (limit || 20));
      return Promise.resolve({ rows, count: filtered.length });
    }),
    findOne: jest.fn(({ where }) => {
      const notifId = Number(where.id);
      const found = notificationStore.find(n => n.id === notifId && n.userId === where.userId);
      return Promise.resolve(found || null);
    }),
    update: jest.fn((values, { where }) => {
      const notifId = where.id ? Number(where.id) : null;
      notificationStore.forEach(n => {
        if (notifId !== null) {
          if (n.id === notifId && n.userId === where.userId) {
            n.isRead = values.isRead;
          }
        } else if (n.userId === where.userId && n.isRead === where.isRead) {
          n.isRead = values.isRead;
        }
      });
      return Promise.resolve([notificationStore.length]);
    }),
    count: jest.fn(({ where }) => {
      const filtered = notificationStore.filter(n => n.userId === where.userId && n.isRead === where.isRead);
      return Promise.resolve(filtered.length);
    }),
  };

  const actual = jest.requireActual('../../src/models');
  return {
    ...actual,
    Notification: MockNotification,
  };
});

const app = require('../../src/app');

describe('Phase 2 Integration — Notification API', () => {
  const token = jwt.sign({ id: 1, role: 'traveler' }, process.env.JWT_SECRET || 'travel-agency-jwt-secret-dev');

  test('GET /api/notifications returns list — TEST-159', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
  });

  test('GET /api/notifications/unread-count returns number', async () => {
    const res = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(typeof res.body.count).toBe('number');
  });

  test('PUT /api/notifications/read-all marks all as read — TEST-158', async () => {
    const res = await request(app).put('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/read/i);
  });

  test('GET /api/notifications without auth returns 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  test('notification created via service appears in list — TEST-156', async () => {
    const { sendNotification } = require('../../src/services/notificationService');
    await sendNotification({ userId: 1, type: 'booking', title: 'Booking Confirmed', body: 'Your booking is confirmed' });

    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBeGreaterThanOrEqual(1);
    const created = res.body.data.find(n => n.title === 'Booking Confirmed');
    expect(created).toBeDefined();
    expect(created.isRead).toBe(false);
  });

  test('PUT /api/notifications/:id/read marks single notification as read — TEST-157', async () => {
    const { sendNotification } = require('../../src/services/notificationService');
    const notif = await sendNotification({ userId: 1, type: 'info', title: 'Mark Read Test', body: 'test' });

    const res = await request(app).put(`/api/notifications/${notif.id}/read`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });
});
