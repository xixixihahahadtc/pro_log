"use client";

import { Card, Space, Typography } from "antd";
import { EyeOutlined, LikeOutlined, CommentOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Paragraph } = Typography;

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl: string;
  authorId: number;
  authorName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
}

/** 高亮关键词 */
function highlightMatch(text: string, keyword: string) {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <Typography.Text key={i} mark>{part}</Typography.Text>
      : part
  );
}

export default function ArticleCard({
  article,
  keyword,
}: {
  article: Article;
  keyword?: string;
}) {
  const router = useRouter();

  return (
    <Card
      hoverable
      onClick={() => router.push(`/articles/${article.slug}`)}
      cover={
        article.coverImageUrl ? (
          <img
            alt={article.title}
            src={article.coverImageUrl}
            style={{ height: 180, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              height: 180,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 48 }}>📝</span>
          </div>
        )
      }
    >
      <Card.Meta
        title={keyword ? highlightMatch(article.title, keyword) : article.title}
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }} type="secondary">
              {keyword
                ? highlightMatch(article.summary || "暂无摘要", keyword)
                : (article.summary || "暂无摘要")}
            </Paragraph>
            <Space style={{ marginTop: 8 }} size={12}>
              <a onClick={(e) => { e.stopPropagation(); router.push(`/user/${article.authorId}`); }}
            style={{ color: "#1677ff", cursor: "pointer" }}>{article.authorName}</a>
              <span><EyeOutlined /> {article.viewCount}</span>
              <span><LikeOutlined /> {article.likeCount}</span>
              <span><CommentOutlined /> {article.commentCount}</span>
              <span>
                <ClockCircleOutlined />{" "}
                {article.publishedAt?.slice(0, 10) || "草稿"}
              </span>
            </Space>
          </div>
        }
      />
    </Card>
  );
}
