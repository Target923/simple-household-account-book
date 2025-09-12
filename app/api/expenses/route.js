import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const expenses = await prisma.expense.findMany({
        orderBy: [
            {
                date: 'asc',
            },
            {
                sortOrder: 'asc',
            },
        ],
    });
    return new Response(JSON.stringigy(expenses), { status: 200 });
}

export async function POST(request) {
    const data = await request.json();
    const newExpense = await prisma.expense.create({
        data: {
            amount: data.amount,
            memo: data.memo,
            selectedCategoryName: data.selectedCategory,
            date: new Date(data.date),
            sortOrder: data.sortOrder,
        },
    });
    return new Response(JSON.stringify(newExpense), { status: 201 });
}