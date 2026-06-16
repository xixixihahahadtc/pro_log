"use client";

import { useEffect, useState, Suspense } from "react";
import { List, Spin, Empty } from "antd";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";

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
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page: 1, size: 10 };
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
          <ArticleCard article={a} />
        </List.Item>
      )}
    />
  );
}
