'use client';
import React, { useState, useEffect, useRef } from 'react';

import styles from './ExpenseForm.module.css'

export default function ExpenseForm({ categories, setExpenses, expenseData, setExpenseData, selectedDate, setSelectedDate }) {
    const textareaRef = useRef(null);

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
    }

    /**
     * 登録ボタンクリック時に実行、支出内容を保存
     * @param {MouseEvent<HTMLButtonElement>} event - ボタンクリックイベント
     */
    function handleSave(event) {
        event.preventDefault();

        if (!expenseData.selectedCategory) {
            confirm('カテゴリーを選択してください');
            return;
        }
        if (Number(expenseData.amount) < 0) {
            confirm('金額には0以上を入力してください');
            return;
        } else if (expenseData.amount === '') {
            confirm('金額を入力してください');
            return;
        }
 
        if (Number(expenseData.amount) === 0) {
            if (confirm('金額0円で登録しますか?')) {
                saveExpenseDataInLocalStorage()
                return;
            }
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
    };

    /**
     * EnterKey押下時にフォーカスを外す
     * @param {*} event 
     */
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            te.current.blur();
        }
    };

    return (
        <div className={styles.formInput}>
            <ul className={styles.formContainer}>
                <li className={styles.formItem} style={{ backgroundColor:'palevioletred' }}>
                    <label htmlFor='date'>日付</label>
                    <input
                        type="date"
                        id='date'
                        name='date'
                        value={expenseData.date instanceof Date ? expenseData.date.toISOString().substring(0, 10) : expenseData.date}
                        onChange={handleChange}
                    />
                </li>
                <li className={styles.formItem} style={{ backgroundColor: 'palegoldenrod' }}>
                    <label htmlFor='amount'>金額</label>
                    <input
                        type='number'
                        id='amount'
                        name='amount'
                        value={expenseData.amount}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave(e);
                            }
                        }}
                    />
                </li>
                <li className={styles.formItem} style={{ backgroundColor: 'paleturquoise' }}>
                    <label htmlFor='memo'>メモ</label>
                    <textarea
                        type='text'
                        ref={textareaRef}
                        id='memo'
                        name='memo'
                        value={expenseData.memo}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                    />
                </li>
            </ul>
            <div>
                <div
                    className={`${styles.formItem} ${styles.registerBtn}`}
                    onClick={handleSave}
                >
                    この内容で登録する
                </div>
            </div>
        </div>
    )
};