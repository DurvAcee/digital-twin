'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, RefreshCw, Terminal, Layers, User, Compass, Briefcase, MessageSquare, ExternalLink, Code2, ShieldAlert, BrainCircuit, Mic, MicOff, Copy, Check } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

type ConversationMode = 'engineer' | 'recruiter' | 'casual';

interface ProjectCard {
    id: string;
    title: string;
    description: string;
    techStack: string[];
    askPrompt: string;
    category: string;
}

const FEATURED_PROJECTS: ProjectCard[] = [
    {
        id: 'digital-twin',
        title: 'AI Digital Twin & Persona',
        description: 'Serverless AI agent powered by Gemini 2.5 Flash, FastAPI, and Next.js with real-time SSE streaming.',
        techStack: ['Python', 'FastAPI', 'Gemini 2.5', 'Next.js', 'AWS Lambda'],
        askPrompt: 'Tell me more about the architecture and build of your AI Digital Twin project.',
        category: 'AI / Full Stack',
    },
    {
        id: 'cad-cybersecurity',
        title: 'Co-ordinated Attack Detection (CAD)',
        description: 'AI cybersecurity platform detecting coordinated attacks on backup infra using dual-stream GNN + temporal encoders.',
        techStack: ['React.js', 'PyTorch', 'FastAPI', 'GNN', 'SHAP'],
        askPrompt: 'Tell me about your Co-ordinated Attack Detection (CAD) project built at Cohesity.',
        category: 'AI / Cybersecurity',
    },
    {
        id: 'second-brain',
        title: 'Second Brain Local RAG App',
        description: 'Privacy-first local RAG application integrating Ollama LLM, ONNX embeddings, ChromaDB, and Obsidian notes with SSE streaming.',
        techStack: ['Python', 'FastAPI', 'ChromaDB', 'Ollama LLM', 'Obsidian'],
        askPrompt: 'How did you build your Second Brain privacy-first RAG application with ChromaDB and Ollama?',
        category: 'AI / RAG Architecture',
    },
];

const MODE_PROMPTS = {
    engineer: [
        {
            title: "Performance Engineering",
            prompt: "How does Durvesh approach full-stack microservices & performance engineering (e.g. cutting load times by 60%)?",
            icon: Terminal,
        },
        {
            title: "Core Tech Stack",
            prompt: "Tell me about Durvesh's experience with Angular 16, Golang microservices, and FastAPI.",
            icon: Code2,
        },
        {
            title: "AI Workflows & MCP",
            prompt: "How has Durvesh integrated AI-assisted SDLC workflows, Cursor, and Model Context Protocol (MCP) into engineering?",
            icon: Layers,
        },
    ],
    recruiter: [
        {
            title: "Career Impact & Scale",
            prompt: "What are Durvesh's top career achievements and metrics across 10,000+ enterprise environments?",
            icon: Briefcase,
        },
        {
            title: "Enterprise Experience",
            prompt: "Tell me about Durvesh's software engineering roles at Cohesity and Veritas ($1B+ ARR NetBackup platform).",
            icon: User,
        },
        {
            title: "Honors & Education",
            prompt: "What is Durvesh's educational background, M.S. degree honors, and 11x Employee Recognition Awards?",
            icon: ShieldAlert,
        },
    ],
    casual: [
        {
            title: "Quick Overview",
            prompt: "Hi Durvesh! Tell me about yourself and your background in a nutshell.",
            icon: Compass,
        },
        {
            title: "Favorite Projects",
            prompt: "What projects or hackathon wins are you most proud of?",
            icon: BrainCircuit,
        },
        {
            title: "Career Goals",
            prompt: "What kind of software engineering roles and technical challenges are you looking for?",
            icon: MessageSquare,
        },
    ],
};

const MODE_THEMES = {
    engineer: {
        accentBg: 'bg-[#D97757]',
        hoverBg: 'hover:bg-[#C26243]',
        textAccent: 'text-[#D97757]',
        borderFocus: 'focus-within:border-[#D97757]',
        ringFocus: 'focus-within:ring-[#D97757]/15',
        subtleBg: 'bg-[#FAF9F5]',
        badgeBg: 'bg-[#D97757]/10 text-[#D97757]',
    },
    recruiter: {
        accentBg: 'bg-emerald-600',
        hoverBg: 'hover:bg-emerald-700',
        textAccent: 'text-emerald-600',
        borderFocus: 'focus-within:border-emerald-600',
        ringFocus: 'focus-within:ring-emerald-600/15',
        subtleBg: 'bg-emerald-50/50',
        badgeBg: 'bg-emerald-100 text-emerald-700',
    },
    casual: {
        accentBg: 'bg-blue-600',
        hoverBg: 'hover:bg-blue-700',
        textAccent: 'text-blue-600',
        borderFocus: 'focus-within:border-blue-600',
        ringFocus: 'focus-within:ring-blue-600/15',
        subtleBg: 'bg-blue-50/50',
        badgeBg: 'bg-blue-100 text-blue-700',
    },
};

