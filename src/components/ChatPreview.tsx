"use client";

import { useState, useEffect } from 'react';
import styles from './ChatPreview.module.css';

const MESSAGES = [
    { role: 'user', content: 'Arnold, what health insurance covers family dental?' },
    { role: 'agent', content: 'Looking into premium family plans... Our Kaiser Elite and Silver riders both offer extensive dental coverage. Shall I analyze the cost-efficiency for you?' },
    { role: 'user', content: 'Yes, and how does this affect my tax savings?' },
    { role: 'agent', content: 'A sophisticated strategy. By leveraging the appropriate Kaiser health savings, you can optimize your taxable income while securing multi-generational care.' },
];

export default function ChatPreview() {
    const [visibleMessages, setVisibleMessages] = useState<number>(0);

    useEffect(() => {
        if (visibleMessages < MESSAGES.length) {
            const timer = setTimeout(() => {
                setVisibleMessages(prev => prev + 1);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => {
                setVisibleMessages(0);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [visibleMessages]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.dot} />
                <span>Arnold AI Console</span>
            </div>
            <div className={styles.messages}>
                {MESSAGES.slice(0, visibleMessages).map((msg, i) => (
                    <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                        <div className={styles.bubble}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.inputArea}>
                <div className={styles.placeholder}>System ready...</div>
            </div>
        </div>
    );
}
