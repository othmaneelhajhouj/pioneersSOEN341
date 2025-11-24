const { getUsers, getAdminCount, setRole } = require('../../dist/services/adminRoleManagementService');
const {prisma} = require('../../dist/db');

// database for test
jest.mock('../../dist/db', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    },
}));


const mockUsers = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'student',
        organizerStatus: null,
        createdAt: new Date('2024-01-01'),
        organization: null,
        _count: { events: 0, tickets: 5 },
    },
    {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'admin',
        organizerStatus: null,
        createdAt: new Date('2024-01-02'),
        organization: { id: 'org1', name: 'Test Org' },
        _count: { events: 3, tickets: 2 },
    },
];


beforeEach(() => {
    jest.clearAllMocks();
});

describe('getUsers', () => {
    test('should return all users without filters', async () => {

        prisma.user.findMany.mockResolvedValue(mockUsers);


        const result = await getUsers({});


        expect(result.data).toEqual(mockUsers);
        expect(result.nextCursor).toBeNull();
        expect(prisma.user.findMany).toHaveBeenCalledWith({
            where: {},
            take: 21,
            orderBy: { createdAt: 'desc' },
            select: expect.any(Object),
        });
    });

    test('should filter users by role', async () => {
        prisma.user.findMany.mockResolvedValue([mockUsers[1]]);

        const result = await getUsers({ role: 'admin' });

        expect(result.data).toEqual([mockUsers[1]]);
        expect(prisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { role: 'admin' },
            })
        );
    });

    test('should not filter when role is "all"', async () => {
        prisma.user.findMany.mockResolvedValue(mockUsers);

        await getUsers({ role: 'all' });

        expect(prisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {},
            })
        );
    });

    test('should search users by firstName, lastName, or email', async () => {
        prisma.user.findMany.mockResolvedValue([mockUsers[0]]);

        await getUsers({ search: 'john' });

        expect(prisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    OR: [
                        { firstName: { contains: 'john', mode: 'insensitive' } },
                        { lastName: { contains: 'john', mode: 'insensitive' } },
                        { email: { contains: 'john', mode: 'insensitive' } },
                    ],
                },
            })
        );
    });

    test('should use cursor for pagination', async () => {
        prisma.user.findMany.mockResolvedValue(mockUsers);

        await getUsers({ cursor: 'cursor123' });

        expect(prisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                cursor: { id: 'cursor123' },
                skip: 1,
            })
        );
    });

    test('should handle pagination with hasMore', async () => {

        const manyUsers = Array.from({ length: 21 }, (_, i) => ({
            ...mockUsers[0],
            id: `${i}`,
        }));
        prisma.user.findMany.mockResolvedValue(manyUsers);

        const result = await getUsers({});

        expect(result.data.length).toBe(20);
        expect(result.nextCursor).toBe('19');
    });

    test('should combine role and search filters', async () => {
        prisma.user.findMany.mockResolvedValue([mockUsers[1]]);

        await getUsers({ role: 'admin', search: 'jane' });

        expect(prisma.user.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    role: 'admin',
                    OR: expect.any(Array),
                },
            })
        );
    });
});

describe('getAdminCount', () => {
    test('should return the count of admin users', async () => {

        prisma.user.count.mockResolvedValue(5);


        const count = await getAdminCount();


        expect(count).toBe(5);
        expect(prisma.user.count).toHaveBeenCalledWith({
            where: { role: 'admin' },
        });
    });

    test('should return 0 when no admins exist', async () => {
        prisma.user.count.mockResolvedValue(0);

        const count = await getAdminCount();

        expect(count).toBe(0);
    });
});

describe('setRole', () => {
    test('should update user role successfully', async () => {

        const mockUser = { id: 'user123', role: 'student' };
        const updatedUser = { ...mockUser, role: 'organizer' };

        prisma.user.findUnique.mockResolvedValue(mockUser);
        prisma.user.update.mockResolvedValue(updatedUser);


        const result = await setRole({
            adminId: 'admin123',
            userId: 'user123',
            role: 'organizer',
        });


        expect(result).toEqual(updatedUser);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user123' },
            data: { role: 'organizer' },
        });
    });

    test('should throw NOT_FOUND error when user does not exist', async () => {

        prisma.user.findUnique.mockResolvedValue(null);


        await expect(
            setRole({
                adminId: 'admin123',
                userId: 'nonexistent',
                role: 'student',
            })
        ).rejects.toThrow('NOT_FOUND');
    });

    test('should throw LAST_ADMIN error when removing the last admin', async () => {

        const mockAdmin = { id: 'admin123', role: 'admin' };
        prisma.user.findUnique.mockResolvedValue(mockAdmin);
        prisma.user.count.mockResolvedValue(1); // Only 1 admin exists


        await expect(
            setRole({
                adminId: 'admin123',
                userId: 'admin123',
                role: 'student',
            })
        ).rejects.toThrow('LAST_ADMIN');
    });

    test('should allow demoting an admin when multiple admins exist', async () => {

        const mockAdmin = { id: 'admin123', role: 'admin' };
        const updatedUser = { ...mockAdmin, role: 'student' };

        prisma.user.findUnique.mockResolvedValue(mockAdmin);
        prisma.user.count.mockResolvedValue(3); // 3 admins exist
        prisma.user.update.mockResolvedValue(updatedUser);


        const result = await setRole({
            adminId: 'admin123',
            userId: 'admin123',
            role: 'student',
        });


        expect(result).toEqual(updatedUser);
        expect(prisma.user.count).toHaveBeenCalledWith({
            where: { role: 'admin' },
        });
    });

    test('should allow changing admin to admin (no admin count check)', async () => {

        const mockAdmin = { id: 'admin123', role: 'admin' };
        const updatedUser = { ...mockAdmin, role: 'admin' };

        prisma.user.findUnique.mockResolvedValue(mockAdmin);
        prisma.user.update.mockResolvedValue(updatedUser);


        await setRole({
            adminId: 'admin123',
            userId: 'admin123',
            role: 'admin',
        });


        expect(prisma.user.count).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalled();
    });

    test('should promote a student to admin', async () => {

        const mockStudent = { id: 'student123', role: 'student' };
        const updatedUser = { ...mockStudent, role: 'admin' };

        prisma.user.findUnique.mockResolvedValue(mockStudent);
        prisma.user.update.mockResolvedValue(updatedUser);


        const result = await setRole({
            adminId: 'admin123',
            userId: 'student123',
            role: 'admin',
        });


        expect(result).toEqual(updatedUser);
        expect(prisma.user.count).not.toHaveBeenCalled();
    });
});