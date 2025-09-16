import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const data = await request.json();

    try {
        const updatedBudget = await prisma.budget.update({
            where: { id: id, userId: userId },
            data: {
                amount: data.amount,
                categoryName: data.categoryName,
                month: data.month,
                sortOrder: data.sortOrder,
            },
        });

        return new Response(JSON.stringify(updatedBudget), { status: 200 });
    } catch (error) {
        console.error('支出の変更に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の変更に失敗しました' }), {status: 500});
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
        const deletedBudget = await prisma.budget.delete({
            where: { id: id, userId: userId },
        });

        return new Response(JSON.stringify(deletedBudget), { status: 200 });
    } catch (error) {
        console.error('支出の削除に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の削除に失敗しました' }), {status: 500});
    }
}

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    try {
        const budget = await prisma.budget.findUnique({
            where: { id: id, userId: userId },
        });

        if (!budget) return new Response(JSON.stringify({ error: '予算が設定されていません' }), { status: 404 });

        return new Response(JSON.stringify(budget), { status: 200 });
    } catch (error) {
        console.error('支出の取得に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の取得に失敗しました' }), {status: 500});
    }
}