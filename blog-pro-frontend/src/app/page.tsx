"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, List, Space, Typography, Spin, Empty } from "antd";
import { EyeOutlined, LikeOutlined, CommentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

const { Paragraph } = Typography;

interface Article {
  id: number; title: string; slug: string; summary: string; coverImageUrl: string;
  viewCount: number; likeCount: number; commentCount: number; publishedAt: string;
}

export default function HomePage() {
  return (
    <Suspense fallback={<Spin size="large" style={{ display: "block", marginTop: 100 }} />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  useEffect(() => {
    setLoading(true);
    const params: any = { page: 1, size: 10 };
    if (categoryId) params.categoryId = categoryId;
    api.get("/api/v1/articles", { params })
      .then((res) => {
        if (res.data.code === 200) setArticles(res.data.data.records || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) return <Spin size="large" style={{ display: "block", marginTop: 100 }} />;
  if (!articles.length) return <Empty description="暂无文章" style={{ marginTop: 100 }} />;

  return (
    <List
      grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3 }}
      dataSource={articles}
      renderItem={(a) => (
        <List.Item>
          <Card
            hoverable
            onClick={() => router.push(`/articles/${a.slug}`)}
            cover={
              a.coverImageUrl ? (
                <img alt={a.title} src={a.coverImageUrl} style={{ height: 180, objectFit: "cover" }} />
              ) : (
                <div style={{ height: 180, background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 48 }}>📝</span>
                </div>
              )
            }
          >
            <Card.Meta
              title={a.title}
              description={
                <div>
                  <Paragraph ellipsis={{ rows: 2 }} type="secondary">{a.summary || "暂无摘要"}</Paragraph>
                  <Space style={{ marginTop: 8 }} size={12}>
                    <span><EyeOutlined /> {a.viewCount}</span>
                    <span><LikeOutlined /> {a.likeCount}</span>
                    <span><CommentOutlined /> {a.commentCount}</span>
                    <span><ClockCircleOutlined /> {a.publishedAt?.slice(0, 10) || "草稿"}</span>
                  </Space>
                </div>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );
}
