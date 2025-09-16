import { prisma } from "@/lib/prisma"

export async function GET() {
    const budgets = await prisma.budget.findMany({
        orderBy: {
            sortOrder: 'asc',
        },
    });
    return new Response(JSON.stringify(budgets), { status: 200 });
}

export async function POST(request) {
    const data = await request.json();
    const newCategory = await prisma.budget.create({
        data: {
            amount: parseFloat(data.amount),
            categoryName: data.categoryName,
            month: data.month,
            sortOrder: data.sortOrder || 0,
        },
    });
    return new Response(JSON.stringify(newCategory), { status: 201 });
}