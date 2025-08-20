'use client';
import Image from "next/image";
import styles from "./page.module.css";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";

import { useState, useEffect } from "react";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
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

  function handleDeleteExpense(expenseId) {
    const updateExpenses = expenses.filter(expense => expense !== expenseId);

    setExpenses(updateExpenses);
    localStorage.setItem('expenses', JSON.stringify(updateExpenses));
  }

  return (
    <main>
      <h1>理想の家計簿</h1>
      <hr />
      <CategoryForm categories={categories} setCategories={setCategories} />
      <ExpenseForm categories={categories} setExpenses={setExpenses} />
      <ExpenseList
        expenses={expenses}
        categories={categories}
        onDeleteExpense={handleDeleteExpense}
      />
    </main>
  )
}