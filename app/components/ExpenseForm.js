'use client';
import { useState } from 'react';

import styles from './ExpenseForm.module.css'

export default function ExpenseForm({ categories }) {
    const [expense, setExpense] = useState({
        amount: '',
        date: '',
        memo: '',
        selectedCategory: '',
    });

    return (
        <div className={styles.formContainer}>
            <label htmlFor="selectCategory">カテゴリー選択</label>
            <input
                type="radio"
                id="selectCategory"
                value={categories}
            ></input>
            <label htmlFor="expense">使用額</label>
            <input
                type="number"
                id="expense"
                min={0}
                value={0}
            ></input>
        </div>
    )
}