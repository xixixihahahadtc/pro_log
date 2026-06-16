"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FloatButton, Drawer, Input, Button, Space, message, Typography, Card, Spin } from "antd";
import { RobotOutlined, SendOutlined, ThunderboltOutlined, EditOutlined, BulbOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const { Text } = Typography;

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Send message with SSE streaming
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMsg = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build just the conversation messages (no system prompt — backend adds it)
      const history = updated.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"}/api/v1/ai/chat/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        }
      );

      const reader = res.body?.getReader();
      if (!reader) { message.error("流式读取失败"); setLoading(false); return; }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Stream complete — add final assistant message
          if (fullContent) {
            setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
            setStreamingContent("");
          }
          break;
        }

        fullContent += decoder.decode(value, { stream: true });
        setStreamingContent(fullContent);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        message.error("AI 请求失败，请确认 DeepSeek API Key 已配置");
      }
    }
    setLoading(false);
    abortRef.current = null;
  };

  // Stop generation
  const stopGeneration = () => {
    abortRef.current?.abort();
    if (streamingContent) {
      setMessages(prev => [...prev, { role: "assistant", content: streamingContent }]);
      setStreamingContent("");
    }
    setLoading(false);
  };

  // Copy to clipboard
  const copyContent = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  }, []);

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setStreamingContent("");
  };

  // Quick actions
  const quickActions = [
    { icon: <EditOutlined />, label: "帮我写大纲", prompt: "请为博客文章「如何学好编程」生成一份详细大纲" },
    { icon: <BulbOutlined />, label: "改写润色", prompt: "请帮我润色以下文字，让它更流畅、更有文采：" },
    { icon: <ThunderboltOutlined />, label: "起标题", prompt: "为一篇关于人工智能的博客文章生成5个吸引人的标题建议" },
  ];

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24, width: 56, height: 56 }}
        tooltip="AI 助手"
        onClick={() => setOpen(true)}
      />
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>🤖 AI 写作助手</span>
            {messages.length > 0 && (
              <Button size="small" icon={<DeleteOutlined />} onClick={clearChat} type="text" danger>
                清空对话
              </Button>
            )}
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setOpen(false)}
        open={open}
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Messages Area */}
          <div style={{ flex: 1, overflow: "auto", marginBottom: 12, paddingBottom: 8 }}>
            {messages.length === 0 && !streamingContent && (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Text type="secondary">👋 我是 AI 写作助手，支持流式对话和上下文记忆</Text>
                <div style={{ marginTop: 16 }}>
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      icon={action.icon}
                      size="small"
                      style={{ margin: 4 }}
                      onClick={() => setInput(action.prompt)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{
                  textAlign: msg.role === "user" ? "right" : "left",
                  marginBottom: 4,
                }}>
                  <Text style={{ fontSize: 11, color: "#999" }}>
                    {msg.role === "user" ? "你" : "🤖 AI"}
                  </Text>
                </div>
                {msg.role === "user" ? (
                  <div style={{
                    display: "inline-block",
                    maxWidth: "85%",
                    background: "#1677ff",
                    color: "#fff",
                    borderRadius: "12px 12px 4px 12px",
                    fontSize: 14,
                    lineHeight: 1.6,
                    float: "right",
                  }}>
                    {msg.content}
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <div style={{
                      background: "#f5f5f5",
                      borderRadius: "12px 12px 12px 4px",
                      padding: "12px 16px",
                      fontSize: 14,
                      lineHeight: 1.8,
                      maxWidth: "100%",
                    }}>
                      <div className="markdown-body" style={{ fontSize: 14 }}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const inline = !match;
                              return !inline ? (
                                <SyntaxHighlighter
                                  style={oneDark as any}
                                  language={match[1]}
                                  PreTag="div"
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props} style={{ background: "#e8e8e8", padding: "2px 6px", borderRadius: 3, fontSize: 13 }}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <Button
                      icon={<CopyOutlined />}
                      size="small"
                      type="text"
                      style={{ position: "absolute", top: 4, right: 4, opacity: 0.5 }}
                      onClick={() => copyContent(msg.content)}
                    />
                  </div>
                )}
                <div style={{ clear: "both" }} />
              </div>
            ))}

            {/* Streaming content */}
            {streamingContent && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: "#999" }}>🤖 AI 正在输入...</Text>
                </div>
                <div style={{
                  background: "#f5f5f5",
                  borderRadius: "12px 12px 12px 4px",
                  padding: "12px 16px",
                  fontSize: 14,
                  lineHeight: 1.8,
                }}>
                  <div className="markdown-body" style={{ fontSize: 14 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={sendMessage}
              placeholder="输入消息... (Enter 发送)"
              disabled={loading}
            />
            {loading ? (
              <Button danger onClick={stopGeneration}>停止</Button>
            ) : (
              <Button type="primary" icon={<SendOutlined />} onClick={sendMessage}>发送</Button>
            )}
          </Space.Compact>
        </div>
      </Drawer>
    </>
  );
}
