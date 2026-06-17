"use client";

import { useEffect, useState } from "react";
import { List, Typography, Spin, Empty, Card, Row, Col, Skeleton, Divider } from "antd";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";

const { Title, Text } = Typography;

interface UserInfo {
  id: number; username: string; nickname: string; createdAt: string;
}

interface Article {
  id: number; title: string; slug: string; summary: string; coverImageUrl: string;
  authorName: string; viewCount: number; likeCount: number; commentCount: number; publishedAt: string;
}

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/user/${id}`),
      api.get("/api/v1/articles", { params: { authorId: id, page: 1, size: 20 } }),
    ]).then(([userRes, articlesRes]) => {
      if (userRes.data.code === 200) setUser(userRes.data.data);
      if (articlesRes.data.code === 200) setArticles(articlesRes.data.data.records || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: "block", marginTop: 80 }} />;
  if (!user) return <Empty description="用户不存在" style={{ marginTop: 80 }} />;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 16,
        }}>
          {(user.nickname || user.username).charAt(0).toUpperCase()}
        </div>
        <Title level={3} style={{ margin: "0 0 4px" }}>{user.nickname || user.username}</Title>
        <Text type="secondary">@{user.username}</Text>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            <CalendarOutlined /> {user.createdAt?.slice(0, 10)} 加入
            {" · "}
            <FileTextOutlined /> {articles.length} 篇文章
          </Text>
        </div>
      </div>

      <Divider />

      {articles.length === 0 ? (
        <Empty description="暂无文章" />
      ) : (
        <List
          grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3 }}
          dataSource={articles}
          renderItem={(a) => (
            <List.Item>
              <ArticleCard article={a} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
