import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    try {
        const expenses = await prisma.expense.findMany({
            orderBy: [
                { date: 'asc' },
                { sortOrder: 'asc' },
            ],
            where: {
                userId: userId,
            }
        });
        return new Response(JSON.stringify(expenses), { status: 200 });
    } catch (error) {
        console.error('支出の取得に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の取得に失敗しました' }), { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;
    const data = await request.json();

    try {
        const newExpense = await prisma.expense.create({
            data: {
                amount: parseFloat(data.amount),
                memo: data.memo,
                selectedCategoryName: data.selectedCategoryName,
                date: new Date(data.date),
                sortOrder: data.sortOrder,
                userId: userId,
            },
        });
        return new Response(JSON.stringify(newExpense), { status: 201 });
    } catch (error) {
        console.error('支出の作成に失敗しました:', error);
        return new Response(JSON.stringify({ error: '支出の作成に失敗しました' }), { status: 500 });
    }
}