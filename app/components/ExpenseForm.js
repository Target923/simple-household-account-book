'use client';
import { useState } from 'react';

import styles from './ExpenseForm.module.css'

export default function ExpenseForm({ categories, setExpenses }) {
    const [expense, setExpense] = useState({
        date: '',
        amount: '',
        memo: '',
        selectedCategory: '',
    });

    /**
     * 各入力項目の変更時、expenseの状態を更新
     * @param {ChangeEvent<HTMLElement>} event - プルダウンの変更イベント
     */
    function handleChange(event) {
        const { name, value } = event.target;
        setExpense(prevExpense => ({
            ...prevExpense,
            [name]: value,
        }));
    }

    /**
     * 東特ボタンクリック時に実行、支出内容を保存
     * @param {MouseEvent<HTMLButtonElement>} event - Button要素の変更イベント
     */
    function handleClick(event) {
        event.preventDefault();
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
            date: '',
            amount: '',
            memo: '',
            selectedCategory: '',
        })
    }

    return (
        <div className={styles.expenseForm}>
            <ul>
                <li className={styles.formContainer}>
                    <label htmlFor='date'>日付</label>
                    <input
                        type="date"
                        id='date'
                        name='date'
                        value={expense.date}
                        onChange={handleChange}
                        // value={date.now()}
                    ></input>
                </li>
                <li className={styles.formContainer}>
                    <label htmlFor='amount'>使用額</label>
                    <input
                        type="number"
                        id="amount"
                        name='amount'
                        value={expense.amount}
                        onChange={handleChange}
                    ></input>
                </li>
                <li className={styles.formContainer}>
                    <label htmlFor='memo'>メモ</label>
                    <input
                        type='text'
                        id='memo'
                        name='memo'
                        value={expense.memo}
                        onChange={handleChange}
                    ></input>
                </li>
                <li className={styles.formContainer}>
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
                </li>
            </ul>
            <button className={styles.button} onClick={handleClick}>この内容で登録する</button>
        </div>
    )
}