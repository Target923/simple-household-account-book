'use client';
import { useState } from 'react';

import styles from './ExpenseList.module.css';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function ExpenseList({ expenses, categories }) {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === selectedDate.getFullYear() &&
                expenseDate.getMonth() === selectedDate.getMonth() &&
                expenseDate.getDate() === selectedDate.getDate();
    });

    const aggregatedData = filteredExpenses.reduce((acc, expense) => {
        const existingCategory = acc.find(item => item.name === expense.selectedCategoryName);

        if (existingCategory) {
            existingCategory.value += Number(expense.amount);
        } else {
            acc.push({
                name: expense.selectedCategoryName,
                value: Number(expense.amount)
            });
        }

        return acc;
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A0', '#19FFD1'];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const data = aggregatedData[index];
        const percentage = (percent * 100).toFixed(0);

        if (percentage === '0') return null;

        return (
            <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
            <tspan x={x} dy="-0.5em">{data.name}</tspan>
            <tspan x={x} dy="1em">{`${percentage}%`}</tspan>
            <tspan x={x} dy="1em">{`${data.value}円`}</tspan>
            </text>
        );
    };

    const renderChart = () => {
        if (aggregatedData.length === 0) {
            return <p className="text-center text-gray-500">データがありません</p>
        }

        return (
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={aggregatedData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                        {
                            aggregatedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))
                        }
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        );
    };

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
                        {expense.amount}円 - {expense.selectedCategoryName}
                    </li>
                ))}
            </ul>            
            <div className="container mx-auto mt-4 p-4 bg-white rounded-lg shadow">
                {renderChart()}
            </div>
        </div>
    )
}