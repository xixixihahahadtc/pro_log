"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { Card, Input, Button, message, Typography, Select, Divider, Spin } from "antd";
import { SaveOutlined, SendOutlined, FileTextOutlined, PictureOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import ArticleEditor from "@/components/ArticleEditor";

const { Title } = Typography;

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spin size="large" /></div>}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const [draftId, setDraftId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [categoryOptions, setCategoryOptions] = useState<{label:string, value:number}[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { message.error("图片不能超过 10MB"); return; }
    setCoverUploading(true);
    const form = new FormData();
    form.append("file", file);
    api.post("/api/v1/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => {
        if (res.data.code === 200) { setCoverImageUrl(res.data.data.url); message.success("封面上传成功"); }
        else message.error(res.data.message || "上传失败");
      })
      .catch(() => message.error("上传失败"))
      .finally(() => setCoverUploading(false));
    e.target.value = "";
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn]);

  // 加载文章到编辑器（draft 或 edit 模式）
  useEffect(() => {
    const loadArticle = async (id: number, mode: "draft" | "edit") => {
      try {
        const url =
          mode === "draft"
            ? `/api/v1/articles/draft/${id}`
            : `/api/v1/articles/admin/${id}`;
        const res = await api.get(url);
        if (res.data.code === 200) {
          const article = res.data.data;
          setDraftId(article.id);
          setTitle(article.title || "");
          setContent(article.content || "");
          setSummary(article.summary || "");
          setCoverImageUrl(article.coverImageUrl || "");
          setCategoryId(article.categoryId);
          if (mode === "edit") {
            message.info(`正在编辑「${article.title || "无标题"}」`);
          } else {
            message.info(`已恢复草稿「${article.title || "无标题"}」`);
          }
        } else {
          message.error(res.data.message || (mode === "edit" ? "加载文章失败" : "加载草稿失败"));
        }
      } catch {
        message.error(mode === "edit" ? "加载文章失败" : "加载草稿失败");
      }
    };

    const draftParam = searchParams.get("draft");
    const editParam = searchParams.get("edit");

    if (draftParam) {
      loadArticle(parseInt(draftParam, 10), "draft");
    } else if (editParam) {
      loadArticle(parseInt(editParam, 10), "edit");
    } else {
      // 自动加载最近的草稿（仅在无 draft 和 edit 参数时）
      api
        .get("/api/v1/articles/drafts")
        .then((res) => {
          if (res.data.code === 200 && res.data.data?.length > 0) {
            const latest = res.data.data[0];
            setDraftId(latest.id);
            setTitle(latest.title || "");
            setContent(latest.content || "");
            setSummary(latest.summary || "");
            setCoverImageUrl(latest.coverImageUrl || "");
            setCategoryId(latest.categoryId);
            message.info(`已恢复最近草稿「${latest.title || "无标题"}」`);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    api.get("/api/v1/categories").then((res) => {
      if (res.data.code === 200) {
        const cats: {label: string, value: number}[] = [];
        function walk(nodes: any[]) {
          for (const node of nodes) {
            cats.push({ label: node.name, value: node.id });
            if (node.children) walk(node.children);
          }
        }
        walk(res.data.data || []);
        setCategoryOptions(cats);
      }
    }).catch(() => {});
  }, []);

  // 自动保存：停止输入 3 秒后保存
  const autoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // edit 模式下不自动保存 — 只手动保存
      if (searchParams.get("edit")) return;
      if (!title && !content) return;
      setSaving(true);
      try {
        const res = await api.post("/api/v1/articles/draft", {
          id: draftId,
          title, content, summary, coverImageUrl, categoryId
        });
        if (res.data.code === 200) {
          if (!draftId) setDraftId(res.data.data.id);
          setLastSaved(new Date().toLocaleTimeString());
        }
      } catch { /* 静默失败 */ }
      setSaving(false);
    }, 3000);
  }, [title, content, summary, coverImageUrl, categoryId, draftId]);

  // 监听字段变化触发自动保存
  useEffect(() => { autoSave(); }, [title, content, summary, coverImageUrl, categoryId, autoSave]);

  // Ctrl+S 手动保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        autoSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [autoSave]);

  // 发布文章
  const handlePublish = async () => {
    if (!title.trim()) { message.error("标题不能为空"); return; }
    if (!content.trim()) { message.error("内容不能为空"); return; }
    setPublishing(true);
    try {
      const editMode = searchParams.get("edit");
      if (editMode) {
        // 编辑已发布文章：直接更新
        const res = await api.put(`/api/v1/articles/${editMode}`, {
          title, content, summary, coverImageUrl, categoryId
        });
        if (res.data.code === 200) {
          message.success("文章更新成功！");
          router.push("/");
        } else {
          message.error(res.data.message || "更新失败");
        }
      } else {
        // 新建/草稿：保存草稿 + 发布
        const saveRes = await api.post("/api/v1/articles/draft", {
          id: draftId, title, content, summary, coverImageUrl, categoryId
        });
        const articleId = saveRes.data.data.id;

        const pubRes = await api.put(`/api/v1/articles/${articleId}/publish`);
        if (pubRes.data.code === 200) {
          message.success("文章发布成功！");
          router.push("/");
        } else {
          message.error(pubRes.data.message || "发布失败");
        }
      }
    } catch {
      const isEdit = !!searchParams.get("edit");
      message.error(isEdit ? "更新失败" : "发布失败");
    }
    setPublishing(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            {searchParams.get("edit") ? "✏️ 编辑文章" : "✏️ 创作新文章"}
          </Title>
          {lastSaved && (
            <span style={{ fontSize: 12, color: "#52c41a", background: "#f6ffed", padding: "2px 10px", borderRadius: 4 }}>
              {saving ? "保存中..." : `草稿已保存 ${lastSaved}`}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<FileTextOutlined />} onClick={() => router.push("/admin/drafts")}>
            我的草稿
          </Button>
          <Button icon={<SaveOutlined />} onClick={autoSave} loading={saving}>保存草稿</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={handlePublish} loading={publishing}>发布文章</Button>
        </div>
      </div>

      <Card>
        <Input
          size="large"
          placeholder="文章标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ fontSize: 24, fontWeight: 700, border: "none", paddingLeft: 0, marginBottom: 12 }}
          variant="borderless"
        />

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <Select
            placeholder="选择分类"
            value={categoryId}
            onChange={setCategoryId}
            allowClear
            style={{ width: 150 }}
            options={categoryOptions}
          />
          <Input
            placeholder="文章摘要（选填）"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ flex: 2 }}
          />
          <input
            ref={coverFileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={handleCoverUpload}
          />
          <Button
            icon={<PictureOutlined />}
            loading={coverUploading}
            onClick={() => coverFileRef.current?.click()}
          >
            封面
          </Button>
          {coverImageUrl && (
            <Input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="封面图 URL"
              style={{ flex: 1 }}
            />
          )}
        </div>

        <Divider style={{ margin: "0 0 16px 0" }} />

        <ArticleEditor
          content={content}
          onChange={setContent}
          placeholder="开始你的创作..."
        />
      </Card>
    </div>
  );
}
