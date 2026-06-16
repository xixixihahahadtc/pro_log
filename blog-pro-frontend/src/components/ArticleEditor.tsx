"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import { Button, Space, Segmented, Tooltip } from "antd";
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined,
  CodeOutlined, LinkOutlined,
  OrderedListOutlined, UnorderedListOutlined,
  TableOutlined, PictureOutlined, HighlightOutlined,
} from "@ant-design/icons";
import { useCallback, useRef, useState } from "react";
import { message } from "antd";
import api from "@/lib/api";

const lowlight = createLowlight(common);

interface ArticleEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function ArticleEditor({ content, onChange, placeholder }: ArticleEditorProps) {
  const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg");
  const [markdownText, setMarkdownText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      message.error("图片不能超过 10MB");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/api/v1/upload/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.code === 200 && editor) {
        editor.chain().focus().setImage({ src: res.data.data.url }).run();
        message.success("图片已插入");
      } else {
        message.error(res.data.message || "上传失败");
      }
    } catch {
      message.error("图片上传失败，请重试");
    }
    // 重置 input 以允许重复上传同一文件
    e.target.value = "";
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      ImageExt,
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Highlight,
      Placeholder.configure({ placeholder: placeholder || "开始你的创作..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  const switchToMarkdown = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      setMarkdownText(html);
      setMode("markdown");
    }
  }, [editor]);

  const switchToWysiwyg = useCallback(() => {
    if (editor && markdownText) {
      editor.commands.setContent(markdownText);
    }
    setMode("wysiwyg");
  }, [editor, markdownText]);

  if (!editor) return null;

  const Toolbar = (
    <Space wrap size={4} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
      <Tooltip title="加粗 (Ctrl+B)">
        <Button icon={<BoldOutlined />} type={editor.isActive("bold") ? "primary" : "default"} size="small" onClick={() => editor.chain().focus().toggleBold().run()} />
      </Tooltip>
      <Tooltip title="斜体 (Ctrl+I)">
        <Button icon={<ItalicOutlined />} type={editor.isActive("italic") ? "primary" : "default"} size="small" onClick={() => editor.chain().focus().toggleItalic().run()} />
      </Tooltip>
      <Tooltip title="下划线 (Ctrl+U)">
        <Button icon={<UnderlineOutlined />} type={editor.isActive("underline") ? "primary" : "default"} size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} />
      </Tooltip>
      <Tooltip title="高亮">
        <Button icon={<HighlightOutlined />} type={editor.isActive("highlight") ? "primary" : "default"} size="small" onClick={() => editor.chain().focus().toggleHighlight().run()} />
      </Tooltip>
      <span style={{ color: "#ddd" }}>|</span>
      <Button size="small" type={editor.isActive("heading", { level: 1 }) ? "primary" : "default"} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Button>
      <Button size="small" type={editor.isActive("heading", { level: 2 }) ? "primary" : "default"} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
      <Button size="small" type={editor.isActive("heading", { level: 3 }) ? "primary" : "default"} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Button>
      <span style={{ color: "#ddd" }}>|</span>
      <Tooltip title="引用">
        <Button size="small" type={editor.isActive("blockquote") ? "primary" : "default"} onClick={() => editor.chain().focus().toggleBlockquote().run()}>"</Button>
      </Tooltip>
      <Tooltip title="代码块">
        <Button icon={<CodeOutlined />} size="small" type={editor.isActive("codeBlock") ? "primary" : "default"} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      </Tooltip>
      <Tooltip title="有序列表">
        <Button icon={<OrderedListOutlined />} size="small" type={editor.isActive("orderedList") ? "primary" : "default"} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      </Tooltip>
      <Tooltip title="无序列表">
        <Button icon={<UnorderedListOutlined />} size="small" type={editor.isActive("bulletList") ? "primary" : "default"} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      </Tooltip>
      <span style={{ color: "#ddd" }}>|</span>
      <Tooltip title="上传图片">
        <Button icon={<PictureOutlined />} size="small" onClick={handleUploadImage} />
      </Tooltip>
      <Tooltip title="插入链接">
        <Button icon={<LinkOutlined />} size="small" onClick={() => {
          const url = window.prompt("链接 URL:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} />
      </Tooltip>
      <Tooltip title="插入表格">
        <Button icon={<TableOutlined />} size="small" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
      </Tooltip>
    </Space>
  );

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
        <Segmented
          value={mode}
          onChange={(val) => {
            if (val === "markdown") switchToMarkdown();
            else switchToWysiwyg();
          }}
          options={[
            { label: "所见即所得", value: "wysiwyg" },
            { label: "Markdown (HTML)", value: "markdown" },
          ]}
          size="small"
        />
      </div>

      {mode === "wysiwyg" ? (
        <>
          {Toolbar}
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: "0 16px", minHeight: 400, fontSize: 16, lineHeight: 2 }}>
            <EditorContent editor={editor} />
          </div>
        </>
      ) : (
        <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: "#fafafa", padding: "4px 12px", fontSize: 12, color: "#999", borderBottom: "1px solid #f0f0f0" }}>
            直接编辑 HTML 内容
          </div>
          <textarea
            value={markdownText}
            onChange={(e) => {
              setMarkdownText(e.target.value);
              onChange(e.target.value);
            }}
            style={{ width: "100%", minHeight: 420, border: "none", outline: "none", padding: 16, fontFamily: "monospace", fontSize: 14, lineHeight: 1.8, resize: "vertical" }}
            placeholder="<p>开始你的创作...</p>"
          />
        </div>
      )}
    </div>
  );
}
