"use client";

import { useEffect, useState } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider, Layout, Menu, Button, Space, Input, Tabs } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import AiChat from "@/components/AiChat";
import api from "@/lib/api";
import { flattenCategories } from "@/lib/categories";
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
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminPage = pathname.startsWith("/admin");
  const isCleanPage = isAuthPage || isAdminPage; // 不需要首页布局的页面

  useEffect(() => {
    if (!isCleanPage) {
      api.get("/api/v1/categories").then((res) => {
        if (res.data.code === 200) {
          setCategories(flattenCategories(res.data.data || []));
        }
      }).catch(() => {});
    }
  }, [pathname]);

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
              {isCleanPage ? (
                /* 登录/注册/Admin — 极简顶栏 */
                <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#fff", fontSize: 18, fontWeight: 600, cursor: "pointer" }} onClick={() => router.push("/")}>
                    AI Blog Pro
                  </span>
                  <Space>
                    {isLoggedIn ? (
                      <>
                        <span style={{ color: "#fff" }}>{nickname}</span>
                        <Button size="small" onClick={logout}>退出</Button>
                      </>
                    ) : (
                      <Button size="small" onClick={() => router.push("/login")}>登录</Button>
                    )}
                  </Space>
                </Header>
              ) : (
                /* 前台页面 — 完整顶栏 */
                <>
                  <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Menu
                      theme="dark"
                      mode="horizontal"
                      selectedKeys={[pathname]}
                      items={menuItems}
                      onClick={({ key }) => router.push(key)}
                      style={{ flex: 1 }}
                    />
                    <div style={{ flex: 1, display: "flex", justifyContent: "center", maxWidth: 400, marginRight: 38 }}>
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
                          <Button size="small" onClick={logout}>退出</Button>
                        </>
                      ) : (
                        <>
                          <Button size="small" onClick={() => router.push("/login")}>登录</Button>
                          <Button size="small" type="primary" onClick={() => router.push("/register")}>注册</Button>
                        </>
                      )}
                    </Space>
                  </Header>
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
                </>
              )}
              <Content style={isCleanPage ? { padding: 0 } : { padding: "24px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                <App>{children}</App>
              </Content>
              {!isCleanPage && <AiChat />}
              {!isCleanPage && (
                <Footer style={{ textAlign: "center" }}>
                  AI Blog Pro © 2026 — 企业级 AI 博客平台
                </Footer>
              )}
            </Layout>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
