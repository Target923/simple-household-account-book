import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
        return NextResponse.json({ error: "すべての項目を入力してください" }, { status: 400 });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "既に登録されているメールアドレスです" }, {status: 409});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json({ message: "ユーザー登録が完了しました", user: newUser }, { status: 201 });

    } catch (error) {
        console.error("ユーザー登録エラー:", error);
        return NextResponse.json({ error: "ユーザー登録に失敗しました" }, { status: 500 });
    }
}