"use client";

import { useEffect, useState, Suspense } from "react";
import { List, Typography, Spin, Empty, Pagination, Skeleton, Card, Row, Col, message, Divider } from "antd";
import {
  GithubOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";

const { Title, Text, Paragraph } = Typography;

// ------ 个人信息（改成你自己的） ------
const PROFILE = {
  name: "Xsha",
  avatar: "", // 留空显示首字母头像
  bio: "全栈开发者 · 写代码也写文字",
  location: "China",
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

  // ====== 加载骨架屏 ======
  if (loading) {
    return (
      <div>
        <div style={{
          background: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
          borderRadius: 16, padding: "48px 32px", marginBottom: 32,
          textAlign: "center",
        }}>
          <Skeleton.Avatar size={80} active style={{ marginBottom: 16 }} />
          <Skeleton title={{ style: { margin: "0 auto 8px" } }} paragraph={{ rows: 1 }} active />
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
      {/* ====== 个人主页 Banner ====== */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRadius: 16,
        padding: "56px 32px",
        marginBottom: 40,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* 背景装饰圆 */}
        <div style={{
          position: "absolute", top: -60, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -30,
          width: 240, height: 240, borderRadius: "50%",
          background: "rgba(255,255,255,0.02)",
        }} />

        {/* 头像 */}
        {PROFILE.avatar ? (
          <img src={PROFILE.avatar} alt={PROFILE.name}
            style={{
              width: 96, height: 96, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.2)",
              objectFit: "cover", marginBottom: 20,
              position: "relative", zIndex: 1,
            }} />
        ) : (
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 700, color: "#fff",
            margin: "0 auto 20px", position: "relative", zIndex: 1,
            border: "3px solid rgba(255,255,255,0.2)",
          }}>
            {PROFILE.name.charAt(0)}
          </div>
        )}

        {/* 名字 + 简介 */}
        <Title level={2} style={{ color: "#fff", margin: "0 0 8px", position: "relative", zIndex: 1 }}>
          {PROFILE.name}
        </Title>
        <Paragraph style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 20, position: "relative", zIndex: 1 }}>
          {PROFILE.bio}
        </Paragraph>

        {/* 数据行 */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap",
          color: "rgba(255,255,255,0.6)", fontSize: 14, position: "relative", zIndex: 1,
        }}>
          <span><CalendarOutlined /> 共 {total} 篇文章</span>
          <span><EnvironmentOutlined /> {PROFILE.location}</span>
          <a href={PROFILE.github} target="_blank" rel="noopener noreferrer"
            style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
            <GithubOutlined /> GitHub
          </a>
        </div>
      </div>

      {/* ====== 文章列表 ====== */}
      {articles.length === 0 ? (
        <Empty description="暂无文章" style={{ marginTop: 60 }} />
      ) : (
        <>
          <Divider orientation="left" style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ fontSize: 14, letterSpacing: 2 }}>最新文章</Text>
          </Divider>
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
