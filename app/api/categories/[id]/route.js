import { prisma } from "@/lib/prisma"

export async function PUT(request, { params }) {
    const { id } = await params;
    const data = await request.json();

    const updatedCategory = await prisma.category.update({
        where: { id: id },
        data: {
            name: data.name,
            color: data.color,
            sortOrder: data.sortOrder,
        },
    });

    return new Response(JSON.stringify(updatedCategory), { status: 200 });
}

export async function DELETE(request, { params }) {
    const { id } = await params;

    await prisma.expense.updateMany({
        where: { selectedCategoryName: { equals: id } },
        data: { selectedCategoryName: '' },
    });

    const deletedCategory = await prisma.category.delete({
        where: { id: id },
    });

    return new Response(JSON.stringify(deletedCategory), { status: 200 });
}