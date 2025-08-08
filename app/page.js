'use client';
import Image from "next/image";
import styles from "./page.module.css";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";

import { useState, useEffect } from "react";

export default function Home() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || [];
    if (storedCategories.length > 0) {
        setCategories(storedCategories);
    } else {
        const initialCategories = [
            { id: Date.now().toString(), name: '食費' },
            { id: (Date.now() + 1).toString(), name: '交通費' },
        ];
        setCategories(initialCategories);
        localStorage.setItem('categories', JSON.stringify(initialCategories))
    }
  }, []);

  return (
    <main>
      <h1>理想の家計簿</h1>
      <CategoryForm categories={categories} setCategories={setCategories} />
      <ExpenseForm categories={categories} />
    </main>
  )
}