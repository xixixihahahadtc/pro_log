"use client";

import { useEffect, useState, Suspense } from "react";
import { List, Typography, Spin, Empty, Pagination, Skeleton, Card, Row, Col, message, Divider } from "antd";
import { GithubOutlined } from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";

const { Title, Text } = Typography;

const PROFILE = {
  name: "Xsha",
  bio: "全栈开发者，写代码也写文字。",
  github: "https://github.com/xixixihahahadtc",
};

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
        <div style={{ marginBottom: 48 }}>
          <Skeleton title={{ width: 120 }} paragraph={{ rows: 1, width: 200 }} active />
        </div>
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
      {/* ====== 极简头部 ====== */}
      <div style={{ marginBottom: 48 }}>
        <Title level={2} style={{ marginBottom: 4, fontWeight: 600 }}>
          {PROFILE.name}
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          {PROFILE.bio}{" "}
          <a href={PROFILE.github} target="_blank" rel="noopener noreferrer"
            style={{ color: "inherit", marginLeft: 4 }}>
            <GithubOutlined />
          </a>
        </Text>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {total} 篇文章
          </Text>
        </div>
      </div>

      {/* ====== 文章列表 ====== */}
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
