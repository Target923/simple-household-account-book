import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { id } = await params;
        const expense = await prisma.expense.findUnique({
            where: { id: id, userId: userId },
        });

        if (!expense) return new Response(JSON.stringify({ error: '支出が見つかりません' }), { status: 404 });

        return new Response(JSON.stringify(expense), { status: 200 });
    } catch (error) {
        console.error('支出の取得に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の取得に失敗しました' }), { statu: 500 });
    }
}

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const data = await request.json();

    try {
        const updatedExpense = await prisma.expense.update({
            where: { id: id, userId: userId },
            data: {
                amount: parseFloat(data.amount),
                memo: data.memo,
                selectedCategoryName: data.selectedCategoryName,
                date: new Date(data.date),
                sortOrder: data.sortOrder,
            },
        });

        return new Response(JSON.stringify(updatedExpense), { status: 200 });
    } catch (error) {
        console.error('支出の変更に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の変更に失敗しました' }), { status: 500 });
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
        const deleteExpense = await prisma.expense.delete({
            where: { id: id, userId: userId },
        });

        return new Response(JSON.stringify(deleteExpense), { status: 200 });
    } catch (error) {
        console.error('支出の削除に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の削除に失敗しました' }), { status: 500 });
    }
}

export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const data = await request.json();
    const { oldCategoryName, newCategoryName } = data;

    if (!oldCategoryName || !newCategoryName) {
        return new Response(
            JSON.stringify({ error: 'カテゴリ名が指定されていません' }),
            { status: 400 }
        );
    }

    try {
        const updatedExpenses = await prisma.expense.updateMany({
            where: {
                userId: userId,
                selectedCategoryName: oldCategoryName,
            },
            data: { selectedCategoryName: newCategoryName },
        });

        return new Response(JSON.stringify(updatedExpenses), { status: 200 });
    } catch (error) {
        console.error('支出の一括変更に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の一括変更に失敗しました' }), { status: 500 });
    }
}