"use client";

import { useEffect, useState } from "react";
import { Table, Select, Button, Tag, Popconfirm, message, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { label: "全部", value: "ALL" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "草稿", value: "DRAFT" },
  { label: "已归档", value: "ARCHIVED" },
];

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  PUBLISHED: { color: "green", label: "已发布" },
  DRAFT: { color: "orange", label: "草稿" },
  ARCHIVED: { color: "default", label: "已归档" },
};

interface Article {
  id: number;
  title: string;
  status: string;
  categoryId: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  updatedAt: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchArticles = async (p: number, s: string) => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/articles/admin", {
        params: { page: p, size: 10, status: s },
      });
      if (res.data.code === 200) {
        setArticles(res.data.data.records || []);
        setTotal(res.data.data.total || 0);
      } else {
        message.error(res.data.message || "加载文章列表失败");
      }
    } catch {
      message.error("加载文章列表失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles(page, status);
  }, [page, status]);

  const handleArchive = async (id: number) => {
    try {
      const res = await api.delete(`/api/v1/articles/${id}`);
      if (res.data.code === 200) {
        message.success("已归档");
        fetchArticles(page, status);
      } else {
        message.error(res.data.message || "归档失败");
      }
    } catch {
      message.error("归档失败");
    }
  };

  const handleDeleteDraft = async (id: number) => {
    try {
      const res = await api.delete(`/api/v1/articles/draft/${id}`);
      if (res.data.code === 200) {
        message.success("草稿已删除");
        fetchArticles(page, status);
      } else {
        message.error(res.data.message || "删除失败");
      }
    } catch {
      message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text: string) => text || "无标题",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: "default", label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "浏览",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 70,
    },
    {
      title: "点赞",
      dataIndex: "likeCount",
      key: "likeCount",
      width: 70,
    },
    {
      title: "评论",
      dataIndex: "commentCount",
      key: "commentCount",
      width: 70,
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      render: (t: string) => t?.slice(0, 16).replace("T", " ") || "-",
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      render: (_: unknown, record: Article) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => router.push(`/admin?edit=${record.id}`)}
          >
            编辑
          </Button>
          {record.status === "DRAFT" ? (
            <Popconfirm
              title="确定删除此草稿？"
              onConfirm={() => handleDeleteDraft(record.id)}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定归档此文章？"
              onConfirm={() => handleArchive(record.id)}
            >
              <Button type="link" size="small" danger>
                归档
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          文章管理
        </Title>
        <Space>
          <Select
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            style={{ width: 120 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/admin")}
          >
            新建文章
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={articles}
        loading={loading}
        pagination={{
          current: page,
          total: total,
          pageSize: 10,
          showTotal: (t) => `共 ${t} 篇`,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
}
