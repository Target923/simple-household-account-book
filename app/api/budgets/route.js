import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const budgets = await prisma.budget.findMany({
        OrderBy: {
            sortOrder: 'asc',
        },
    });
    return new Response(JSON.stringify(budgets), { status: 200 });
}

export async function POST(request) {
    const data = await request.json();
    const newCategory = await prisma.budget.create({
        data: {
            amount: data.amount,
            categoryName: data.categoryName,
            month: data.month,
            sortOrder: data.sortOrder,
        },
    });
    return new Response(JSON.stringify(newCategory), { status: 201 });
}