'use client';
import { useState, useEffect } from 'react';

import styles from './CategoryForm.module.css'

export default function CategoryForm() {
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([])

    /**
     * 入力フォームの値が変更されるたびに実行、categoryNameの状態を更新
     * @param {ChangeEvent<HTMLInputElement>} event - Input要素の変更イベント
     */
    function handleChange(event) {
        setCategoryName(event.target.value);
    }

    /**
     * 登録ボタンクリック時に実行、新規カテゴリを保存
     * @param {MouseEvent<HTMLButtonElement>} event 
     */
    function handleClick(event) {
        event.preventDefault();
        if (categoryName) {
            saveCategoryInLocalStorage();
        }
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
    }

    return (
        <div className={styles.formContainer}>
            <label htmlFor="categoryName">新規カテゴリー名</label>
            <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={handleChange}
            ></input>
            <button onClick={handleClick}>この名前で登録する</button>

            <h2>カテゴリ一覧</h2>
            <ul>
                {categories.map((category) => (
                    <li key={category.id}>{category.name}</li>
                ))}
            </ul>
        </div>
    );
}