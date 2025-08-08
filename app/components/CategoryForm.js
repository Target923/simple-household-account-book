'use client';
import { useState } from 'react';

import styles from './CategoryForm.module.css'

export default function CategoryForm() {
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([
        { id: '1', name: '食費' },
        { id: '2', name: '交通費' }
    ]);

    function handleChange(event) {
        setCategoryName(event.target.value);
    }

    function handleClick(event) {
        event.preventDefault();
        if (categoryName) {
            saveCategoryInLocalStorage();
        }
    }

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
        </div>
    )
}