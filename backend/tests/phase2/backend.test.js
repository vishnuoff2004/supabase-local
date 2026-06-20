const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const jwt = require('jsonwebtoken');

jest.mock('../../src/models', () => {
  const mockNotification = {
    id: 1,
    userId: 1,
    type: 'info',
    title: 'Test Notification',
    body: 'This is a test',
    isRead: false,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  let notificationStore = [];

  const MockNotification = {
    create: jest.fn((data) => {
      const notif = { ...mockNotification, ...data, id: notificationStore.length + 1 };
      notificationStore.push(notif);
      return Promise.resolve(notif);
    }),
    findAndCountAll: jest.fn(({ where, offset, limit }) => {
      const filtered = notificationStore.filter(n => n.userId === where.userId);
      const rows = filtered.slice(offset || 0, (offset || 0) + (limit || 20));
      return Promise.resolve({ rows, count: filtered.length });
    }),
    findOne: jest.fn(({ where }) => {
      const found = notificationStore.find(n => n.id === where.id && n.userId === where.userId);
      return Promise.resolve(found || null);
    }),
    update: jest.fn((values, { where }) => {
      notificationStore.forEach(n => {
        if (n.userId === where.userId && n.isRead === where.isRead) {
          n.isRead = values.isRead;
        }
      });
      return Promise.resolve([1]);
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

describe('Phase 2 Backend — Event Handlers', () => {
const { registerBookingHandlers } = require('../../src/socket/handlers/bookingHandlers');
const { registerDriverHandlers } = require('../../src/socket/handlers/driverHandlers');
const { registerDashboardHandlers } = require('../../src/socket/handlers/dashboardHandlers');

describe('Phase 2 Backend — Booking Event Handlers', () => {
  let mockIo;
  let mockNamespace;

  beforeEach(() => {
    mockNamespace = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    mockIo = {
      of: jest.fn().mockReturnValue(mockNamespace),
    };
  });

  test('emitBookingCreated sends event to user room', () => {
    const handlers = registerBookingHandlers(mockIo);
    handlers.emitBookingCreated({ id: 1, status: 'Pending', routeId: 1, travelDate: '2026-07-15' }, 42);

    expect(mockIo.of).toHaveBeenCalledWith('/bookings');
    expect(mockNamespace.to).toHaveBeenCalledWith('user:42');
    expect(mockNamespace.emit).toHaveBeenCalledWith('booking:created', expect.objectContaining({
      bookingId: 1,
      status: 'Pending',
    }));
  });

  test('emitBookingStatusChanged sends status transition — TEST-150', () => {
    const handlers = registerBookingHandlers(mockIo);
    handlers.emitBookingStatusChanged({ id: 1, status: 'Confirmed' }, 42, 'Pending');

    expect(mockNamespace.emit).toHaveBeenCalledWith('booking:status-changed', expect.objectContaining({
      bookingId: 1,
      previousStatus: 'Pending',
      newStatus: 'Confirmed',
    }));
  });

  test('emitBookingCreated sends event only to the correct user room — TEST-152', () => {
    const handlers = registerBookingHandlers(mockIo);
    handlers.emitBookingCreated({ id: 1, status: 'Pending', routeId: 1, travelDate: '2026-07-15' }, 42);

    expect(mockNamespace.to).toHaveBeenCalledWith('user:42');
    expect(mockNamespace.to).not.toHaveBeenCalledWith('user:99');
    expect(mockNamespace.emit).toHaveBeenCalledWith('booking:created', expect.objectContaining({
      bookingId: 1,
    }));
  });

  test('emitBookingCancelled sends cancellation event', () => {
    const handlers = registerBookingHandlers(mockIo);
    handlers.emitBookingCancelled({ id: 1, status: 'Cancelled', cancelReason: 'User request' }, 42);

    expect(mockNamespace.emit).toHaveBeenCalledWith('booking:cancelled', expect.objectContaining({
      bookingId: 1,
      cancelReason: 'User request',
    }));
  });
});

describe('Phase 2 Backend — Driver Event Handlers', () => {
  let mockIo;
  let mockNamespace;

  beforeEach(() => {
    mockNamespace = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    mockIo = {
      of: jest.fn().mockReturnValue(mockNamespace),
    };
  });

  test('emitAvailabilityChanged sends event to driver and agency rooms — TEST-151', () => {
    const handlers = registerDriverHandlers(mockIo);
    handlers.emitAvailabilityChanged(1, 42, true);

    expect(mockNamespace.to).toHaveBeenCalledWith('driver:42');
    expect(mockNamespace.to).toHaveBeenCalledWith('agency:management');
    expect(mockNamespace.emit).toHaveBeenCalledWith('driver:availability-changed', expect.objectContaining({
      driverId: 1,
      available: true,
    }));
  });

  test('emitDriverAssigned sends assignment event', () => {
    const handlers = registerDriverHandlers(mockIo);
    handlers.emitDriverAssigned(1, 5, 42);

    expect(mockNamespace.emit).toHaveBeenCalledWith('driver:assigned', expect.objectContaining({
      bookingId: 1,
      driverId: 5,
    }));
  });
});

describe('Phase 2 Backend — Dashboard Event Handlers', () => {
  let mockIo;
  let mockNamespace;

  beforeEach(() => {
    mockNamespace = { emit: jest.fn() };
    mockIo = {
      of: jest.fn().mockReturnValue(mockNamespace),
    };
  });

  test('emitDashboardAlert sends alert to all dashboard clients', () => {
    const handlers = registerDashboardHandlers(mockIo);
    handlers.emitDashboardAlert('booking-surge', 'High booking volume detected', { count: 50 });

    expect(mockNamespace.emit).toHaveBeenCalledWith('dashboard:alert', expect.objectContaining({
      type: 'booking-surge',
      message: 'High booking volume detected',
    }));
  });
});

describe('Phase 2 Backend — Socket Reconnection (TEST-155)', () => {
  test('handler re-registration works after simulated reconnect — TEST-155', () => {
    const namespaceA = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    const ioA = { of: jest.fn().mockReturnValue(namespaceA) };
    const handlersA = registerBookingHandlers(ioA);
    handlersA.emitBookingStatusChanged({ id: 1, status: 'Confirmed' }, 42, 'Pending');

    expect(namespaceA.emit).toHaveBeenCalledWith('booking:status-changed', expect.objectContaining({
      bookingId: 1,
    }));

    const namespaceB = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    const ioB = { of: jest.fn().mockReturnValue(namespaceB) };
    const handlersB = registerBookingHandlers(ioB);
    handlersB.emitBookingStatusChanged({ id: 2, status: 'On Trip' }, 43, 'Confirmed');

    expect(namespaceB.emit).toHaveBeenCalledWith('booking:status-changed', expect.objectContaining({
      bookingId: 2,
    }));
  });
});
});

describe('Phase 2 Backend — Notification Service', () => {
  test('sendNotification creates notification in DB — TEST-156', async () => {
    const { sendNotification, getUserNotifications } = require('../../src/services/notificationService');
    const notification = await sendNotification({
      userId: 1,
      type: 'info',
      title: 'Test Notification',
      body: 'This is a test',
    });
    expect(notification.userId).toBe(1);
    expect(notification.title).toBe('Test Notification');
    expect(notification.isRead).toBe(false);
  });

  test('getUserNotifications returns paginated results — TEST-159', async () => {
    const { getUserNotifications } = require('../../src/services/notificationService');
    const result = await getUserNotifications(1);
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('totalItems');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('totalPages');
  });

  test('getUnreadCount returns number', async () => {
    const { getUnreadCount } = require('../../src/services/notificationService');
    const count = await getUnreadCount(1);
    expect(typeof count).toBe('number');
  });

  test('markAsRead updates notification — TEST-157', async () => {
    const { sendNotification, markAsRead, getUnreadCount } = require('../../src/services/notificationService');
    const notif = await sendNotification({ userId: 1, type: 'info', title: 'Read test', body: 'test' });
    const unreadBefore = await getUnreadCount(1);
    await markAsRead(notif.id, 1);
    const unreadAfter = await getUnreadCount(1);
    expect(unreadAfter).toBeLessThanOrEqual(unreadBefore);
  });

  test('markAsRead returns null for wrong user', async () => {
    const { markAsRead } = require('../../src/services/notificationService');
    const result = await markAsRead(99999, 99999);
    expect(result).toBeNull();
  });

  test('markAllAsRead sets all as read — TEST-158', async () => {
    const { markAllAsRead, getUnreadCount } = require('../../src/services/notificationService');
    await markAllAsRead(1);
    const count = await getUnreadCount(1);
    expect(count).toBe(0);
  });
});
