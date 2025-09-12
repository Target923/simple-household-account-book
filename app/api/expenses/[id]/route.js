import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
    const id = params.id;
    const data = await request.json();

    const updatedExpense = await prisma.expense.update({
        where: { id: id },
        data: {
            amount: data.amount,
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