'use client';
import React, { useState, useEffect } from 'react';

import styles from './ExpenseForm.module.css'
// import { notFound } from 'next/navigation';

export default function ExpenseForm({ categories, setExpenses, 
    expenseData, setExpenseData, 
    selectedDate, setSelectedDate }) {   
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
     * selectedDate変更時、expenseData.dateを更新し、同期
     */
    useEffect(() => {
        if (selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day}`;

            setExpenseData(prevExpenseData => ({
                ...prevExpenseData,
                date: formattedDate,
            }));
        }
    }, [selectedDate, setExpenseData]);
    
    /**
     * 各入力項目の変更時、expenseDataの状態を更新
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} event - 入力/選択イベント
     */
    function handleChange(event) {
        const { name, value } = event.target;

        setExpenseData(prevExpenseData => ({
            ...prevExpenseData,
            [name]: name === 'date' ? new Date(value) : value,
        }));

        if (name === 'date') {
            const newDate = value ? new Date(value) : null;
            setSelectedDate(newDate);
        }

        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: '',
        }));
        setWarnings(prevWarnings => ({
            ...prevWarnings,
            amountZero: false,
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

        if (Number(expenseData.amount) < 0) {
            newErrors.amount = '金額には0以上を入力してください';
        } else if (expenseData.amount === '') {
            newErrors.amount = '金額を入力してください';
        }
        if (!expenseData.selectedCategory) {
            newErrors.selectedCategory = 'カテゴリーを選択してください';
        }

        if (Object.values(newErrors).some(error => error !== '')) {
            setErrors(newErrors);
            return;
        }

        if (Number(expenseData.amount) === 0) {
            newWarnings.amountZero = true;
        }
        if (Object.values(newWarnings).some(warning => warning)) {
            setWarnings(newWarnings);
            return;
        }

        saveExpenseDataInLocalStorage();
    }

    /**
     * 新規支出登録を生成し、ローカルストレージとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    function saveExpenseDataInLocalStorage() {
        const selectedCategoryObject = categories.find(cat => cat.name === expenseData.selectedCategory);
        const categoryName = selectedCategoryObject ? selectedCategoryObject.name : 'No Category';

        const newExpenseData = {
            id: Date.now().toString(),
            date: expenseData.date,
            amount: Number(expenseData.amount) || 0,
            memo: expenseData.memo,
            selectedCategory: expenseData.selectedCategory,
            selectedCategoryName: categoryName,
            color: expenseData.color,
        };

        const existingExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const updateExpenses = [...existingExpenses, newExpenseData];
        setExpenses(updateExpenses);

        localStorage.setItem('expenses', JSON.stringify(updateExpenses));

        setExpenseData({
            date: new Date().toISOString().substring(0, 10),
            amount: '',
            memo: '',
            selectedCategory: '',
            color: '',
        });

        setErrors({ amount: '', selectedCategory: '', });
        setWarnings({ amountZero: false });
    };

    const handleConfirmSave = () => {
        saveExpenseDataInLocalStorage();
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
                        value={expenseData.date instanceof Date ? expenseData.date.toISOString().substring(0, 10) : expenseData.date}
                        onChange={handleChange}
                    />
                </li>
                <li className={styles.formItem}>
                    <label htmlFor='amount'>金額</label>
                    <input
                        type='number'
                        id='amount'
                        name='amount'
                        value={expenseData.amount}
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
                        value={expenseData.memo}
                        onChange={handleChange}
                    />
                </li>
            </ul>
            <div>
                <div
                    className={`${styles.formItem} ${styles.registerBtn}`}
                    onClick={handleClick}
                >
                    この内容で登録する
                </div>
                {errors.selectedCategory && (
                    <li className={`${styles.error} ${styles.formItem}`}>
                        <p>{errors.selectedCategory}</p>
                    </li>
                )}
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