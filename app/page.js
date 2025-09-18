'use client';
import '../app/globals.css'
import Image from "next/image";

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
      if (status !== "authenticated" || !session) {
        return;
      }

      try {
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);

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
    fetchData();
  }, [status, session]);

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
      <div className='header'>
        <h1>理想の家計簿</h1>
        <button onClick={() => signOut()}>ログアウト</button>
      </div>
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