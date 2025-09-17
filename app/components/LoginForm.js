'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import styles from './LoginForm.module.css';

export default function LoginForm() {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
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
        <div className={styles.loginForm}>
            <h2>{isRegisterMode ? '新規登録' : 'ログイン'}</h2>
            {success && <p style={{ color: "green" }}>{success}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form
                onSubmit={isRegisterMode ? handleRegister : handleLogin}
                className={styles.registerForm}
            >
                {isRegisterMode && (
                    <div className={styles.loginFormItem}>
                        <label htmlFor="name">ユーザー名</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete='username'
                            required
                        />
                    </div>
                )}
                <div className={styles.loginFormItem}>
                    <label htmlFor="email">メール</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete='email'
                        required
                    />
                </div>
                <div className={styles.loginFormItem}>
                    <label htmlFor="password">パスワード</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete='current-password'
                        required
                    />
                </div>
                <button type="submit">
                    {isRegisterMode ? '登録' : 'ログイン'}
                </button>
            </form>
            
            <div className={styles.loginFormNavigation}>
                <button onClick={() => setIsRegisterMode(!isRegisterMode)}>
                    {isRegisterMode ? 'ログイン画面へ' : '新規登録画面へ'}
                </button>
            </div>
        </div>
    );
}