'use client';
import { useState, useEffect } from 'react';

import styles from './CategoryForm.module.css';
import { CATEGORY_COLORS } from './colors';

import { IoTrashBin } from 'react-icons/io5';

export default function CategoryForm({ categories, setCategories, expenseData, setExpenseData }) {
    const [categoryName, setCategoryName] = useState('');

    /**
     * 入力フォームの値が変更されるたびに実行、categoryNameの状態を更新
     * @param {ChangeEvent<HTMLInputElement>} event - Input要素の変更イベント
     */
    function handleChange(event) {
        setCategoryName(event.target.value);
    }

    /**
     * 登録ボタンクリック時に実行、新規カテゴリを保存
     * @param {MouseEvent<HTMLButtonElement>} event - Button要素の変更イベント 
     */
    function handleClickRegister(event) {
        event.preventDefault();
        if (categoryName) {
            saveCategoryInLocalStorage();
        }
    }

    /**
     * カテゴリボタンクリック時に実行、支出データの選択カテゴリー項目に保存
     * @param {string} categoryName - 選択中カテゴリ
     */
    function handleClickCategory(categoryName) {
        const currentColor = categories.find(cat => cat.name === categoryName).color;

        setExpenseData(prevExpenseData => ({
            ...prevExpenseData,
            selectedCategory: categoryName,
            color: currentColor,
        }));
    }

    /**
     * カテゴリ削除関数(選択中カテゴリもリセット)
     * @param {string} categoryId - 削除するID
     * @param {string} categoryName - 選択中カテゴリ
     */
    function handleDelete(categoryId, categoryName) {
        const updateCategories = categories.filter(cat => cat.id !== categoryId);
        setCategories(updateCategories);
        localStorage.setItem('categories', JSON.stringify(updateCategories));
    }
    useEffect(() => {
        if (categories.length > 0) {
            const isFound = categories.some(cat => cat.name === expenseData.selectedCategory);

            if (!isFound) {
                setExpenseData(prevExpenseData => ({
                    ...prevExpenseData,
                    selectedCategory: '',
                }));
            }
        }
    }, [categories, expenseData.selectedCategory, setExpenseData]);

    /**
     * 新しいカテゴリを生成し、ローカルストレージとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    function saveCategoryInLocalStorage() {
        const newCategory = {
            id: Date.now().toString(),
            name: categoryName,
            color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
        };

        const existingCategories = JSON.parse(localStorage.getItem('categories')) || [];
        const updateCategories = [...existingCategories, newCategory];
        setCategories(updateCategories);

        localStorage.setItem('categories', JSON.stringify(updateCategories));

        setCategoryName('')
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.inputSection}>
                <label htmlFor="categoryName">新規カテゴリー名</label>
                <input
                    type="text"
                    id="categoryName"
                    value={categoryName}
                    onChange={handleChange}
                ></input>
                <button
                    onClick={handleClickRegister}
                >
                    この名前で登録する</button>
            </div>
            <div className={styles.categoryList}>
                <h2>カテゴリ一覧</h2>
                <ul className={styles.categories}>
                    {categories.map((category) => (
                        <li
                            className={
                                `${styles.category}
                                ${expenseData.selectedCategory === category.name ? styles.selected : ''}`
                            }
                            onClick={() => handleClickCategory(category.name)}
                            key={category.id}
                            style={{
                                borderColor: category.color,
                                backgroundColor: expenseData.selectedCategory === category.name ? `${category.color}95` : 'transparent'
                            }}
                        >
                            <div className={styles.categoryName}>
                                {category.name}</div>
                            <IoTrashBin
                                className={styles.trashIcon}
                                onClick={() => handleDelete(category.id, category.name)} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}