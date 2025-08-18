'use client';
import { useState } from 'react';

import styles from './ExpenseList.module.css';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function ExpenseList({ expenses, categories }) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === selectedDate.getFullYear() &&
                expenseDate.getMonth() === selectedDate.getMonth() &&
                expenseDate.getDate() === selectedDate.getDate();
    });

    const findCategoryName = (categoryID) => {
        const category = categories.find(cat => cat.id === categoryID);
        return category ? category.Name : '未分類';
    }

    return (
        <div className={styles.expenseListContainer}>
            <Calendar
                onChange={(date) => setSelectedDate(date)}
                value={selectedDate}
            />
            <h2>{selectedDate.toLocaleDateString()}の支出</h2>
            <ul>
                {filteredExpenses.map(expense => (
                    <li key={expense.id}>
                        {expense.amount}円 - {findCategoryName(expense.selectedCategory)}
                    </li>
                ))}
            </ul>
        </div>
    )
}