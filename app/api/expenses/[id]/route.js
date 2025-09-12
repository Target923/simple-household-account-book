import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
    const id = params.id;

    const expense = await prisma.expense.findUnique({
        where: { id: id },
    });

    if (!expense) return new Response(JSON.stringify({ error: '支出が見つかりません' }), { status: 404 });

    return new Response(JSON.stringify(expense), { status: 200 });
}

export async function PUT(request, { params }) {
    const id = params.id;
    const data = await request.json();

    const updatedExpense = await prisma.expense.update({
        where: { id: id },
        data: {
            amount: parseFloat(data.amount),
            memo: data.memo,
            selectedCategoryName: data.selectedCategory,
            date: new Date(data.date),
            sortOrder: data.sortOrder,
        },
    });

    return new Response(JSON.stringify(updatedExpense), { status: 200 });
}

export async function DELETE(request, { params }) {
    const id = params.id;
    
    const deleteExpense = await prisma.expense.delete({
        where: { id: id },
    });

    return new Response(JSON.stringify(deleteExpense), { status: 200 });
}

export async function PATCH(request) {
    const data = await request.json();
    const { oldCategoryName, newCategoryName } = data;

    if (!oldCategoryName || !newCategoryName) {
        return new Response(
            JSON.stringify({ error: 'カテゴリ名が指定されていません' }),
            { status: 400 }
        );
    }

    const updatedExpenses = await prisma.expense.updateMany({
        where: { selectedCategoryName: oldCategoryName },
        data: { selectedCategoryName: newCategoryName },
    });

    return new Response(JSON.stringify(updatedExpenses), { status: 200 });
}