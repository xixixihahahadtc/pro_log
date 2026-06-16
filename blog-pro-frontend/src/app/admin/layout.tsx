"use client";

import { useEffect } from "react";
import { Layout, Menu } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const { Sider, Content } = Layout;

const menuItems = [
  { key: "/admin", label: "写文章" },
  { key: "/admin/articles", label: "文章管理" },
  { key: "/admin/drafts", label: "草稿箱" },
  { key: "/admin/comments", label: "评论管理", disabled: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn, router]);

  return (
    <Layout style={{ minHeight: "calc(100vh - 64px - 70px)" }}>
      <Sider
        width={180}
        style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
      >
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ height: "100%", paddingTop: 8 }}
        />
      </Sider>
      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}
