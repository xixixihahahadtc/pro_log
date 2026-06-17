"use client";

import { useEffect, useState, Suspense } from "react";
import { List, Typography, Spin, Empty, message } from "antd";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";

const { Title, Text } = Typography;

interface Article {
  id: number; title: string; slug: string; summary: string; coverImageUrl: string;
  authorName: string; viewCount: number; likeCount: number; commentCount: number; publishedAt: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    api.get(`/api/v1/articles/search?q=${encodeURIComponent(query)}&page=1&size=20`)
      .then((res) => {
        if (res.data.code === 200) setArticles(res.data.data.records || []);
      })
      .catch(() => { message.error("搜索失败"); })
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return <Spin size="large" style={{ display: "block", marginTop: 100 }} />;

  return (
    <div>
      <Title level={2} style={{ marginBottom: 8 }}>
        搜索结果：{query}
      </Title>
      <Text type="secondary" style={{ marginBottom: 24, display: "block" }}>
        共找到 {articles.length} 篇文章
      </Text>
      {!articles.length ? (
        <Empty description="未找到相关文章" style={{ marginTop: 60 }} />
      ) : (
        <List
          grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3 }}
          dataSource={articles}
          renderItem={(a) => (
            <List.Item>
              <ArticleCard article={a} keyword={query} />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spin size="large" style={{ display: "block", marginTop: 100 }} />}>
      <SearchContent />
    </Suspense>
  );
}
