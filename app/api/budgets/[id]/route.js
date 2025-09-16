import { prisma } from "@/lib/prisma"

export async function PUT(request, { params }) {
    const { id } = await params;
    const data = await request.json();

    const updatedBudget = await prisma.budget.update({
        where: { id: id },
        data: {
            amount: data.amount,
            categoryName: data.categoryName,
            month: data.month,
            sortOrder: data.sortOrder,
        },
    });

    return new Response(JSON.stringify(updatedBudget), { status: 200 });
}

export async function DELETE(request, { params }) {
    const { id } = await params;

    const deletedBudget = await prisma.budget.delete({
        where: { id: id },
    });

    return new Response(JSON.stringify(deletedBudget), { status: 200 });
}

export async function GET(request, { params }) {
    const { id } = await params;

    const budget = await prisma.budget.findUnique({
        where: { id: id },
    });

    if (!budget) return new Response(JSON.stringify({ error: '予算が設定されていません' }), { status: 404 });

    return new Response(JSON.stringify(budget), { status: 200 });
}