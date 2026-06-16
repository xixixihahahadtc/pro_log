"use client";

import { useEffect, useState } from "react";
import { Typography, Spin, Card, Divider, Space, Button, message, Input, List, Avatar } from "antd";
import { EyeOutlined, LikeOutlined, CommentOutlined, ClockCircleOutlined, ArrowLeftOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const { Title, Paragraph, Text } = Typography;

interface Article { id: number; title: string; content: string; viewCount: number; likeCount: number; commentCount: number; publishedAt: string; }

interface Comment { id: number; content: string; status: string; createdAt: string; userId: number; parentId: number | null; }

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get(`/api/v1/articles/${slug}`).then((res) => {
      if (res.data.code === 200 && res.data.data) {
        const a = res.data.data;
        setArticle(a);
        // 加载评论
        api.get(`/api/v1/articles/${a.id}/comments?page=1&size=50`)
          .then((r) => { if (r.data.code === 200) setComments(r.data.data.records || []); })
          .catch(() => {});
        // 查询当前用户点赞状态
        if (isLoggedIn) {
          api.get(`/api/v1/articles/${a.id}/liked`)
            .then((r) => { if (r.data.code === 200) setLiked(r.data.data); })
            .catch(() => {});
        }
      }
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (!article) return;
    if (!isLoggedIn) { message.error("请先登录"); return; }
    try {
      const res = await api.post(`/api/v1/articles/${article.id}/like`);
      if (res.data.code === 200) {
        const nowLiked = res.data.data; // true=点赞, false=取消
        setLiked(nowLiked);
        setArticle({ ...article, likeCount: nowLiked ? article.likeCount + 1 : article.likeCount - 1 });
      }
    } catch { message.error("操作失败"); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !article) return;
    if (!isLoggedIn) { message.error("请先登录"); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/articles/${article.id}/comments`, { content: commentText });
      if (res.data.code === 200) {
        message.success("评论成功，等待审核");
        setCommentText("");
        setComments([res.data.data, ...comments]);
        setArticle({ ...article, commentCount: article.commentCount + 1 });
      }
    } catch { message.error("评论失败"); }
    setSubmitting(false);
  };

  if (loading) return <Spin size="large" style={{ display: "block", marginTop: 100 }} />;
  if (!article) return <div style={{ textAlign: "center", marginTop: 100 }}>文章不存在</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/")} style={{ marginBottom: 16 }}>返回首页</Button>
      <Card>
        <Title>{article.title}</Title>
        <Space size={16} style={{ marginBottom: 16, color: "#999" }}>
          <span><ClockCircleOutlined /> {article.publishedAt?.slice(0, 10)}</span>
          <span><EyeOutlined /> {article.viewCount}</span>
          <span><LikeOutlined /> {article.likeCount}</span>
          <span><CommentOutlined /> {article.commentCount}</span>
          <Button
            icon={<LikeOutlined />}
            onClick={handleLike}
            type={liked ? "primary" : "default"}
          >
            {liked ? "已点赞" : "点赞"}
          </Button>
        </Space>
        <Divider />
        <div style={{ fontSize: 16, lineHeight: 2 }} dangerouslySetInnerHTML={{ __html: article.content }} />
      </Card>

      {/* 评论区 */}
      <Card title={`评论 (${comments.length})`} style={{ marginTop: 24 }}>
        {/* 发评论 */}
        <Space.Compact style={{ width: "100%", marginBottom: 24 }}>
          <Input
            placeholder={isLoggedIn ? "写下你的评论..." : "请先登录后再评论"}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onPressEnter={handleComment}
            disabled={!isLoggedIn}
            size="large"
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleComment} loading={submitting} disabled={!isLoggedIn} size="large">
            发送
          </Button>
        </Space.Compact>

        {/* 评论列表 */}
        <List
          dataSource={comments}
          locale={{ emptyText: "暂无评论，来抢沙发吧~" }}
          renderItem={(c) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<Text type="secondary">{c.createdAt?.slice(0, 16).replace("T", " ")} · {c.status === "PENDING" ? "⏳ 审核中" : ""}</Text>}
                description={<div style={{ fontSize: 15, color: "#333", marginTop: 4 }}>{c.content}</div>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
