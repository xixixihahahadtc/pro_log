"use client";

import { useEffect, useState } from "react";
import { Table, Select, Button, Tag, Popconfirm, message, Space, Typography } from "antd";
import api from "@/lib/api";

const { Title } = Typography;

const STATUS_OPTIONS = [
  { label: "全部", value: "ALL" },
  { label: "待审核", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "已拒绝", value: "REJECTED" },
];

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  PENDING: { color: "orange", label: "待审核" },
  APPROVED: { color: "green", label: "已通过" },
  REJECTED: { color: "red", label: "已拒绝" },
};

interface Comment {
  id: number;
  content: string;
  articleId: number;
  status: string;
  createdAt: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchComments = (p: number, s: string) => {
    setLoading(true);
    api.get("/api/v1/admin/comments", { params: { page: p, size: 20, status: s } })
      .then((res) => {
        if (res.data.code === 200) {
          setComments(res.data.data.records || []);
          setTotal(res.data.data.total || 0);
        }
      })
      .catch(() => message.error("加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(page, status); }, [page, status]);

  const handleReview = async (id: number, newStatus: string) => {
    try {
      const res = await api.put(`/api/v1/comments/${id}/status?status=${newStatus}`);
      if (res.data.code === 200) {
        message.success(newStatus === "APPROVED" ? "已通过" : "已驳回");
        fetchComments(page, status);
      } else message.error(res.data.message || "操作失败");
    } catch { message.error("操作失败"); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/api/v1/comments/${id}`);
      if (res.data.code === 200) { message.success("已删除"); fetchComments(page, status); }
      else message.error(res.data.message || "删除失败");
    } catch { message.error("删除失败"); }
  };

  const columns = [
    { title: "内容", dataIndex: "content", key: "content", ellipsis: true, width: 300 },
    { title: "文章ID", dataIndex: "articleId", key: "articleId", width: 80 },
    {
      title: "状态", dataIndex: "status", key: "status", width: 100,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] || { color: "default", label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "时间", dataIndex: "createdAt", key: "createdAt", width: 170,
      render: (t: string) => t?.slice(0, 16).replace("T", " ") || "-",
    },
    {
      title: "操作", key: "action", width: 240,
      render: (_: unknown, record: Comment) => (
        <Space size="small">
          {record.status !== "APPROVED" && (
            <Button type="link" size="small" style={{ color: "#52c41a" }}
              onClick={() => handleReview(record.id, "APPROVED")}>通过</Button>
          )}
          {record.status !== "REJECTED" && (
            <Button type="link" size="small" style={{ color: "#ff4d4f" }}
              onClick={() => handleReview(record.id, "REJECTED")}>驳回</Button>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>评论审核</Title>
        <Select value={status} onChange={(val) => { setStatus(val); setPage(1); }}
          options={STATUS_OPTIONS} style={{ width: 120 }} />
      </div>
      <Table rowKey="id" columns={columns} dataSource={comments} loading={loading}
        pagination={{
          current: page, total, pageSize: 20,
          showTotal: (t: number) => `共 ${t} 条`,
          onChange: (p: number) => setPage(p),
        }} />
    </div>
  );
}
