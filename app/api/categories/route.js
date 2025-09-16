import { prisma } from "@/lib/prisma"

export async function GET() {
    const categories = await prisma.category.findMany({
        orderBy: {
            sortOrder: 'asc',
        },
    });
    return new Response(JSON.stringify(categories), { status: 200 });
}

export async function POST(request) {
    const data = await request.json();
    const newCategory = await prisma.category.create({
        data: {
            name: data.name,
            color: data.color,
            sortOrder: data.sortOrder,
        },
    });
    return new Response(JSON.stringify(newCategory), { status: 201 });
}