/**
 * ORGANIZER PERMISSIONS TESTS
 * Tests for organizer authorization middleware and permissions
 */

const {
  cleanDatabase,
  closeDatabase,
  createTestUser,
  createTestOrganization,
  mockRequest,
  mockResponse,
} = require('../utils/testHelpers');

const checkOrganizerPermissions = require('../../middlewares/eventPermissionChecker');

describe('Organizer Permission Middleware', () => {
  let organization;
  let approvedOrganizer;
  let pendingOrganizer;
  let student;
  let admin;

  beforeAll(async () => {
    await cleanDatabase();
    
    // Create test organization
    organization = await createTestOrganization({ name: 'Test Org' });
    
    // Create test users
    approvedOrganizer = await createTestUser({
      email: 'approved@organizer.com',
      role: 'organizer',
      organizerStatus: 'approved',
      organizationId: organization.id,
    });

    pendingOrganizer = await createTestUser({
      email: 'pending@organizer.com',
      role: 'organizer',
      organizerStatus: 'pending',
      organizationId: organization.id,
    });

    student = await createTestUser({
      email: 'student@test.com',
      role: 'student',
    });

    admin = await createTestUser({
      email: 'admin@test.com',
      role: 'admin',
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('checkOrganizerPermissions middleware', () => {
    test('should allow approved organizer to access their own routes', () => {
      const middleware = checkOrganizerPermissions({ from: 'params' });
      const req = mockRequest({
        params: { organizerId: approvedOrganizer.id },
        user: approvedOrganizer,
      });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.organizerId).toBe(approvedOrganizer.id);
    });

    test('should deny pending organizer access', () => {
      const middleware = checkOrganizerPermissions({ from: 'params' });
      const req = mockRequest({
        params: { organizerId: pendingOrganizer.id },
        user: pendingOrganizer,
      });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should deny student access to organizer routes', () => {
      const middleware = checkOrganizerPermissions({ from: 'params' });
      const req = mockRequest({
        params: { organizerId: approvedOrganizer.id },
        user: student,
      });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should allow admin to access any organizer routes', () => {
      const middleware = checkOrganizerPermissions({ from: 'params' });
      const req = mockRequest({
        params: { organizerId: approvedOrganizer.id },
        user: admin,
      });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.organizerId).toBe(approvedOrganizer.id);
    });

    test('should deny access when organizer tries to access another organizers routes', () => {
      const anotherOrganizer = { ...approvedOrganizer, id: 'different-id' };
      const middleware = checkOrganizerPermissions({ from: 'params' });
      const req = mockRequest({
        params: { organizerId: anotherOrganizer.id },
        user: approvedOrganizer,
      });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should redirect unauthenticated users to login', () => {
      const middleware = checkOrganizerPermissions({ from: 'params' });
      const req = mockRequest({
        params: { organizerId: approvedOrganizer.id },
        user: null,
        originalUrl: '/organizers/123/events',
      });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/login?next=')
      );
    });
  });
});
