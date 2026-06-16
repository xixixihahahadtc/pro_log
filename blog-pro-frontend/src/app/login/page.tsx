"use client";

import { useState } from "react";
import { Card, Form, Input, Button, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const err = await login(values.username, values.password);
      if (err) message.error(err);
      else {
        message.success("登录成功");
        router.push("/");
      }
    } catch {
      message.error("网络错误，请检查后端是否启动");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <Card>
        <Title level={3} style={{ textAlign: "center" }}>登录 AI Blog Pro</Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
        <Text type="secondary">还没有账号？<a onClick={() => router.push("/register")}>立即注册</a></Text>
      </Card>
    </div>
  );
}