const API_BASE_URL = 'https://usy5pemmul.execute-api.us-east-1.amazonaws.com';

// Formatted Markdown component for response bubbles
function FormattedMessageContent({ content }: { content: string }) {
    const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

    const handleCopyCode = (codeText: string, idx: number) => {
        navigator.clipboard.writeText(codeText);
        setCopiedCodeIndex(idx);
        setTimeout(() => setCopiedCodeIndex(null), 2000);
    };

    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-2">
            {parts.map((part, idx) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const lines = part.slice(3, -3).trim().split('\n');
                    const firstLine = lines[0].trim();
                    const hasLang = !firstLine.includes(' ') && firstLine.length > 0 && firstLine.length < 15;
                    const language = hasLang ? firstLine : 'code';
                    const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

                    return (
                        <div key={idx} className="my-3 rounded-xl border border-[#2D2D2A] bg-[#1E1E1C] text-[#FAF9F5] overflow-hidden text-xs font-mono shadow-xs">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-[#2A2A27] border-b border-[#363633] text-[10px] text-[#A1A09A]">
                                <span>{language}</span>
                                <button
                                    onClick={() => handleCopyCode(codeBody, idx)}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                    {copiedCodeIndex === idx ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy code</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <pre className="p-3 overflow-x-auto leading-relaxed text-[#E6E4DF]">
                                <code>{codeBody}</code>
                            </pre>
                        </div>
                    );
                }

                const paragraphs = part.split('\n\n');
                return (
                    <div key={idx} className="space-y-2">
                        {paragraphs.map((p, pIdx) => {
                            if (!p.trim()) return null;
                            const lines = p.split('\n');
                            const isList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim()));

                            if (isList) {
                                return (
                                    <ul key={pIdx} className="list-disc list-inside space-y-1 my-1.5 pl-1">
                                        {lines.map((line, lIdx) => {
                                            const cleanLine = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
                                            return (
                                                <li key={lIdx} className="leading-relaxed">
                                                    {formatInlineStyles(cleanLine)}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            }

                            return (
                                <p key={pIdx} className="leading-relaxed">
                                    {lines.map((line, lIdx) => (
                                        <span key={lIdx}>
                                            {formatInlineStyles(line)}
                                            {lIdx < lines.length - 1 && <br />}
                                        </span>
                                    ))}
                                </p>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function formatInlineStyles(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-semibold text-[#1E1E1C]">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-[#EFECE6] text-[#D97757] font-mono text-[11px] px-1 py-0.5 rounded">{part.slice(1, -1)}</code>;
        }
        return part;
    });
}

export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string>('');
    const [mode, setMode] = useState<ConversationMode>('engineer');
    const [activeTab, setActiveTab] = useState<'prompts' | 'projects'>('prompts');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const theme = MODE_THEMES[mode];
    const currentPrompts = MODE_PROMPTS[mode];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [input]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recognition.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                    }
                    if (transcript) {
                        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
                    }
                };

                recognition.onerror = () => setIsListening(false);
                recognition.onend = () => setIsListening(false);

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Voice recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch {
                setIsListening(false);
            }
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startNewChat = () => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
        setMessages([]);
        setSessionId('');
        setInput('');
    };

    const handleSend = async (messageText?: string) => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const text = (messageText || input).trim();
        if (!text || isLoading) return;

        const userMessageId = Date.now().toString();
        const userMessage: Message = {
            id: userMessageId,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        const assistantMessageId = (Date.now() + 1).toString();
        const initialAssistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        };

        setMessages(prev => [...prev, userMessage, initialAssistantMessage]);
        if (!messageText) setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    session_id: sessionId || undefined,
                    mode: mode,
                }),
            });

            if (!response.ok || !response.body) {
                throw new Error('Streaming failed, attempting standard request');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });
                const lines = chunkText.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (!dataStr) continue;

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === 'session' && parsed.session_id) {
                                setSessionId(parsed.session_id);
                            } else if (parsed.type === 'chunk' && parsed.text) {
                                accumulatedContent += parsed.text;
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, content: accumulatedContent }
                                            : msg
                                    )
                                );
                            } else if (parsed.type === 'done') {
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === assistantMessageId
                                            ? { ...msg, isStreaming: false }
                                            : msg
                                    )
                                );
                            }
                        } catch {
                            // Non-JSON line ignored
                        }
                    }
                }
            }
        } catch {
            try {
                const fallbackResponse = await fetch(`${API_BASE_URL}/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, session_id: sessionId || undefined, mode: mode }),
                });

                if (fallbackResponse.ok) {
                    const data = await fallbackResponse.json();
                    if (!sessionId) setSessionId(data.session_id);
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === assistantMessageId
                                ? { ...msg, content: data.response, isStreaming: false }
                                : msg
                        )
                    );
                } else {
                    throw new Error('Fallback failed');
                }
            } catch {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? {
                                  ...msg,
                                  content: "I ran into a temporary connection issue. Please try again.",
                                  isStreaming: false,
                              }
                            : msg
                    )
                );
            }
        } finally {
            setIsLoading(false);
            setMessages(prev =>
                prev.map(msg => (msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg))
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full max-w-4xl mx-auto px-3 sm:px-6 relative transition-colors duration-300 bg-dot-pattern">
            {/* Minimalist Claude Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-3.5 border-b border-[#E8E6DF] bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-20 gap-2.5 transition-all">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${theme.accentBg} text-white flex items-center justify-center font-semibold text-xs sm:text-sm shadow-xs transition-colors duration-300 font-display`}>
                            DD
                        </div>
                        <div>
                            <h1 className="text-sm sm:text-base font-semibold text-[#1E1E1C] leading-none flex items-center gap-1.5 sm:gap-2 font-display">
                                Ask Durvesh
                                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-normal bg-[#EFECE6] text-[#6E6D66]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live AI
                                </span>
                            </h1>
                            <p className="text-[11px] sm:text-xs text-[#6E6D66] mt-0.5">Talk to my Digital Twin</p>
                        </div>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={startNewChat}
                            className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#6E6D66] bg-[#EFECE6] active:scale-95 rounded-lg"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Mode Selector & Desktop Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    {/* Animated Mode Selector Pill */}
                    <div className="relative inline-flex items-center bg-[#EFECE6] p-0.5 rounded-xl border border-[#E2DFD7] text-xs">
                        <div
                            className={`absolute top-0.5 bottom-0.5 w-[calc(33.333%-2px)] bg-white rounded-lg shadow-2xs transition-all duration-300 ease-out ${
                                mode === 'engineer' ? 'left-0.5' : mode === 'recruiter' ? 'left-[calc(33.333%+1px)]' : 'left-[calc(66.666%+0.5px)]'
                            }`}
                        />
                        <button
                            onClick={() => setMode('engineer')}
                            className={`relative z-10 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors duration-200 ${
                                mode === 'engineer' ? 'text-[#1E1E1C]' : 'text-[#6E6D66] hover:text-[#1E1E1C]'
                            }`}
                        >
                            <Code2 className="w-3 h-3 text-[#D97757]" />
                            <span>Engineer</span>
                        </button>
                        <button
                            onClick={() => setMode('recruiter')}
                            className={`relative z-10 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors duration-200 ${
                                mode === 'recruiter' ? 'text-[#1E1E1C]' : 'text-[#6E6D66] hover:text-[#1E1E1C]'
                            }`}
                        >
                            <Briefcase className="w-3 h-3 text-emerald-600" />
                            <span>Recruiter</span>
                        </button>
                        <button
                            onClick={() => setMode('casual')}
                            className={`relative z-10 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors duration-200 ${
                                mode === 'casual' ? 'text-[#1E1E1C]' : 'text-[#6E6D66] hover:text-[#1E1E1C]'
                            }`}
                        >
                            <MessageSquare className="w-3 h-3 text-blue-600" />
                            <span>Casual</span>
                        </button>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={startNewChat}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#6E6D66] hover:text-[#1E1E1C] bg-[#EFECE6] hover:bg-[#E2DFD7] active:scale-95 rounded-lg transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Chat</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Conversation Messages / Empty State */}
            <div className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center max-w-2xl mx-auto px-2 animate-fade-in-up">
                        {/* Adaptive Emblem matching active Mode Theme */}
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-[#E8E6DF] flex items-center justify-center ${theme.textAccent} mb-3.5 sm:mb-4 shadow-2xs transition-colors duration-300`}>
                            <Compass className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1C] mb-1.5 tracking-tight font-display">
                            Ask Durvesh
                        </h2>
                        <p className="text-xs sm:text-sm text-[#6E6D66] mb-5 sm:mb-6 leading-relaxed max-w-md">
                            Explore Durvesh&apos;s background, technical architecture philosophy, key projects, and software engineering experience.
                        </p>

                        {/* Feature 4: Sliding Animated Tab Bar */}
                        <div className="relative flex items-center bg-[#EFECE6] p-1 rounded-xl mb-5 text-xs w-64 sm:w-72">
                            <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-2xs transition-all duration-300 ease-out ${
                                    activeTab === 'prompts' ? 'left-1' : 'left-[calc(50%+2px)]'
                                }`}
                            />
                            <button
                                onClick={() => setActiveTab('prompts')}
                                className={`relative z-10 w-1/2 py-1 text-center font-medium transition-colors duration-200 ${
                                    activeTab === 'prompts' ? 'text-[#1E1E1C]' : 'text-[#6E6D66] hover:text-[#1E1E1C]'
                                }`}
                            >
                                Quick Prompts ({mode})
                            </button>
                            <button
                                onClick={() => setActiveTab('projects')}
                                className={`relative z-10 w-1/2 py-1 text-center font-medium transition-colors duration-200 ${
                                    activeTab === 'projects' ? 'text-[#1E1E1C]' : 'text-[#6E6D66] hover:text-[#1E1E1C]'
                                }`}
                            >
                                Featured Projects
                            </button>
                        </div>

                        {/* Animated Tab Content Transition */}
                        <div key={activeTab} className="w-full animate-fade-in-up">
                            {activeTab === 'prompts' ? (
                                <div key={mode} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full animate-fade-in-up">
                                    {currentPrompts.map((item, idx) => {
                                        const IconComponent = item.icon;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(item.prompt)}
                                                className="flex flex-col items-start p-3 sm:p-3.5 bg-white hover:bg-[#F4F2EC] active:scale-[0.98] hover:-translate-y-0.5 border border-[#E8E6DF] hover:border-[#D4D1C7] rounded-xl text-left transition-all duration-200 shadow-2xs hover:shadow-xs group"
                                            >
                                                <div className={`p-1.5 sm:p-2 rounded-lg bg-[#FAF9F5] ${theme.textAccent} group-hover:bg-white mb-2 transition-colors duration-200`}>
                                                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                                <span className="text-xs font-semibold text-[#1E1E1C] mb-0.5 sm:mb-1 font-display">
                                                    {item.title}
                                                </span>
                                                <span className="text-[11px] text-[#6E6D66] line-clamp-2 leading-tight">
                                                    {item.prompt}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Resume Featured Project Cards */
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                                    {FEATURED_PROJECTS.map((proj) => (
                                        <div
                                            key={proj.id}
                                            className="flex flex-col justify-between p-3.5 bg-white border border-[#E8E6DF] rounded-xl shadow-2xs hover:border-[#D4D1C7] hover:-translate-y-0.5 transition-all duration-200"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                                    <span className={`inline-block text-[10px] font-mono font-medium ${theme.textAccent} bg-[#FAF9F5] px-2 py-0.5 rounded`}>
                                                        {proj.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-xs font-semibold text-[#1E1E1C] mb-1 font-display">
                                                    {proj.title}
                                                </h3>
                                                <p className="text-[11px] text-[#6E6D66] leading-relaxed mb-3 line-clamp-3">
                                                    {proj.description}
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {proj.techStack.map((tech, tIdx) => (
                                                        <span
                                                            key={tIdx}
                                                            className="text-[9px] font-mono bg-[#EFECE6] text-[#6E6D66] px-1.5 py-0.5 rounded"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => handleSend(proj.askPrompt)}
                                                    className="w-full py-1.5 px-2 bg-[#FAF9F5] hover:bg-[#EFECE6] text-[11px] font-medium text-[#1E1E1C] border border-[#E8E6DF] rounded-lg transition-colors flex items-center justify-center gap-1 group"
                                                >
                                                    <span>Ask about this</span>
                                                    <ExternalLink className={`w-3 h-3 text-[#6E6D66] group-hover:${theme.textAccent}`} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 sm:space-y-6 max-w-3xl mx-auto">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex flex-col animate-fade-in-up ${
                                    message.role === 'user' ? 'items-end' : 'items-start'
                                }`}
                            >
                                <div
                                    className={`relative group max-w-[92%] sm:max-w-[84%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed ${
                                        message.role === 'user'
                                            ? 'bg-[#1E1E1C] text-[#FAF9F5] rounded-br-xs shadow-xs font-normal'
                                            : 'bg-white border border-[#E8E6DF] text-[#1E1E1C] rounded-bl-xs shadow-2xs'
                                    }`}
                                >
                                    {/* Feature 1: Structured Markdown & Code Block Highlighting */}
                                    <div className="font-sans">
                                        <FormattedMessageContent content={message.content} />
                                        {/* Blinking Caret ONLY shown while actively streaming text content */}
                                        {message.isStreaming && message.content && <span className="animate-caret" />}
                                    </div>

                                    {/* Copy Response Button for Assistant Messages */}
                                    {message.role === 'assistant' && message.content && !message.isStreaming && (
                                        <button
                                            onClick={() => copyToClipboard(message.content, message.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-[#FAF9F5] hover:bg-[#EFECE6] border border-[#E8E6DF] text-[#6E6D66] hover:text-[#1E1E1C] transition-all"
                                            title="Copy response"
                                        >
                                            {copiedId === message.id ? (
                                                <Check className="w-3 h-3 text-emerald-600" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}

                                    {/* Wave Loader ONLY shown when waiting for initial response tokens */}
                                    {message.role === 'assistant' && !message.content && message.isStreaming && (
                                        <div className="flex items-center gap-1.5 py-1 px-1 text-[#6E6D66]">
                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${theme.accentBg} animate-wave-1`} />
                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${theme.accentBg} animate-wave-2`} />
                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${theme.accentBg} animate-wave-3`} />
                                            <span className="text-[11px] text-[#6E6D66] ml-2 font-mono">Thinking…</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-[#6E6D66] px-1 mt-1 font-mono">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Mobile-Friendly Input Bar */}
            <div className="sticky bottom-0 bg-gradient-to-t from-[#FAF9F5] via-[#FAF9F5]/95 to-transparent pt-2 pb-4 sm:pb-6 z-20">
                <div className={`max-w-3xl mx-auto bg-white border border-[#E8E6DF] ${theme.borderFocus} ${theme.ringFocus} focus-within:ring-2 rounded-2xl shadow-sm transition-all duration-200 p-2 sm:p-2.5`}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening... Speak now" : "Ask Durvesh anything..."}
                        rows={1}
                        className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xs sm:text-sm text-[#1E1E1C] placeholder-[#6E6D66] resize-none px-2 pt-1 pb-1 max-h-36 min-h-[38px] sm:min-h-[42px] leading-relaxed"
                        disabled={isLoading}
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-[#F4F2EC] px-1">
                        <span className="text-[10px] sm:text-[11px] text-[#6E6D66] flex items-center gap-1">
                            <span className="font-mono bg-[#EFECE6] px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">Enter ↵</span> to send
                        </span>

                        <div className="flex items-center gap-1.5">
                            {/* Feature: Hands-Free Voice Input Button */}
                            <button
                                type="button"
                                onClick={toggleVoiceInput}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    isListening
                                        ? 'bg-red-500 text-white animate-mic-pulse shadow-md'
                                        : 'bg-[#FAF9F5] hover:bg-[#EFECE6] text-[#6E6D66] hover:text-[#1E1E1C] border border-[#E8E6DF]'
                                }`}
                                title={isListening ? "Stop Listening" : "Voice Input (Hands-free)"}
                            >
                                {isListening ? (
                                    <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                ) : (
                                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                )}
                            </button>

                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${theme.accentBg} ${theme.hoverBg} active:scale-95 text-white flex items-center justify-center disabled:opacity-40 transition-all duration-200 shadow-2xs`}
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Enhanced Powered By Tech Stack Footer */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-[#6E6D66] mt-2.5 text-center px-2">
                    <span className="font-medium text-[#1E1E1C]">Ask Durvesh</span>
                    <span>&middot;</span>
                    <span>Powered by</span>
                    <span className="inline-flex items-center gap-1 font-mono bg-[#EFECE6] px-1.5 py-0.5 rounded text-[9px] text-[#1E1E1C]">
                        Gemini 2.5 Flash
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono bg-[#EFECE6] px-1.5 py-0.5 rounded text-[9px] text-[#1E1E1C]">
                        FastAPI
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono bg-[#EFECE6] px-1.5 py-0.5 rounded text-[9px] text-[#1E1E1C]">
                        AWS Lambda
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono bg-[#EFECE6] px-1.5 py-0.5 rounded text-[9px] text-[#1E1E1C]">
                        Next.js
                    </span>
                </div>
            </div>
        </div>
    );
}