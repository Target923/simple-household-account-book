import { prisma } from "@/lib/prisma"

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
    return new Response(JSON.stringify(expenses), { status: 200 });
}

export async function POST(request) {
    const data = await request.json();
    const newExpense = await prisma.expense.create({
        data: {
            amount: parseFloat(data.amount),
            memo: data.memo,
            selectedCategoryName: data.selectedCategoryName,
            date: new Date(data.date),
            sortOrder: data.sortOrder,
        },
    });
    return new Response(JSON.stringify(newExpense), { status: 201 });
}