const { createOrg, listOrgs, updateOrg, deleteOrg } = require('../../dist/services/adminOrganizationsService');
const {prisma} = require('../../dist/db');

// database for test
jest.mock('../../dist/db', () => ({
    prisma: {
        organization: {
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
    },
}));

describe('Organization Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrg', () => {
        // Create an organization with name and description
        it('should create an organization with name and description', async () => {

            const fakeOrg = {
                id: '123',
                name: 'Test Company',
                description: 'A test organization',
                createdAt: new Date(),
            };

            prisma.organization.create.mockResolvedValue(fakeOrg);

            const result = await createOrg({
                name: 'Test Company',
                description: 'A test organization',
            });

            expect(prisma.organization.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Company',
                    description: 'A test organization',
                },
            });

            expect(result).toEqual(fakeOrg);
        });

        // Create an organization with only a name
        it('should create an organization with only a name', async () => {
            const fakeOrg = {
                id: '456',
                name: 'Simple Company',
                description: undefined,
                createdAt: new Date(),
            };

            prisma.organization.create.mockResolvedValue(fakeOrg);

            const result = await createOrg({ name: 'Simple Company' });

            expect(prisma.organization.create).toHaveBeenCalledWith({
                data: {
                    name: 'Simple Company',
                    description: undefined,
                },
            });

            expect(result).toEqual(fakeOrg);
        });
    });

    describe('listOrgs', () => {
        // List of organizations
        it('should return a list of organizations', async () => {
            const fakeOrgs = [
                { id: '1', name: 'Org 1', createdAt: new Date('2024-01-01') },
                { id: '2', name: 'Org 2', createdAt: new Date('2024-01-02') },
            ];

            prisma.organization.findMany.mockResolvedValue(fakeOrgs);

            const result = await listOrgs();

            expect(result).toEqual(fakeOrgs);
        });

        // Default limit of 25
        it('should use default take value of 25', async () => {
            prisma.organization.findMany.mockResolvedValue([]);

            await listOrgs();

            expect(prisma.organization.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'asc' },
                take: 25,
            });
        });

        // Specify custom limit
        it('should use custom take value when provided', async () => {
            prisma.organization.findMany.mockResolvedValue([]);

            await listOrgs(10);

            expect(prisma.organization.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'asc' },
                take: 10,
            });
        });

        // Pagination with a cursor
        it('should use cursor for pagination when provided', async () => {
            prisma.organization.findMany.mockResolvedValue([]);

            await listOrgs(25, 'cursor-123');

            expect(prisma.organization.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'asc' },
                take: 25,
                skip: 1,
                cursor: { id: 'cursor-123' },
            });
        });

        // Order by createdAt ascending
        it('should order organizations by createdAt in ascending order', async () => {
            prisma.organization.findMany.mockResolvedValue([]);

            await listOrgs();

            expect(prisma.organization.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'asc' },
                })
            );
        });
    });

    describe('updateOrg', () => {
        // Update an organization's name and description
        it('should update an organization with new name and description', async () => {
            const updatedOrg = {
                id: '123',
                name: 'Updated Name',
                description: 'Updated Description',
            };

            prisma.organization.update.mockResolvedValue(updatedOrg);

            const result = await updateOrg({
                id: '123',
                name: 'Updated Name',
                description: 'Updated Description',
            });

            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: {
                    name: 'Updated Name',
                    description: 'Updated Description',
                },
            });

            expect(result).toEqual(updatedOrg);
        });

        // Update only the name
        it('should update only the name when description is not provided', async () => {
            const updatedOrg = {
                id: '123',
                name: 'New Name Only',
                description: 'Old Description',
            };

            prisma.organization.update.mockResolvedValue(updatedOrg);

            await updateOrg({
                id: '123',
                name: 'New Name Only',
            });

            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: {
                    name: 'New Name Only',
                    description: undefined,
                },
            });
        });

        // Update only the description
        it('should update only the description when name is not provided', async () => {
            const updatedOrg = {
                id: '123',
                name: 'Old Name',
                description: 'New Description Only',
            };

            prisma.organization.update.mockResolvedValue(updatedOrg);

            await updateOrg({
                id: '123',
                description: 'New Description Only',
            });

            // Only description passed
            expect(prisma.organization.update).toHaveBeenCalledWith({
                where: { id: '123' },
                data: {
                    name: undefined,
                    description: 'New Description Only',
                },
            });
        });
    });

    describe('deleteOrg', () => {
        // Delete an organization with no members
        it('should delete an organization when it has no members', async () => {

            prisma.user.count.mockResolvedValue(0);

            const deletedOrg = {
                id: '123',
                name: 'Deleted Org',
            };
            prisma.organization.delete.mockResolvedValue(deletedOrg);

            const result = await deleteOrg('123');


            expect(prisma.user.count).toHaveBeenCalledWith({
                where: { organizationId: '123' },
            });


            expect(prisma.organization.delete).toHaveBeenCalledWith({
                where: { id: '123' },
            });

            expect(result).toEqual(deletedOrg);
        });

        // Prevent deletion when organization has members
        it('should throw an error when organization has members', async () => {

            prisma.user.count.mockResolvedValue(5);


            await expect(deleteOrg('123')).rejects.toThrow('ORG_HAS_USERS');


            expect(prisma.user.count).toHaveBeenCalledWith({
                where: { organizationId: '123' },
            });


            expect(prisma.organization.delete).not.toHaveBeenCalled();
        });

        // Throw error even with just 1 member
        it('should throw an error when organization has even 1 member', async () => {

            prisma.user.count.mockResolvedValue(1);

            await expect(deleteOrg('123')).rejects.toThrow('ORG_HAS_USERS');


            expect(prisma.organization.delete).not.toHaveBeenCalled();
        });
    });
});