"use client";

import { useEffect, useState } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider, Layout, Menu, Button, Space, Input, Tabs } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AiChat from "@/components/AiChat";
import api from "@/lib/api";
import "./globals.css";

const { Header, Content, Footer } = Layout;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const { isLoggedIn, nickname, logout } = useAuthStore();
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState<{label:string, value:string}[]>([]);

  useEffect(() => {
    api.get("/api/v1/categories").then((res) => {
      if (res.data.code === 200) {
        const cats: {label:string, value:string}[] = [];
        function walk(nodes: any[]) {
          for (const node of nodes) {
            cats.push({ label: node.name, value: String(node.id) });
            if (node.children) walk(node.children);
          }
        }
        walk(res.data.data || []);
        setCategories(cats);
      }
    }).catch(() => {});
  }, []);

  const menuItems = [
    { key: "/", label: "首页" },
    ...(isLoggedIn
      ? [{ key: "/admin", label: "管理" }]
      : []),
  ];

  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider theme={{ token: { colorPrimary: "#1677ff" } }}>
            <Layout style={{ minHeight: "100vh" }}>
              <Header
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Menu
                  theme="dark"
                  mode="horizontal"
                  selectedKeys={[pathname]}
                  items={menuItems}
                  onClick={({ key }) => router.push(key)}
                  style={{ flex: 1 }}
                />
                <div style={{ flex: 1, display: "flex", justifyContent: "center", maxWidth: 400 }}>
                  <Input.Search
                    placeholder="搜索文章..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onSearch={(val) => {
                      if (val.trim()) {
                        router.push(`/search?q=${encodeURIComponent(val.trim())}`);
                        setSearchText("");
                      }
                    }}
                    enterButton={<SearchOutlined />}
                    style={{ width: "100%" }}
                  />
                </div>
                <Space>
                  {isLoggedIn ? (
                    <>
                      <span style={{ color: "#fff" }}>👤 {nickname}</span>
                      <Button size="small" onClick={logout}>
                        退出
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="small" onClick={() => router.push("/login")}>
                        登录
                      </Button>
                      <Button size="small" type="primary" onClick={() => router.push("/register")}>
                        注册
                      </Button>
                    </>
                  )}
                </Space>
              </Header>
              {/* 分类导航条 — 所有页面可见 */}
              {categories.length > 0 && (
                <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 24px" }}>
                  <Tabs
                    activeKey={currentCategory || "all"}
                    onChange={(key) => {
                      if (key === "all") router.push("/");
                      else router.push(`/?category=${key}`);
                    }}
                    items={[
                      { key: "all", label: "全部" },
                      ...categories.map((c) => ({ key: c.value, label: c.label })),
                    ]}
                    style={{ marginBottom: 0 }}
                    size="small"
                  />
                </div>
              )}
              <Content style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                <App>{children}</App>
              </Content>
              <AiChat />
              <Footer style={{ textAlign: "center" }}>
                AI Blog Pro © 2026 — 企业级 AI 博客平台
              </Footer>
            </Layout>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
