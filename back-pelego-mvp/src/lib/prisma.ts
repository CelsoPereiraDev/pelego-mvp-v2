import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    log: ['query'],
    datasources: {
        db: {
            url: 'file:./dev.db',
        },
    },
});
