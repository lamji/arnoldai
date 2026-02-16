"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, X, Plus, Paperclip, Smile } from 'lucide-react';
import styles from './ModernChatbox.module.css';
import { useAgent, Message } from '@/hooks/useAgent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ModernChatbox({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { messages, sendMessage, isBusy, setMessages, status, suggestions, setSuggestions, sessionId } = useAgent();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Debugging state
    useEffect(() => {
        console.log("Arnold: Chatbox mounted/updated. Status:", status, "Messages:", messages.length);
    }, [status, messages.length]);

    // Initial greeting if no messages
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: 'initial',
                role: 'assistant',
                content: "Thank you for choosing Arnold AI, your Financial Sentinel. My name is Arnold, how may I provide elite service for you today?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
    }, [messages.length, setMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Persistence: We no longer clear messages on close to ensure the greeting stays
    useEffect(() => {
        if (isOpen) {
            console.log("Arnold Terminal: System Active. Total Messages:", messages.length);
        }
    }, [isOpen, messages.length]);

    const handleSend = async () => {
        if (!input.trim() || isBusy || status !== 'ready') return;
        const currentInput = input;
        setInput('');
        await sendMessage(currentInput);
    };

    // We no longer return null here to preserve hook state
    // Visibility is now handled by CSS classes in the wrapper

    const [viewportHeight, setViewportHeight] = useState('600px');
    const [isMobile, setIsMobile] = useState(false);

    // Lock body scroll when chat is open
    useEffect(() => {
        if (isOpen && window.innerWidth <= 480) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    // Handle mobile keyboard using Visual Viewport API
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateViewport = () => {
            const mobile = window.innerWidth <= 480;
            setIsMobile(mobile);

            if (!mobile) {
                setViewportHeight('600px');
                return;
            }

            const viewport = window.visualViewport;
            if (viewport) {
                setViewportHeight(`${viewport.height}px`);
                // Force scroll to bottom when keyboard changes
                setTimeout(scrollToBottom, 100);
            } else {
                setViewportHeight('100dvh');
            }
        };

        updateViewport();

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateViewport);
        }
        window.addEventListener('resize', updateViewport);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', updateViewport);
            }
            window.removeEventListener('resize', updateViewport);
        };
    }, []);

    return (
        <div
            className={`${styles.chatbox} ${isOpen ? styles.open : styles.closed}`}
            style={isMobile ? { height: viewportHeight } : {}}
        >
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.agentInfo}>
                    <div className={styles.avatar}>
                        <div className={styles.onlineStatus} style={{ backgroundColor: status === 'ready' ? '#10b981' : '#f59e0b' }} />
                        <img src="/profile.jpg" alt="Arnold" className={styles.profileImg} />
                    </div>
                    <div className={styles.agentMeta}>
                        <h3 className={styles.agentName}>Arnold AI</h3>
                        <span className={styles.agentStatus}>
                            {status === 'initializing' ? 'Synchronizing Intelligence...' : 'Wealth & Health Sentinel'}
                        </span>
                    </div>
                </div>
                <button onClick={() => {
                    // Trigger a final sync on close
                    if (messages.length > 1) {
                        fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ messages, sessionId, syncOnly: true }),
                        }).catch(e => console.warn("Sentinel: Close sync failed", e));

                        // Force lead email immediately
                        fetch("/api/admin/leads/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId }),
                        }).catch(e => console.warn("Sentinel: Lead send failed", e));
                    }
                    onClose();
                }} className={styles.closeBtn}>
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className={styles.messageArea}>
                {messages.map((msg: Message) => (
                    <div key={msg.id} className={`${styles.messageWrapper} ${msg.role === 'assistant' ? styles.agent : styles.user}`}>
                        <div className={styles.bubble} style={{
                            color: msg.role === 'assistant' ? '#000000' : '#ffffff',
                            backgroundColor: msg.role === 'assistant' ? '#ffffff' : '#005F02'
                        }}>
                            <div className={styles.textContent} style={{
                                fontFamily: 'inherit',
                                color: 'inherit'
                            }}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ node, ...props }) => (
                                            <a
                                                {...props}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: msg.role === 'assistant' ? '#005F02' : '#ffffff',
                                                    textDecoration: 'underline',
                                                    fontWeight: '600',
                                                    wordBreak: 'break-all'
                                                }}
                                            />
                                        )
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                            <span className={styles.timestamp} style={{ color: msg.role === 'assistant' ? '#666' : '#fff', opacity: 0.8 }}>
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}

                {status === 'initializing' && (
                    <div className={styles.loaderContainer}>
                        <div className={styles.sentinelPulse}>🛡️</div>
                        <p className={styles.loadingText}>Synchronizing Databases</p>
                    </div>
                )}

                {isBusy && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className={`${styles.messageWrapper} ${styles.agent}`}>
                        <div className={styles.bubble} style={{ backgroundColor: '#ffffff', border: '1px solid #ddd' }}>
                            <div className={styles.typingIndicator}>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Fixed Suggestions Row - Anchor between messages and input to prevent overlap */}
            {suggestions.length > 0 && !isBusy && (
                <div className={styles.suggestionsRow}>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            className={styles.suggestionChip}
                            onClick={() => {
                                setInput('');
                                sendMessage(s);
                                setSuggestions([]);
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Section */}
            <div className={styles.inputSection}>
                <div className={styles.inputWrapper} style={{ opacity: status === 'ready' ? 1 : 0.6 }}>
                    <input
                        type="text"
                        placeholder={status === 'ready' ? "Message Arnold..." : "Connecting..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        onFocus={() => {
                            if (isMobile) {
                                setTimeout(scrollToBottom, 300);
                            }
                        }}
                        className={styles.input}
                        disabled={status !== 'ready'}
                    />
                </div>
                <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={status !== 'ready' || !input.trim()}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
}
