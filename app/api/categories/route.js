import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const categories = await prisma.category.findMany({
            where: { userId: userId },
            orderBy: { sortOrder: 'asc' },
        });

        return new Response(JSON.stringify(categories), { status: 200 });
    } catch (error) {
        console.error('カテゴリーの取得に失敗しました:', error);
        return new Response(JSON.stringify({ error: 'カテゴリーの取得に失敗しました' }), { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { name, color } = await request.json();

    try {
        const newCategory = await prisma.category.create({
            data: {
                name,
                color,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
    return new Response(JSON.stringify(newCategory), { status: 201 });
    } catch (error) {
        console.error('カテゴリーの作成に失敗しました:', error);
        return new Response(JSON.stringify({ error: 'カテゴリーの作成に失敗しました' }), { status: 500 });
    } 
}