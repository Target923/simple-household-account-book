'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { userRouter } from 'next/navigation';
import { useRouter } from 'next/router';

export default function LoginForm() {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result.error) {
                setError('ログインに失敗しました');
            } else if (result.ok) {
                router.push('/');
            }
        } catch (err) {
            setError('ログインに失敗しました');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name || !email || !password) {
            setError('すべての項目を入力してください');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('登録が完了しました。ログインしてください');
                setIsRegisterMode(false);
            } else {
                setError(data.error || '登録に失敗しました');
            }
        } catch (err) {
            setError('登録に失敗しました');
        }
    };

    return (
        <div>
            <h2>ログイン</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">メールアドレス</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">パスワード</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">ログイン</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}