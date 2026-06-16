"use client";

import { useEffect, useState } from "react";
import { List, Button, message, Typography, Popconfirm, Empty } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const { Title, Text } = Typography;

interface Draft {
  id: number;
  title: string;
  summary: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) { router.push("/login"); return; }
    loadDrafts();
  }, [isLoggedIn]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/articles/drafts");
      if (res.data.code === 200) setDrafts(res.data.data || []);
    } catch { message.error("加载草稿失败"); }
    setLoading(false);
  };

  const deleteDraft = async (id: number) => {
    try {
      const res = await api.delete(`/api/v1/articles/draft/${id}`);
      if (res.data.code === 200) {
        message.success("草稿已删除");
        setDrafts(drafts.filter((d) => d.id !== id));
      }
    } catch { message.error("删除失败"); }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>📝 我的草稿</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin")}>
          写新文章
        </Button>
      </div>

      {drafts.length === 0 && !loading ? (
        <Empty description="暂无草稿" />
      ) : (
        <List
          loading={loading}
          dataSource={drafts}
          renderItem={(draft) => (
            <List.Item
              actions={[
                <Button key="edit" icon={<EditOutlined />} onClick={() => router.push(`/admin?draft=${draft.id}`)}>
                  继续编辑
                </Button>,
                <Popconfirm key="del" title="确定删除此草稿？" onConfirm={() => deleteDraft(draft.id)}>
                  <Button danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <a onClick={() => router.push(`/admin?draft=${draft.id}`)} style={{ fontSize: 16, cursor: "pointer" }}>
                    {draft.title || "无标题草稿"}
                  </a>
                }
                description={
                  <span>
                    <Text type="secondary">最后更新：{draft.updatedAt?.slice(0, 16).replace("T", " ")}</Text>
                    {draft.summary && <> · {draft.summary.slice(0, 80)}</>}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
