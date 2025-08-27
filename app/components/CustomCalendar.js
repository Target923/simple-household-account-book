'use client';
import { useState, useMemo } from 'react';

import Modal from './Modal';

import styles from './CustomCalendar.module.css';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { IoTrashBin } from 'react-icons/io5';

/**
 * カスタムカレンダーコンポーネント
 * @param {object} props コンポーネントプロパティ
 * @param {Array<object>} props.expenses - 支出リスト
 * @param {function} props.setExpenses - 支出リスト更新関数
 * @param {Array<object>} props.categories - カテゴリリスト
 * @returns {JSX.Element} カレンダーコンポーネントのJSXエレメント
 */
export default function CustomCalendar({ expenses, setExpenses, categories, selectedDate, setSelectedDate }) {
    /**
     * モーダル開閉状態、選択支出データ管理state
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    // const [isModalOpen, setIsModalOpen] = useState(false);

    /**
     * 選択日付の支出リスト管理state
     * @type {[Array<object>, React.Dispatch<React.SetStateAction<Array>>]}
     */
    const [selectedDateExpenses, setSelectedDateExpenses] = useState([]);

    const calendarRef = React.useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    /**
     * カテゴリのカラーマップ管理Memo
     * @type {object}
     */
    const categoryColors = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.name] = cat.color;
            return acc;
        }, {});
    }, [categories]);

    /**
     * ドラッグ中の支出データを管理するstate
     */
    const [draggingExpense, setDraggingExpense] = useState(null);

    /**
     * 日付文字列をISO形式に変換するユーティリティ関数
     * @param {string | Date} dateValue - 日付/日付文字列
     * @returns {string} YYYY-MM-DD形式の日付文字列
     */
    const getISODateString = (dateValue) => {
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }
        return dateValue.split('T')[0];
    };

    /**
     * 合計/支出データを統合し、FullCalendarイベント形式に変換
     * @type {Array<object>}
     */
    const calendarEvents = useMemo(() => {
        const dailyTotals = expenses.reduce((acc, expense) => {
            const date = getISODateString(expense.date);
            if (date) {
                acc[date] = (acc[date] || 0) + Number(expense.amount);
            }
            return acc;
        }, {});
        const dailyTotalEvents = Object.keys(dailyTotals).map(date => ({
            id: `total-${date}`,
            title: `合計: ${dailyTotals[date]}円`,
            date: date,
            backgroundColor: 'azure',
            borderColor: 'gold',
            textColor: 'black',
            eventType: 'total'
        }));

        const categoryTotals = expenses.reduce((acc, expense) => {
            const date = getISODateString(expense.date);

            if (date) {
                const key = `${date}-${expense.selectedCategoryName}`;
                if(acc[key]) {
                    acc[key].amount += Number(expense.amount);
                } else {
                    acc[key] = {
                        date: expense.date,
                        name: expense.selectedCategoryName,
                        amount: Number(expense.amount),
                        color: expense.color,
                        id: key
                    };
                }
            }
            return acc;
        }, {});
        const categoryTotalEvents = Object.values(categoryTotals).map(cat => ({
            id: cat.id,
            title: `${cat.name}: ${cat.amount}円`,
            date: getISODateString(cat.date),
            backgroundColor: cat.color,
            borderColor: 'silver',
            textColor: 'black',
            eventType: 'category',
        }));


        return [...dailyTotalEvents, ...categoryTotalEvents];
    }, [expenses]);

    /**
     * イベントのドラッグ&ドロップハンドラ
     * @param {object} eventDropInfo - ドラッグ&ドロップイベント情報
     */
    const handleEventDrop = (eventDropInfo) => {
        if (eventDropInfo.event.extendedProps.eventType === 'total') {
            eventDropInfo.revert();
            return;
        }

        const newDate = eventDropInfo.event.startStr;
 
        const updatedExpenses = expenses.map(exp => {
            if (`${getISODateString(exp.date)}-${exp.selectedCategoryName}` === eventDropInfo.event.id) {
                return {
                    ...exp,
                    date: newDate,
                }
            }

            return exp;
        });

        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    };

    /**
     * ドラッグ開始ハンドラ 
     */
    const handleDragStart = (e, expense) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(expense));
        setDraggingExpense(expense);
    };

    /**
     * カレンダーへのドロップハンドラ
     */
    const handleDrop = (e) => {
        const droppedDateStr = e.dateStr;
        if (draggingExpense) {
            const newExpense = {
                ...draggingExpense,
                id: uuidv4(),
                date: droppedDateStr,
            };
            const updatedExpenses = [...expenses, newExpense];
            setExpenses(updatedExpenses);
            localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

            setDraggingExpense(null);
        }
    }

    /**
     * 日付クリックハンドラ
     * グラフ表示用
     * @param {object} dateClickInfo - 日付クリック情報
     */
    const handleDateClick = (dateClickInfo) => {
        const clickedDate = dateClickInfo.date;
        setSelectedDate(clickedDate);
    }

    /**
     * イベントクリックハンドラ
     * クリック日の支出データをモーダル表示
     * @param {object} eventClickInfo - イベントクリック情報
     */
    const handleEventClick = (eventClickInfo) => {
        const clickedEvent = eventClickInfo.event;
        const clickedDate = clickedEvent.startStr;
        const eventType = clickedEvent.extendedProps.eventType;
        const eventId = clickedEvent.id;

        let expensesToDisplay = [];

        if (eventType === 'total') {
            expensesToDisplay = expenses.filter(
                exp => getISODateString(exp.date) === clickedDate
            );
        } else if (eventType === 'category') {
            expensesToDisplay = expenses.filter(
                exp => getISODateString(exp.date) === clickedDate &&
                    `${getISODateString(exp.date)}-${exp.selectedCategoryName}` === eventId
            );
        }

        setSelectedDateExpenses(expensesToDisplay);
        // setIsModalOpen(true);
    };

    /**
     * 支出削除ハンドラ
     * @param {string} expenseId - 支出ID
     */
    const handleDeleteExpense = (expenseId) => {
        const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
        setExpenses(updatedExpenses);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

        const newSelectedExpenses = updatedExpenses.filter(
            exp => getISODateString(exp.date) ===
                getISODateString(selectedDateExpenses[0]?.date)
        );
        setSelectedDateExpenses(newSelectedExpenses);

        if (newSelectedExpenses.length === 0) {
            // setIsModalOpen(false);
        }
    };

    /**
     * 合計と支出を一つのコンポーネントにまとめて描画
     * @param {object} eventInfo - イベント情報
     */
    const renderEventContent = (eventInfo) => {
        const { event } = eventInfo;
        const isTotal = event.extendedProps.eventType === 'total';
        const eventClass = isTotal ? 'event-total' : 'event-category';

        return (
            <div className={`${styles[eventClass]}`} style={{
                backgroundColor: isTotal ? 'azure' : event.backgroundColor,
                color: 'black',
                border: '1px solid',
                borderColor: isTotal ? 'gold' : 'silver',
                padding: '2px 4px',
                marginBottom: '1px',
                borderRadius: '4px',
                display: 'block',
                fontWeight: isTotal ? 'bold' : 'normal',
                fontSize: isTotal ? '1.25em' : '1.1em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {event.title}
            </div>
        );
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.calendarContainer}>
                <FullCalendar 
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="ja"
                    headerToolbar={{
                        left: 'title',
                        center: '',
                        right: 'today,prev,next',
                    }}
                    events={calendarEvents}
                    eventDisplay='block'
                    eventContent={renderEventContent}
                    eventOrder='-eventType' //逆アルファベット順
                    contentHeight='auto'
                    editable={true}
                    eventDrop={handleEventDrop}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    timeZone='local'
                    droppable={true}
                    drop={handleDrop}
                />
            </div>
            {selectedDateExpenses.length > 0 && (
                <div className={styles.detailsContainer}>
                    <h3 className={styles.detailsTitle}>
                        {new Date(selectedDateExpenses[0].date).toLocaleDateString()}の支出
                    </h3>
                    <ul className={styles.detailsList}>
                        {selectedDateExpenses.map(exp => (
                            <li
                                key={exp.id}
                                className={styles.detailsItem}
                                style={{
                                    borderColor: categoryColors[exp.selectedCategoryName] || '#ccc',
                                }}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, exp)}
                            >
                                <div className={styles.detailsItemLeft}>
                                    <p>{exp.selectedCategoryName}&nbsp;</p>
                                    <p className={styles.memo}>
                                        {exp.memo}</p>
                                </div>
                                <div className={styles.detailsItemRight}>
                                    <p>{exp.amount}円&nbsp;</p>
                                    <IoTrashBin
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteExpense(exp.id)}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            

            {/* {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h3 className={styles.modalTitle}>
                        {selectedDateExpenses.length > 0 ?
                            new Date(selectedDateExpenses[0].date).toLocaleDateString() :
                            '支出詳細'
                        }
                        の支出
                    </h3>
                    {selectedDateExpenses.length > 0 ? (
                        <ul className={styles.modalList}>
                            {selectedDateExpenses.map(expense => (
                                <li
                                    key={expense.id}
                                    className={styles.modalItem}
                                    style={{
                                        borderColor: categoryColors[expense.selectedCategoryName] || '#ccc',
                                    }}
                                >
                                    <div className={styles.modalItemDetails}>
                                        <div className={styles.modalItemLeft}>
                                            <p>{expense.selectedCategoryName}&nbsp;</p>
                                            <p className={styles.memo}>
                                                {expense.memo}</p>
                                        </div>
                                        <div className={styles.modalItemRight}>
                                            <p>{expense.amount}円&nbsp;</p>
                                            <IoTrashBin
                                                className={styles.modalDeleteButton}
                                                onClick={() => handleDeleteExpense(expense.id)}
                                            />
                                        </div>
                                    </div>
                                 </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No Data</p>
                    )}
                </Modal>
            )} */}
        </div>
    );
}
