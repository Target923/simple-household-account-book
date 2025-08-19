'use client';
import { useState, useEffect } from 'react';

import styles from './CategoryForm.module.css'

export default function CategoryForm({ categories, setCategories }) {
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
    function handleClick(event) {
        event.preventDefault();
        if (categoryName) {
            saveCategoryInLocalStorage();
        }
    }

    /**
     * カテゴリ削除関数
     * @param {string} categoryId - 削除するID
     */
    function handleDelete(categoryId) {
        const updateCategories = categories.filter(category => category.id !== categoryId);

        setCategories(updateCategories);
        localStorage.setItem('categories', JSON.stringify(updateCategories));
    }

    /**
     * 新しいカテゴリを生成し、ローカルストレージとstateの両方を更新
     * state更新時、UIが自動的に再描画
     */
    function saveCategoryInLocalStorage() {
        const newCategory = {
            id: Date.now().toString(),
            name: categoryName,
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
                    onClick={handleClick}
                >この名前で登録する</button>
            </div>
            <div className={styles.categoryList}>
                <h2>カテゴリ一覧</h2>
                <ul className={styles.categoriesName}>
                    {categories.map((category) => (
                        <li
                            className={styles.categoryName}
                            key={category.id}
                        >
                            {category.name}
                            <button onClick={() => handleDelete(category.id)}>削除</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}