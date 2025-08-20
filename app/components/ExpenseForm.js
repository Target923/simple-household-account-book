'use client';
import React, { useState } from 'react';

import styles from './ExpenseForm.module.css'
// import { notFound } from 'next/navigation';

export default function ExpenseForm({ categories, setExpenses }) {
    const [expense, setExpense] = useState({
        date: new Date(),
        amount: '',
        memo: '',
        selectedCategory: '',
    });        
    
    /**
     * エラー用メッセージ管理state
     * @type {[string, React.Dispatch<React.SetStateAction<string>>]}
     */
    const [errors, setErrors] = useState({
        amount: '',
        selectedCategory: '',
    });

    /**
     * 警告用メッセージ管理state
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    const [warnings, setWarnings] = useState({
        amountZero: false,
    });
    
    /**
     * 各入力項目の変更時、expenseの状態を更新
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} event - 入力/選択イベント
     */
    function handleChange(event) {
        const { name, value } = event.target;

        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: '',
        }));
        setWarnings(prevWarnings => ({
            ...prevWarnings,
            amountZero: false,
        }));

        setExpense(prevExpense => ({
            ...prevExpense,
            [name]: name === 'date' ? new Date(value) : value,
        }));
    }

    /**
     * 登録ボタンクリック時に実行、支出内容を保存
     * @param {MouseEvent<HTMLButtonElement>} event - ボタンクリックイベント
     */
    function handleClick(event) {
        event.preventDefault();

        const newErrors = { amount: '', selectedCategory: '' };
        const newWarnings = { amountZero: false };

        if (Number(expense.amount) < 0) {
            newErrors.amount = '金額には0以上を入力してください';
        } else if (expense.amount === '') {
            newErrors.amount = '金額を入力してください';
        }
        if (!expense.selectedCategory) {
            newErrors.selectedCategory = 'カテゴリーを選択してください';
        }

        if (Object.values(newErrors).some(error => error !== '')) {
            setErrors(newErrors);
            return;
        }

        if (Number(expense.amount) === 0) {
            newWarnings.amountZero = true;
        }
        if (Object.values(newWarnings).some(warning => warning)) {
            setWarnings(newWarnings);
            return;
        }

        saveExpenseInLocalStorage();
    }

    /**
     * 新規支出登録を生成し、ローカルストレージとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    function saveExpenseInLocalStorage() {
        const selectedCategoryObject = categories.find(cat => cat.id === expense.selectedCategory);
        const categoryName = selectedCategoryObject ? selectedCategoryObject.name : '未分類';

        const newExpense = {
            id: Date.now().toString(),
            date: expense.date,
            amount: Number(expense.amount) || 0,
            memo: expense.memo,
            selectedCategory: expense.selectedCategory,
            selectedCategoryName: categoryName,
        };

        const existingExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const updateExpenses = [...existingExpenses, newExpense];
        setExpenses(updateExpenses);

        localStorage.setItem('expenses', JSON.stringify(updateExpenses));

        setExpense({
            date: new Date(),
            amount: '',
            memo: '',
            selectedCategory: '',
        });

        setErrors({ amount: '', selectedCategory: '', });
        setWarnings({ amountZero: false });
    };

    const handleConfirmSave = () => {
        saveExpenseInLocalStorage();
    };
    const handleCancelSave = () => {
        setWarnings({ amountZero: false });
    };

    return (
        <div className={styles.formInput}>
            <ul className={styles.formContainer}>
                <li className={styles.formItem}>
                    <label htmlFor='date'>日付</label>
                    <input
                        type="date"
                        id='date'
                        name='date'
                        value={expense.date.toISOString().substring(0, 10)}
                        onChange={handleChange}
                    />
                </li>
                <li className={styles.formItem}>
                    <label htmlFor='amount'>金額</label>
                    <input
                        type="number"
                        id="amount"
                        name='amount'
                        value={expense.amount}
                        onChange={handleChange}
                    />
                    {errors.amount && (
                        <p style={{ color: 'red' }}>{errors.amount}</p>
                    )}
                </li>
                <li className={styles.formItem}>
                    <label htmlFor='memo'>メモ</label>
                    <input
                        type='text'
                        id='memo'
                        name='memo'
                        value={expense.memo}
                        onChange={handleChange}
                    />
                </li>
                <li className={styles.formItem}>
                    <label htmlFor='selectedCategory'>カテゴリー</label>
                    <select
                        id='selectedCategory'
                        name='selectedCategory'
                        value={expense.selectedCategory}
                        onChange={handleChange}
                    >
                        <option value="">-- カテゴリーを選択 --</option>

                        {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                        ))}
                    </select>
                    {errors.selectedCategory && (
                        <p style={{ color: 'red' }}>{errors.selectedCategory}</p>
                    )}
                </li>
            </ul>
            <div>
                <button className={styles.formItem} onClick={handleClick}>この内容で登録する</button>
                {warnings.amountZero && (
                    <div className={styles.formContainer}>
                        <p>金額0円で登録しますか？</p>
                        <div>
                            <button className={styles.formItem} onClick={handleConfirmSave}>はい</button>
                            <button className={styles.formItem} onClick={handleCancelSave}>いいえ</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
};