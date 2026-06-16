"use client";

import { useEffect, useState } from "react";
import { Card, Col, Row, Statistic, Table, Spin, Typography, message } from "antd";
import {
  FileTextOutlined,
  CommentOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import api from "@/lib/api";

const { Title } = Typography;

interface Stats {
  totalArticles: number;
  totalComments: number;
  totalUsers: number;
  totalViews: number;
  recentArticles: {
    id: number;
    title: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/articles/admin/stats")
      .then((res) => {
        if (res.data.code === 200) setStats(res.data.data);
      })
      .catch(() => { message.error("加载统计数据失败"); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;
  if (!stats) return <div style={{ textAlign: "center", marginTop: 80 }}>加载失败</div>;

  const recentColumns = [
    { title: "标题", dataIndex: "title", key: "title", ellipsis: true },
    {
      title: "发布时间", dataIndex: "publishedAt", key: "publishedAt", width: 170,
      render: (t: string) => t?.slice(0, 16).replace("T", " ") || "-",
    },
    { title: "浏览", dataIndex: "viewCount", key: "viewCount", width: 70 },
    { title: "点赞", dataIndex: "likeCount", key: "likeCount", width: 70 },
    { title: "评论", dataIndex: "commentCount", key: "commentCount", width: 70 },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>仪表盘</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="文章总数" value={stats.totalArticles} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="评论总数" value={stats.totalComments} prefix={<CommentOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="注册用户" value={stats.totalUsers} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="总浏览量" value={stats.totalViews} prefix={<EyeOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card title="最近发布的文章">
        <Table rowKey="id" columns={recentColumns} dataSource={stats.recentArticles} pagination={false} />
      </Card>
    </div>
  );
}
