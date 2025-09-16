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
        const budgets = await prisma.budget.findMany({
            orderBy: {
                sortOrder: 'asc',
            },
            where: {
                userId: userId,
            },
        });
        return new Response(JSON.stringify(budgets), { status: 200 });
    } catch (error) {
        console.error('予算の取得に失敗しました:', error);
        return new Response(JSON.stringify({ error: '予算の取得に失敗しました' }), { status: 500 });
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
        const newCategory = await prisma.budget.create({
            data: {
                amount: parseFloat(data.amount),
                categoryName: data.categoryName,
                month: data.month,
                sortOrder: data.sortOrder || 0,
                userId: userId,
            },
        });
        return new Response(JSON.stringify(newCategory), { status: 201 });
    } catch (error) {
        console.error('予算の作成に失敗しました:', error);
        return new Response(JSON.stringify({ error: '予算の作成に失敗しました' }), { status: 500 });
    }
}