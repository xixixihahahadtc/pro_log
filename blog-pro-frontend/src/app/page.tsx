"use client";

import { useEffect, useState, Suspense } from "react";
import { List, Typography, Spin, Empty, Pagination, Skeleton, Card, Row, Col, message } from "antd";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";

const { Title, Text } = Typography;

interface Article {
  id: number; title: string; slug: string; summary: string; coverImageUrl: string;
  authorId: number; authorName: string; viewCount: number; likeCount: number; commentCount: number; publishedAt: string;
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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  useEffect(() => {
    setFetching(true);
    const params: Record<string, string | number> = { page, size: 9 };
    if (categoryId) params.categoryId = categoryId;
    api.get("/api/v1/articles", { params })
      .then((res) => {
        if (res.data.code === 200) {
          setArticles(res.data.data.records || []);
          setTotal(res.data.data.total || 0);
        }
      })
      .catch(() => { message.error("加载文章失败"); })
      .finally(() => { setLoading(false); setFetching(false); });
  }, [page, categoryId]);

  useEffect(() => { setPage(1); }, [categoryId]);

  if (loading) {
    return (
      <div>
        <Skeleton title style={{ marginBottom: 24, width: 160 }} active />
        <Row gutter={[24, 24]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Col xs={24} sm={24} md={12} lg={8} key={i}>
              <Card>
                <Skeleton.Image style={{ width: "100%", height: 180 }} active />
                <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 12 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>最新文章</Title>
        <Text type="secondary">共 {total} 篇</Text>
      </div>

      {articles.length === 0 ? (
        <Empty description="暂无文章" style={{ marginTop: 60 }} />
      ) : (
        <>
          <div style={{ opacity: fetching ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <List
              grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3 }}
              dataSource={articles}
              renderItem={(a) => (
                <List.Item>
                  <ArticleCard article={a} />
                </List.Item>
              )}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <Pagination
              current={page} total={total} pageSize={9}
              onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              showTotal={(t) => `共 ${t} 篇`}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
