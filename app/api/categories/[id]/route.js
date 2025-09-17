import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const data = await request.json();

    try {
        const updatedCategory = await prisma.category.update({
            where: { id: id, userId: userId },
            data: {
                name: data.name,
                color: data.color,
                sortOrder: data.sortOrder,
            },
        });

        if (!updatedCategory) {
             return new Response(JSON.stringify({ error: 'カテゴリーが見つからないか、権限がありません' }), { status: 404 });
        }

        return new Response(JSON.stringify(updatedCategory), { status: 200 });
    } catch (error) {
        console.error('カテゴリーの変更に失敗しました:', error);
        return new Response(JSON.stringify({ error: 'カテゴリーの変更に失敗しました' }), { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    try {
        await prisma.expense.updateMany({
            where: {
                userId: userId,
                selectedCategoryName: { equals: id },
            },
            data: { selectedCategoryName: '' },
        });

        const deletedCategory = await prisma.category.delete({
            where: { id: id, userId: userId },
        });

        return new Response(JSON.stringify(deletedCategory), { status: 200 });
    } catch (error) {
        console.error('カテゴリーの削除に失敗しました:', error);
        return new Response(JSON.stringify({ error: 'カテゴリーの削除に失敗しました' }), { status: 500 });
    }
}