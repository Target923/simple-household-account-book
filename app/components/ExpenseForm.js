'use client';
import React, { useState, useEffect, useRef } from 'react';

import styles from './ExpenseForm.module.css'

export default function ExpenseForm({ categories, expenses, setExpenses, expenseData, setExpenseData, selectedDate, setSelectedDate, editingExpense, setEditingExpense, isEditMode, setIsEditMode }) {
    const inputRef = useRef(null);

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
     * 編集モード時に編集データをフォームに設定
     */
    useEffect(() => {
        if (isEditMode && editingExpense) {
            setExpenseData({
                date: editingExpense.date,
                amount: editingExpense.amount.toString(),
                memo: editingExpense.memo,
                selectedCategory: editingExpense.selectedCategoryName,
                color: editingExpense.color,
            });

            setSelectedDate(new Date(editingExpense.date));
        }
    }, [isEditMode, editingExpense, setExpenseData, setSelectedDate]);
    
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
            alert('カテゴリーを選択してください');
            return;
        }
        if (Number(expenseData.amount) < 0) {
            alert('金額には0以上を入力してください');
            return;
        } else if (expenseData.amount === '') {
            alert('金額を入力してください');
            return;
        }
 
        if (Number(expenseData.amount) === 0) {
            if (confirm('金額0円で登録しますか?')) {
                saveExpenseDataInLocalStorage()
                return;
            }
        }

        isEditMode ? updateExpenseDataInDB() : saveExpenseDataInDB();
    }

    /**
     * 新規支出登録を生成し、ローカルストレージとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    async function saveExpenseDataInDB() {
        try {
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

            const response = await fetch('api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newExpenseData),
            });

            if (response.ok) {
                const createdExpense = await response.json();

                const expenseForState = {
                    ...createdExpense,
                    selectedCategory: categoryName,
                    selectedCategoryName: categoryName,
                    color: expenseData.color,
                    date: new Date(createdExpense.date),
                };

                const updatedExpenses = [...expenses, expenseForState];
                setExpenses(updatedExpenses);

                setExpenseData({
                    ...expenseData,
                    amount: '',
                    memo: '',
                });
            } else {
                const errorData = await response.json();
                alert(`支出の保存に失敗しました: ${errorData.error}`);
            }
        } catch (error) {
            console.error('支出の保存に失敗しました:', error);
            alert('支出の保存に失敗しました');
        }
    }

    async function updateExpenseDataInDB() {
        try {
            const selectedCategoryObject = categories.find(cat => cat.name === expenseData.selectedCategory);
            const categoryName = selectedCategoryObject ? selectedCategoryObject.name : 'No Category';

            const updatedExpenseData = {
                date: expenseData.date,
                amount: Number(expenseData.amount) || 0,
                memo: expenseData.memo,
                selectedCategory: categoryName,
                sortOrder: editingExpense.sortOrder,
            };

            const response = await fetch(`/api/expenses/${editingExpense.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedExpenseData),
            });

            if (response.ok) {
                const updatedExpense = await response.json();

                const expenseForState = {
                    ...updatedExpense,
                    selectedCategory: categoryName,
                    selectedCategoryName: categoryName,
                    color: expenseData.color,
                    date: new Date(updatedExpense.date),
                };

                const updatedExpenses = expenses.map(exp =>
                    exp.id === editingExpense.id ? expenseForState : exp
                );

                setExpenses(updatedExpenses);

                resetEditMode();
            } else {
                const errorData = await response.json();
                alert(`支出の更新に失敗しました: ${errorData.error}`);
            }
        } catch (error) {
            console.error('支出更新に失敗しました:', error);
            alert('支出の更新に失敗しました');
        }
    }

    /**
     * 編集モードリセット&フォーム初期化
     */
    function resetEditMode() {
        setIsEditMode(false);
        setEditingExpense(null);
        setExpenseData({
            date: new Date(),
            amount: '',
            memo: '',
            selectedCategory: '',
            color: '',
        });
    }

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
                        onKeyDown={(e) => {
                            e.preventDefault();
                        }}
                        onPaste={(e) => {
                            e.preventDefault();
                        }}
                    />
                </li>
                <li className={styles.formItem} style={{ backgroundColor: 'palegoldenrod' }}>
                    <label htmlFor='amount'>金額</label>
                    <input
                        type='number'
                        step={100}
                        min={0}
                        id='amount'
                        name='amount'
                        value={expenseData.amount}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave(e);
                            }
                        }}
                        autoFocus
                    />
                </li>
                <li className={styles.formItem} style={{ backgroundColor: 'paleturquoise' }}>
                    <label htmlFor='memo'>メモ</label>
                    <input
                        type='text'
                        ref={inputRef}
                        id='memo'
                        name='memo'
                        value={expenseData.memo}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave(e);
                            }
                        }}
                    />
                </li>
            </ul>
            <div>
                <div
                    className={`${styles.formItem} ${styles.button}`}
                    onClick={handleSave}
                >
                    {isEditMode ? 'この内容で更新する' : 'この内容で登録する'}
                </div>
                {isEditMode && (
                    <div
                        className={`${styles.formItem} ${styles.button}`}
                        onClick={resetEditMode}
                    >
                        編集をキャンセル
                    </div>
                )}
            </div>
        </div>
    )
};