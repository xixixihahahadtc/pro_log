"use client";

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Popconfirm, message, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { Title } = Typography;

interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form] = Form.useForm();

  const fetchTags = () => {
    setLoading(true);
    api.get("/api/v1/tags")
      .then((res) => {
        if (res.data.code === 200) setTags(res.data.data || []);
      })
      .catch(() => message.error("加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTags(); }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    form.setFieldsValue(tag);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/api/v1/tags/${editing.id}`, values);
        message.success("已更新");
      } else {
        await api.post("/api/v1/tags", values);
        message.success("已创建");
      }
      setModalOpen(false);
      fetchTags();
    } catch { message.error("操作失败"); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/api/v1/tags/${id}`);
      if (res.data.code === 200) { message.success("已删除"); fetchTags(); }
      else message.error(res.data.message || "删除失败");
    } catch { message.error("删除失败"); }
  };

  const columns = [
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    {
      title: "创建时间", dataIndex: "createdAt", key: "createdAt", width: 180,
      render: (t: string) => t?.slice(0, 16).replace("T", " ") || "-",
    },
    {
      title: "操作", key: "action", width: 180,
      render: (_: unknown, record: Tag) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>标签管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增标签</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={tags} loading={loading} pagination={false} />
      <Modal title={editing ? "编辑标签" : "新增标签"} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
