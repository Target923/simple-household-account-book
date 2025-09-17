'use client';
import '../app/globals.css'
import Image from "next/image";
import { CATEGORY_COLORS } from "./components/category_colors";

import CategoryForm from "./components/CategoryForm";
import ExpenseForm from "./components/ExpenseForm";
import CustomCalendar from "./components/CustomCalendar";
import ExpenseChart from "./components/ExpenseChart";

import React, { useState, useEffect } from "react";

import Head from 'next/head';

import { SessionProvider, useSession, signOut } from "next-auth/react";
import LoginForm from './components/LoginForm';

/**
 * Providersコンポーネントを直接組み込む
 */
const AppProviders = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

/**
 * ホームコンポーネントロジック
 * @returns {JSX.Element} アプリケーションのJSXエレメント
 */
function HomeContent() {
  const { data: session, status } = useSession();

  /**
   * カテゴリー管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [categories, setCategories] = useState([]);

  /**
   * 支出管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [expenses, setExpenses] = useState([]);

  /**
   * 支出データ管理state
   * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array<object>>>]}
   */
  const [expenseData, setExpenseData] = useState({
    date: new Date(),
    amount: '',
    memo: '',
    selectedCategory: '',
    color: '',
  });

  /**
   * カレンダー選択日管理state
   * @type {[Date, React.Dispatch<React.SetStateAction<Date>>]}
   */
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * 編集中の支出データ管理state
   * @type {[object|null, React.Dispatch<React.SetStateAction<object|null>>]}
   */
  const [editingExpense, setEditingExpense] = useState(null);

  /**
   * 編集モードフラグ管理state
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * コンポーネントマウント時、ローカルストレージからデータ読み込み
   */
  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated") {
        try {
          const categoriesRes = await fetch('/api/categories');
          const categoriesData = await categoriesRes.json();

          if (categoriesData.length === 0) {
            const initialCategories = [
              { name: '食費', color: CATEGORY_COLORS[0], sortOrder: 0 },
              { name: '交通費', color: CATEGORY_COLORS[1], sortOrder: 1 },
              { name: '日用品', color: CATEGORY_COLORS[2], sortOrder: 2 },
            ];

            const initialCategoriesPromises = initialCategories.map(cat =>
              fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cat),
              })
            );

            await Promise.all(initialCategoriesPromises);

            const updatedCategoriesRes = await fetch('/api/categories');
            const updatedCategoriesData = await updatedCategoriesRes.json();
            setCategories(updatedCategoriesData);
          } else {
            setCategories(categoriesData);
          }

          const expensesRes = await fetch('/api/expenses');
          const expensesData = await expensesRes.json();
          const parsedExpenses = expensesData.map(exp => ({
            ...exp,
            date: new Date(exp.date),
          }))

          setExpenses(parsedExpenses);
        } catch (error) {
          console.error('データの取得または初期化に失敗しました:', error);
        }
      }
    }
    fetchData();
  }, [status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <main>
        <LoginForm />
      </main>
    );
  }

  return (
    <main>
      <div style={{ textAlign: 'right', padding: '1rem' }}>
        {/* <title>理想の家計簿 - 複雑な収支管理</title>
        <meta name="description" content="複雑で使いにくいオンライン家計簿。開発者の理想とエゴがいっぱいの機能を詰め込みました。非常に見づらい。" /> */}
        <button onClick={() => signOut()}>ログアウト</button>
      </div>
      <h1>理想の家計簿</h1>
      <hr />
      <CategoryForm
        categories={categories} setCategories={setCategories}
        expenses={expenses} setExpenses={setExpenses} 
        expenseData={expenseData} setExpenseData={setExpenseData }
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <ExpenseForm 
        categories={categories}
        expenses={expenses} setExpenses={setExpenses}
        expenseData={expenseData} setExpenseData={setExpenseData}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        editingExpense={editingExpense} setEditingExpense={setEditingExpense}
        isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
      <CustomCalendar
        expenses={expenses} setExpenses={setExpenses}
        categories={categories}
        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
        setEditingExpense={setEditingExpense} setIsEditMode={setIsEditMode} />
      <ExpenseChart
        expenses={expenses}
        setExpenses={setExpenses}
        categories={categories}
        selectedDate={selectedDate} />
    </main>
  );
}

export default function Home() {
  return (
    <AppProviders>
      <HomeContent />
    </AppProviders>
  );
}