import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                return { id: "1", name: "J Smith", email: "jsmith@example.com" }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
}

export const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }