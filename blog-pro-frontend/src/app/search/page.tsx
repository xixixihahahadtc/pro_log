"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, List, Space, Typography, Spin, Empty } from "antd";
import { EyeOutlined, LikeOutlined, CommentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

const { Title, Paragraph, Text } = Typography;

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    api.get(`/api/v1/articles/search?q=${encodeURIComponent(query)}&page=1&size=20`)
      .then((res) => {
        if (res.data.code === 200) setArticles(res.data.data.records || []);
      })
      .catch(() => {})
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
                  title={highlightMatch(a.title, query)}
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }} type="secondary">
                        {a.summary ? highlightMatch(a.summary, query) : "暂无摘要"}
                      </Paragraph>
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
      )}
    </div>
  );
}

function highlightMatch(text: string, keyword: string) {
  if (!keyword || !text) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <Text key={i} mark>{part}</Text> : part
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spin size="large" style={{ display: "block", marginTop: 100 }} />}>
      <SearchContent />
    </Suspense>
  );
}
